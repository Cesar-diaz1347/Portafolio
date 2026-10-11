USE Ficticios;
GO

IF OBJECT_ID('tempdb..#candidatos') IS NOT NULL DROP TABLE #candidatos;
IF OBJECT_ID('tempdb..#filtrado')   IS NOT NULL DROP TABLE #filtrado;
GO

DECLARE @YY             INT = 2026,
        @MM             INT = 7,
        @INDICEID       INT = 1455,
        @USUARIOID      INT = 91720,
        @PUNTAJEMAX     DECIMAL(18,2),
        @Cumplimiento   INT,
        @Nota           DECIMAL(18,2),
        @AplicarBorrado BIT = 0;   -- 0 = previsualiza el paso 2 | 1 = ejecuta el DELETE

DECLARE @acumulado  DECIMAL(18,2) = 0,
        @faltante   DECIMAL(18,2),
        @orden      INT = 0,
        @selDm      BIGINT = NULL,
        @selPuntos  DECIMAL(18,2),
        @selAporte  DECIMAL(18,2);

-- Tope dinamico por indice. NO se usa PuntosAsignar.PuntajeMax.
SELECT @PUNTAJEMAX = PuntajeMax
FROM dbo.Indices
WHERE IndiceId = @INDICEID;


IF @PUNTAJEMAX IS NULL
BEGIN
    RAISERROR('Abortado: el indice %d no tiene PuntajeMax en dbo.Indices.', 16, 1, @INDICEID);
    RETURN;
END

IF NOT EXISTS (SELECT 1 FROM dbo.PuntosAsignar WHERE IndiceId = @INDICEID)
BEGIN
    RAISERROR('Abortado: el indice %d no tiene escala en dbo.PuntosAsignar.', 16, 1, @INDICEID);
    RETURN;
END


/* =============================================================================
  Combinacion de cuentas
   ============================================================================= */

SELECT
    d.Indicador,
    r.DataMartId,
    r.UsuarioId,
    r.IndiceId,
    r.yy,
    r.mm,
    d.Monto,
    pa.Puntos
INTO #candidatos
FROM dbo.RegistrosValidos r
INNER JOIN dbo.Datamart d
    ON r.DataMartId = d.Id
INNER JOIN dbo.PuntosAsignar pa
    ON r.IndiceId = pa.IndiceId
   AND d.Monto BETWEEN pa.LimiteInf AND pa.LimiteSup
WHERE r.yy        = @YY
  AND r.mm        = @MM
  AND r.IndiceId  = @INDICEID   -- solo registros asignados a este indice
  AND r.UsuarioId = @USUARIOID;

CREATE TABLE #filtrado
(
    orden       INT,
    Indicador   BIGINT,
    DataMartId  BIGINT,
    UsuarioId   INT,
    IndiceId    INT,
    yy          INT,
    mm          INT,
    Monto       DECIMAL(18,4),
    Puntos      DECIMAL(18,2),
    aporte      DECIMAL(18,2)
);

-- SEMILLA: el indicador de mayor Monto siempre entra.
SELECT TOP 1
       @selDm     = DataMartId,
       @selPuntos = Puntos
FROM #candidatos
ORDER BY Monto DESC, Indicador;

WHILE @selDm IS NOT NULL
BEGIN
    SET @orden += 1;

    -- Aporte real al tope: entero si cabe, o solo lo que faltaba.
    SET @selAporte = CASE WHEN @acumulado + @selPuntos <= @PUNTAJEMAX
                          THEN @selPuntos
                          ELSE @PUNTAJEMAX - @acumulado
                     END;

    INSERT INTO #filtrado
        (orden, Indicador, DataMartId, UsuarioId, IndiceId, yy, mm, Monto, Puntos, aporte)
    SELECT TOP 1
        @orden, Indicador, DataMartId, UsuarioId, IndiceId, yy, mm, Monto, Puntos, @selAporte
    FROM #candidatos
    WHERE DataMartId = @selDm;

    SET @acumulado += @selAporte;
    DELETE FROM #candidatos WHERE DataMartId = @selDm;

    SET @selDm = NULL;

    -- RELLENO: la cuenta que mejor se ajuste a los puntos que faltan.
    IF @acumulado < @PUNTAJEMAX
    BEGIN
        SET @faltante = @PUNTAJEMAX - @acumulado;

        SELECT TOP 1
               @selDm     = DataMartId,
               @selPuntos = Puntos
        FROM #candidatos
        ORDER BY
            -- 1) las que cubren el faltante van primero
            CASE WHEN Puntos >= @faltante THEN 0 ELSE 1 END,
            -- 2) de las que cubren, la de menor puntaje (la que menos se pasa);
            --    de las que no cubren, la de mayor puntaje (la que mas acerca)
            CASE WHEN Puntos >= @faltante THEN Puntos ELSE -Puntos END,
            Monto DESC,
            Indicador;
    END
END

SELECT @Cumplimiento = COUNT(Indicador),
       @Nota         = ISNULL(SUM(aporte), 0)
FROM #filtrado;

-- Detalle de la combinacion elegida, en el orden en que se fue armando
SELECT orden, Indicador, Monto, Puntos, aporte
FROM #filtrado
ORDER BY orden;

SELECT @PUNTAJEMAX   AS Tope,
       @Cumplimiento AS Cumplimiento,
       @Nota         AS Nota,
       (SELECT ISNULL(SUM(Puntos), 0) FROM #filtrado) AS PuntosBrutos;


/* =============================================================================
   PASO 2  -  Depuracion de RegistrosValidos
   -----------------------------------------------------------------------------
   Borra las filas del usuario para ese anio/mes/indice que no quedaron en la
   combinacion. El filtro por @INDICEID mantiene intactas las filas de los demas
   indices (p.ej. el 634).
   ============================================================================= */

IF @AplicarBorrado = 0
BEGIN
    SELECT 'PREVIEW: se borrarian estas filas' AS accion,
           r.Id, r.YY, r.MM, r.IndiceId, r.UsuarioId,
           r.Indicador, r.DataMartId
    FROM dbo.RegistrosValidos r
    WHERE r.yy        = @YY
      AND r.mm        = @MM
      AND r.IndiceId  = @INDICEID
      AND r.UsuarioId = @USUARIOID
      AND NOT EXISTS (
              SELECT 1
              FROM #filtrado f
              WHERE f.DataMartId = r.DataMartId
                AND f.UsuarioId  = r.UsuarioId
                AND f.IndiceId   = r.IndiceId
                AND f.yy         = r.yy
                AND f.mm         = r.mm
          )
    ORDER BY r.Indicador;
END
ELSE
BEGIN
    DELETE r
    FROM dbo.RegistrosValidos r
    WHERE r.yy        = @YY
      AND r.mm        = @MM
      AND r.IndiceId  = @INDICEID
      AND r.UsuarioId = @USUARIOID
      AND NOT EXISTS (
              SELECT 1
              FROM #filtrado f
              WHERE f.DataMartId = r.DataMartId
                AND f.UsuarioId  = r.UsuarioId
                AND f.IndiceId   = r.IndiceId
                AND f.yy         = r.yy
                AND f.mm         = r.mm
          );

    SELECT @@ROWCOUNT AS filas_borradas;
END
GO
