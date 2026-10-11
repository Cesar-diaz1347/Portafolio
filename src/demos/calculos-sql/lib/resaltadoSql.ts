/**
 * Resaltado de T-SQL sin dependencias: parte cada línea en tokens con su tipo (palabra clave,
 * tipo de dato, función, cadena, comentario, número, @variable o #temporal). No valida SQL: solo
 * colorea. Es sin pérdida: unir el texto de los tokens de una línea devuelve la línea original.
 */

export type TipoToken =
  | 'palabra'
  | 'tipo'
  | 'funcion'
  | 'cadena'
  | 'comentario'
  | 'numero'
  | 'variable'
  | 'temporal'
  | 'texto'

export interface Token {
  readonly tipo: TipoToken
  readonly texto: string
}

const PALABRAS = new Set(
  (
    'ADD ALL ALTER AND AS ASC BEGIN BETWEEN BY CASE CHECK CLUSTERED CONSTRAINT CREATE DECLARE DEFAULT ' +
    'DELETE DESC DISTINCT DROP ELSE END EXEC EXECUTE EXISTS FOREIGN FROM GO GROUP HAVING IDENTITY IF IN ' +
    'INDEX INNER INSERT INTO IS JOIN KEY LEFT LIKE NOT NULL OFF ON OR ORDER OUTER PRIMARY PRINT ' +
    'REFERENCES RETURN RIGHT SELECT SET TABLE THEN TOP TRUNCATE UNION UNIQUE UPDATE USE VALUES WHEN ' +
    'WHERE WHILE WITH'
  ).split(' '),
)

const TIPOS = new Set(
  (
    'INT BIGINT SMALLINT TINYINT BIT DECIMAL NUMERIC FLOAT REAL MONEY DATE DATETIME DATETIME2 VARCHAR ' +
    'NVARCHAR CHAR NCHAR TEXT'
  ).split(' '),
)

const FUNCIONES = new Set(
  'AVG CAST COALESCE CONVERT COUNT GETDATE ISNULL MAX MIN OBJECT_ID RAISERROR ROW_NUMBER SUM'.split(' '),
)

/**
 * Un token por coincidencia, de izquierda a derecha. `(.)` recoge cualquier otro carácter, así
 * que el escaneo nunca se atasca. La cadena sin cerrar llega hasta el final de la línea.
 */
const PATRON =
  /(--.*)|(\/\*)|('(?:[^']|'')*'?)|(@@?[A-Za-z_]\w*)|(#{1,2}[A-Za-z_]\w*)|(0x[0-9A-Fa-f]+|\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(\s+)|(.)/y

function clasificarIdentificador(palabra: string, trasPunto: boolean): TipoToken {
  if (trasPunto) return 'texto'
  const mayusculas = palabra.toUpperCase()
  if (PALABRAS.has(mayusculas)) return 'palabra'
  if (TIPOS.has(mayusculas)) return 'tipo'
  if (FUNCIONES.has(mayusculas)) return 'funcion'
  return 'texto'
}

/** Una lista de tokens por cada línea del código (separadas por \n o \r\n). */
export function resaltarSql(codigo: string): Token[][] {
  let enComentarioDeBloque = false

  return codigo.split(/\r?\n/).map((linea) => {
    const tokens: Token[] = []
    const agregar = (tipo: TipoToken, texto: string): void => {
      if (texto === '') return
      const ultimo = tokens.at(-1)
      // Lo que no se colorea y los comentarios contiguos se juntan en un solo tramo: menos nodos.
      if (ultimo && ultimo.tipo === tipo && (tipo === 'texto' || tipo === 'comentario')) {
        tokens[tokens.length - 1] = { tipo, texto: ultimo.texto + texto }
      } else {
        tokens.push({ tipo, texto })
      }
    }

    let posicion = 0
    const cerrarComentario = (): void => {
      const fin = linea.indexOf('*/', posicion)
      if (fin === -1) {
        agregar('comentario', linea.slice(posicion))
        posicion = linea.length
      } else {
        agregar('comentario', linea.slice(posicion, fin + 2))
        posicion = fin + 2
        enComentarioDeBloque = false
      }
    }

    while (posicion < linea.length) {
      if (enComentarioDeBloque) {
        cerrarComentario()
        continue
      }
      PATRON.lastIndex = posicion
      const coincidencia = PATRON.exec(linea)
      if (!coincidencia) break // no ocurre: (.) acepta cualquier carácter
      const [texto, comentarioDeLinea, inicioBloque, cadena, variable, temporal, numero, identificador] = coincidencia
      if (comentarioDeLinea !== undefined) {
        agregar('comentario', texto)
      } else if (inicioBloque !== undefined) {
        enComentarioDeBloque = true
        posicion += 2
        agregar('comentario', '/*')
        continue
      } else if (cadena !== undefined) {
        agregar('cadena', texto)
      } else if (variable !== undefined) {
        agregar('variable', texto)
      } else if (temporal !== undefined) {
        agregar('temporal', texto)
      } else if (numero !== undefined) {
        agregar('numero', texto)
      } else if (identificador !== undefined) {
        const anterior = linea.slice(0, posicion).trimEnd().at(-1)
        agregar(clasificarIdentificador(texto, anterior === '.'), texto)
      } else {
        agregar('texto', texto)
      }
      posicion += texto.length
    }
    return tokens
  })
}
