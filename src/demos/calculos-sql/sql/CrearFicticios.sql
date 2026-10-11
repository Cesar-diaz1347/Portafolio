

IF DB_ID('Ficticios') IS NULL
    CREATE DATABASE Ficticios;
GO

USE Ficticios;
GO


/* -----------------------------------------------------------------------------
   Creación de Tablas
   -------------------------------------------------------------------------- */

IF OBJECT_ID('dbo.RegistrosValidos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RegistrosValidos
    (
        Id          BIGINT   IDENTITY(1,1) NOT NULL CONSTRAINT PK_RegistrosValidos PRIMARY KEY,
        YY          INT      NOT NULL,
        MM          INT      NOT NULL,
        IndiceId    INT      NOT NULL,
        UsuarioId   INT      NOT NULL,
        SucursalId  INT      NULL,
        GrupoId     INT      NULL,
        Indicador   BIGINT   NOT NULL,
        ProductoId  INT      NOT NULL,
        DataMartId  BIGINT   NOT NULL,
        fapertura   DATETIME NULL
    );
END
GO

-- Datamart
IF OBJECT_ID('dbo.Datamart', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Datamart
    (
        Id          BIGINT        NOT NULL CONSTRAINT PK_Datamart_Fic PRIMARY KEY,
        yy          INT           NOT NULL,
        mm          INT           NOT NULL,
        Indicador   BIGINT        NOT NULL,
        Monto       DECIMAL(18,4) NOT NULL,
        ProductoId  INT           NOT NULL,
        Usuario     INT           NOT NULL
    );
END
GO

-- PuntosAsignar 
IF OBJECT_ID('dbo.PuntosAsignar', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PuntosAsignar
    (
        Id          INT           NOT NULL CONSTRAINT PK_PuntosAsignar PRIMARY KEY,
        LimiteInf   DECIMAL(18,2) NOT NULL,
        LimiteSup   DECIMAL(18,2) NOT NULL,
        Puntos      DECIMAL(18,2) NOT NULL,
        Factor      DECIMAL(18,2) NOT NULL,
        PuntajeMax  DECIMAL(18,2) NOT NULL,
        IndiceId    INT           NOT NULL
    );
END
GO

-- Indices 
IF OBJECT_ID('dbo.Indices', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Indices
    (
        IndiceId    INT           NOT NULL CONSTRAINT PK_Indices PRIMARY KEY,
        PuntajeMax  DECIMAL(18,2) NOT NULL
    );
END
GO


/* -----------------------------------------------------------------------------
 Datos ficticios
   -------------------------------------------------------------------------- */

/*
La lógica es la siguiente: 
en el datamart hay tres registros de usuario que fueron tomados en cuenta para dos indices diferentes en otro subproceso.
Tal que el objetivo es filtrar solo los que se necesitan(indice 1455) 
y agruparlos con la mejor combinación posilbe para que se obtengan los puntos deseados(8pts).
*/
IF NOT EXISTS (SELECT 1 FROM dbo.Datamart)
BEGIN
    INSERT INTO dbo.Datamart
        (Id, yy, mm, Indicador, Monto, ProductoId, Usuario)
    VALUES
        (973123360, 2026, 7, 6744301200, 11637.2500, 532, 91720),
        (973123363, 2026, 7, 2016185272, 11222.2133, 532, 91720),
        (973123736, 2026, 7, 8026367297,   500.0267, 532, 91720);
END
GO


IF NOT EXISTS (SELECT 1 FROM dbo.RegistrosValidos)
BEGIN
    SET IDENTITY_INSERT dbo.RegistrosValidos ON;

    INSERT INTO dbo.RegistrosValidos
        (Id, YY, MM, IndiceId, UsuarioId, SucursalId, GrupoId, Indicador, ProductoId, DataMartId, fapertura)
    VALUES
        (17588594646, 2026, 7,  634, 91720, 17, 0, 2996185272, 532, 973123363, '20260513'),
        (17588594647, 2026, 7,  634, 91720, 17, 0, 6743501200, 532, 973123360, '20260527'),
        (17588594648, 2026, 7,  634, 91720, 14, 0, 0026367297, 532, 973123736, '20260529'),
        (17588453840, 2026, 7, 1455, 91720, 17, 0, 2016185472, 532, 973123363, '20260513'),
        (17588453845, 2026, 7, 1455, 91720, 17, 0, 9864301200, 532, 973123360, '20260527'),
        (17588594645, 2026, 7, 1455, 91720, 14, 0, 0126367597, 532, 973123736, '20260529');

    SET IDENTITY_INSERT dbo.RegistrosValidos OFF;

    -- Deja la identidad lista para el siguiente insert natural.
    DBCC CHECKIDENT ('dbo.RegistrosValidos', RESEED) WITH NO_INFOMSGS;
END
GO



IF NOT EXISTS (SELECT 1 FROM dbo.PuntosAsignar)
BEGIN
    INSERT INTO dbo.PuntosAsignar
        (Id, LimiteInf, LimiteSup, Puntos, Factor, PuntajeMax, IndiceId)
    VALUES
        (6202,  300.00,             499.99, 2.00, 0.00, 0.00, 1455),
        (6203,  500.00,             999.99, 4.00, 0.00, 0.00, 1455),
        (6204, 1000.00, 999999999999999.99, 5.00, 0.00, 0.00, 1455);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Indices)
BEGIN
    INSERT INTO dbo.Indices (IndiceId, PuntajeMax)
    VALUES (1455, 8.00);
END
GO



