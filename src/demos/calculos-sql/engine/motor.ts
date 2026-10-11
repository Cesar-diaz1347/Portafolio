import { combinarCuentas, type CandidatoInterno } from './combinacion'
import { ESCALA_MONTO, ESCALA_PUNTOS, cabeEnDecimal18, formatearDecimal } from './decimal'
import { compararBigInt, cubreFaltante, filaParaInsertar, ordenRelleno, ordenSemilla } from './orden'
import type {
  Advertencia,
  BloqueSql,
  CandidatoTraza,
  DatasetFicticios,
  FilaDepuracion,
  FilaFiltrado,
  ParametrosConteo,
  PasoTraza,
  ResultadoConteo,
  ResultadoGuarda,
  ResultadoOk,
  VariablesScript,
} from './tipos'
import { validarEntrada, type EntradaInterna, type RegistroInterno } from './validacion'

interface FiltradoInterno {
  orden: number
  fila: CandidatoInterno
  aporte: bigint
}

interface DetallePaso {
  /** Orden del ORDER BY que se acaba de evaluar, para numerar el ranking. */
  ranking?: CandidatoInterno[]
  /** @faltante del relleno, para marcar qué candidatos lo cubren. */
  faltante?: bigint
  candidato?: CandidatoInterno
  filtrado?: number
}

/** Una asignación a una variable DECIMAL(18,2) que no cabe: SQL Server fallaría con el error 8115. */
class DesbordamientoDecimal extends Error {
  readonly variable: string

  constructor(variable: string) {
    super(`Desbordamiento aritmético en ${variable}`)
    this.variable = variable
  }
}

/**
 * Ejecuta LogicaConteoYValor_Ficticios.sql sobre los datos y parámetros dados. Devuelve la traza
 * paso a paso y los resultados, el texto exacto del RAISERROR si una guarda aborta, o los errores
 * de entrada si los datos no caben en los tipos de las tablas. No modifica los datos recibidos.
 */
export function ejecutarConteoYValor(dataset: DatasetFicticios, parametros: ParametrosConteo): ResultadoConteo {
  const validacion = validarEntrada(dataset, parametros)
  if (!validacion.ok) return { ok: false, tipo: 'ENTRADA_INVALIDA', errores: validacion.errores }

  try {
    return ejecutar(validacion.entrada)
  } catch (error) {
    if (!(error instanceof DesbordamientoDecimal)) throw error
    return {
      ok: false,
      tipo: 'ENTRADA_INVALIDA',
      errores: [
        {
          campo: 'puntosAsignar',
          mensaje:
            `La cuenta no cabe en ${error.variable} (DECIMAL(18,2)): SQL Server fallaría con el error 8115 ` +
            '(desbordamiento aritmético). Revisa los puntos de la escala y el tope.',
        },
      ],
    }
  }
}

function ejecutar(entrada: EntradaInterna): ResultadoOk | ResultadoGuarda {
  const p = entrada.parametros
  const traza: PasoTraza[] = []
  const filtrado: FiltradoInterno[] = []
  let candidatos: CandidatoInterno[] = []
  let declaradas = false

  // Variables del script (null = NULL).
  let puntajeMax: bigint | null = null
  let cumplimiento: number | null = null
  let nota: bigint | null = null
  let acumulado = 0n
  let faltante: bigint | null = null
  let orden = 0
  let selDm: bigint | null = null
  let selPuntos: bigint | null = null
  let selAporte: bigint | null = null

  function variables(): VariablesScript {
    return {
      yy: p.yy,
      mm: p.mm,
      indiceId: p.indiceId,
      usuarioId: p.usuarioId,
      aplicarBorrado: p.aplicarBorrado,
      puntajeMax: puntosONulo(puntajeMax),
      cumplimiento,
      nota: puntosONulo(nota),
      acumulado: puntos(acumulado),
      faltante: puntosONulo(faltante),
      orden,
      selDm: selDm === null ? null : String(selDm),
      selPuntos: puntosONulo(selPuntos),
      selAporte: puntosONulo(selAporte),
    }
  }

  function paso(bloque: BloqueSql, titulo: string, explicacion: string, detalle: DetallePaso = {}): void {
    const posiciones = new Map(detalle.ranking?.map((candidato, i) => [candidato.clave, i + 1]))
    const marcarCubre = detalle.faltante
    traza.push({
      indice: traza.length,
      bloque,
      titulo,
      explicacion,
      variables: declaradas ? variables() : null,
      candidatos: candidatos.map((candidato) =>
        aCandidatoTraza(
          candidato,
          posiciones.get(candidato.clave) ?? null,
          marcarCubre === undefined ? null : cubreFaltante(candidato, marcarCubre),
        ),
      ),
      filtrado: filtrado.map(aFilaFiltrado),
      resaltado: { candidato: detalle.candidato?.clave ?? null, filtrado: detalle.filtrado ?? null },
    })
  }

  // --- Preparación, parámetros, tope y guardas (líneas 1–40) ------------------------------------
  paso(
    'preparacion',
    'Preparación',
    'USE Ficticios y se borran #candidatos y #filtrado si quedaron de una ejecución anterior.',
  )

  declaradas = true
  paso(
    'parametros',
    'Parámetros y variables',
    `Periodo ${periodo(p.yy, p.mm)}, índice ${p.indiceId}, usuario ${p.usuarioId}. ` +
      `@AplicarBorrado = ${p.aplicarBorrado ? '1: el paso 2 ejecuta el DELETE' : '0: el paso 2 solo previsualiza'}. ` +
      '@acumulado empieza en 0.00 y @selDm en NULL.',
  )

  puntajeMax = entrada.indices.find((indice) => indice.indiceId === p.indiceId)?.puntajeMax ?? null
  paso(
    'tope',
    'Tope del índice',
    puntajeMax === null
      ? `dbo.Indices no tiene el índice ${p.indiceId}: @PUNTAJEMAX queda en NULL.`
      : `@PUNTAJEMAX = ${puntos(puntajeMax)}, de dbo.Indices (no de PuntosAsignar.PuntajeMax).`,
  )

  if (puntajeMax === null) {
    const mensaje = `Abortado: el indice ${p.indiceId} no tiene PuntajeMax en dbo.Indices.`
    paso('guardaTope', 'Abortado: sin tope', `RAISERROR('${mensaje}') y RETURN: el lote termina aquí.`)
    return { ok: false, tipo: 'GUARDA', bloque: 'guardaTope', mensaje, traza }
  }
  const tope = puntajeMax
  paso('guardaTope', 'Guarda del tope', 'El índice tiene tope: la ejecución sigue.')

  const rangosDelIndice = entrada.rangos.filter((rango) => rango.indiceId === p.indiceId).length
  if (rangosDelIndice === 0) {
    const mensaje = `Abortado: el indice ${p.indiceId} no tiene escala en dbo.PuntosAsignar.`
    paso('guardaEscala', 'Abortado: sin escala', `RAISERROR('${mensaje}') y RETURN: el lote termina aquí.`)
    return { ok: false, tipo: 'GUARDA', bloque: 'guardaEscala', mensaje, traza }
  }
  paso('guardaEscala', 'Guarda de la escala', `El índice tiene ${rangosDelIndice} rango(s) en dbo.PuntosAsignar: la ejecución sigue.`)

  // --- #candidatos y #filtrado (líneas 43–80) -----------------------------------------------
  const combinacion = combinarCuentas(entrada)
  candidatos = combinacion.candidatos
  const advertencias: Advertencia[] = [...combinacion.advertencias]
  paso('candidatos', 'Combinación de cuentas (#candidatos)', explicarCandidatos(candidatos, combinacion.exclusiones.length))

  paso('tablaFiltrado', 'Tabla #filtrado', 'Se crea vacía; guardará la combinación elegida con el aporte de cada cuenta.')

  // --- Semilla (líneas 82–87) -----------------------------------------------------------------
  let elegido: CandidatoInterno | null = null
  if (candidatos.length > 0) {
    const ranking = [...candidatos].sort(ordenSemilla)
    elegido = ranking[0]
    selDm = elegido.dataMartId
    selPuntos = elegido.puntos
    paso(
      'semilla',
      'Semilla',
      `Entra la cuenta de mayor Monto: ${elegido.indicador} (Monto ${monto(elegido.monto)}, ${puntos(elegido.puntos)} puntos).`,
      { ranking, candidato: elegido },
    )
  } else {
    paso('semilla', 'Semilla', 'No hay candidatos: @selDm se queda en NULL y el bucle no llega a ejecutarse.')
  }

  // --- Bucle (líneas 89–129) -------------------------------------------------------------------
  for (;;) {
    if (selDm === null || selPuntos === null) {
      paso('condicionBucle', 'Fin del bucle', '@selDm es NULL: termina el WHILE.')
      break
    }
    const dataMartElegido = selDm
    const puntosElegidos = selPuntos
    paso('condicionBucle', '¿Otra vuelta? Sí', `@selDm = ${dataMartElegido}: entra a la vuelta ${orden + 1}.`, {
      candidato: elegido ?? undefined,
    })

    orden += 1
    paso('contador', `Vuelta ${orden}`, `@orden pasa a ${orden}.`, { candidato: elegido ?? undefined })

    const suma = acumulado + puntosElegidos
    const cabeEntero = suma <= tope
    selAporte = enDecimal18(cabeEntero ? puntosElegidos : tope - acumulado, '@selAporte')
    paso(
      'aporte',
      'Aporte al tope',
      cabeEntero
        ? `${puntos(acumulado)} + ${puntos(puntosElegidos)} = ${puntos(suma)} ≤ ${puntos(tope)}: aporta sus ${puntos(puntosElegidos)} puntos completos.`
        : `${puntos(acumulado)} + ${puntos(puntosElegidos)} = ${puntos(suma)} > ${puntos(tope)}: solo aporta lo que faltaba, ` +
            `${puntos(tope)} − ${puntos(acumulado)} = ${puntos(selAporte)}.`,
      { candidato: elegido ?? undefined },
    )

    const insertada = filaParaInsertar(candidatos, dataMartElegido)
    if (!insertada) throw new Error(`#candidatos no tiene el DataMart ${dataMartElegido}.`) // no ocurre: @selDm sale de #candidatos
    filtrado.push({ orden, fila: insertada, aporte: selAporte })
    paso('insercion', 'Inserción en #filtrado', explicarInsercion(insertada, selAporte, puntosElegidos), {
      candidato: insertada,
      filtrado: orden,
    })

    acumulado = enDecimal18(acumulado + selAporte, '@acumulado')
    const borradas = candidatos.filter((candidato) => candidato.dataMartId === dataMartElegido).length
    candidatos = candidatos.filter((candidato) => candidato.dataMartId !== dataMartElegido)
    paso(
      'acumular',
      'Acumulado',
      `@acumulado = ${puntos(acumulado)}. Se borra el DataMart ${dataMartElegido} de #candidatos (${borradas} fila(s)).`,
      { filtrado: orden },
    )

    selDm = null
    elegido = null
    paso('reinicioSeleccion', 'Reinicio de la selección', '@selDm vuelve a NULL: si no aparece un relleno, el bucle termina.')

    if (acumulado < tope) {
      faltante = enDecimal18(tope - acumulado, '@faltante')
      if (candidatos.length > 0) {
        const ranking = [...candidatos].sort(ordenRelleno(faltante))
        elegido = ranking[0]
        selDm = elegido.dataMartId
        selPuntos = elegido.puntos
        paso('relleno', 'Relleno', explicarRelleno(elegido, faltante), { ranking, faltante, candidato: elegido })
      } else {
        // Un SELECT que no devuelve filas no asigna: @selDm sigue en NULL y @selPuntos conserva su valor.
        paso('relleno', 'Relleno', `Faltan ${puntos(faltante)}, pero ya no quedan candidatos: @selDm sigue en NULL.`)
      }
    } else {
      paso('relleno', 'Relleno', `El acumulado (${puntos(acumulado)}) ya llegó al tope (${puntos(tope)}): no se busca relleno.`)
    }
  }

  // --- Totales y resultados (líneas 131–143) ----------------------------------------------------
  cumplimiento = filtrado.length
  nota = enDecimal18(sumar(filtrado.map((fila) => fila.aporte)), '@Nota')
  paso('agregados', 'Totales', `Cumplimiento = ${cumplimiento} (filas en #filtrado) y Nota = ${puntos(nota)} (suma de los aportes).`)

  paso(
    'detalle',
    'Detalle de la combinación',
    cumplimiento > 0 ? `${cumplimiento} cuenta(s), en el orden en que se eligieron.` : '#filtrado quedó vacía: el detalle sale sin filas.',
  )

  const puntosBrutos = sumar(filtrado.map((fila) => fila.fila.puntos))
  const resumen = { tope: puntos(tope), cumplimiento, nota: puntos(nota), puntosBrutos: puntos(puntosBrutos) }
  paso(
    'resumen',
    'Resumen',
    `Tope ${resumen.tope} · Cumplimiento ${cumplimiento} · Nota ${resumen.nota} · PuntosBrutos ${resumen.puntosBrutos}.`,
  )

  // --- Paso 2: depuración (líneas 146–194) ------------------------------------------------------
  paso(
    'encabezadoPaso2',
    'Paso 2: depuración de RegistrosValidos',
    'Se borran las filas del usuario, periodo e índice que no quedaron en la combinación; las de otros índices no se tocan.',
  )

  const delUsuario = entrada.registros.filter(
    (registro) =>
      registro.yy === p.yy && registro.mm === p.mm && registro.indiceId === p.indiceId && registro.usuarioId === p.usuarioId,
  )
  const aBorrar = delUsuario
    .filter((registro) => !filtrado.some(({ fila }) => quedoEnLaCombinacion(registro, fila)))
    .sort((a, b) => compararBigInt(a.indicador, b.indicador) || compararBigInt(a.id, b.id))
  const filas = aBorrar.map(aFilaDepuracion)

  if (p.aplicarBorrado) {
    paso('borrado', 'Borrado', `DELETE de ${filas.length} fila(s): @@ROWCOUNT = ${filas.length}.${listar(filas)}`)
  } else {
    paso(
      'previsualizacion',
      'Vista previa del borrado',
      filas.length > 0
        ? `Se borrarían ${filas.length} fila(s).${listar(filas)} Con @AplicarBorrado = 1 se ejecutaría el DELETE.`
        : 'No se borraría ninguna fila: todas quedaron en la combinación.',
    )
  }

  if (filas.length > 0 && filas.length === delUsuario.length) {
    advertencias.push({
      codigo: 'BORRA_TODO',
      mensaje:
        `La combinación quedó vacía: el paso 2 ${p.aplicarBorrado ? 'borró' : 'borraría'} las ${filas.length} fila(s) ` +
        `del usuario ${p.usuarioId} para el periodo ${periodo(p.yy, p.mm)} y el índice ${p.indiceId}.`,
    })
  }

  return {
    ok: true,
    traza,
    seleccion: filtrado.map(aFilaFiltrado),
    resumen,
    depuracion: { modo: p.aplicarBorrado ? 'delete' : 'preview', filas, filasBorradas: p.aplicarBorrado ? filas.length : null },
    exclusiones: combinacion.exclusiones,
    advertencias,
  }
}

// --- Textos ----------------------------------------------------------------------------------------

function explicarCandidatos(candidatos: readonly CandidatoInterno[], excluidos: number): string {
  const cuentas = new Set(candidatos.map((candidato) => candidato.dataMartId)).size
  const fuera = excluidos > 0 ? ` ${excluidos} registro(s) quedan fuera (ver exclusiones).` : ''
  if (candidatos.length === 0) return `Ningún registro cruza con Datamart y con un rango de la escala.${fuera}`
  return (
    `${candidatos.length} fila(s) de ${cuentas} cuenta(s): registros del usuario, periodo e índice que cruzan con ` +
    `Datamart y caen en un rango de la escala.${fuera}`
  )
}

function explicarInsercion(insertada: CandidatoInterno, aporte: bigint, puntosElegidos: bigint): string {
  const base = `Se guarda ${insertada.indicador} (Monto ${monto(insertada.monto)}, ${puntos(insertada.puntos)} puntos) con aporte ${puntos(aporte)}.`
  if (insertada.puntos === puntosElegidos) return base
  return (
    `${base} Ojo: el aporte se calculó con ${puntos(puntosElegidos)} puntos, pero la fila insertada trae ` +
    `${puntos(insertada.puntos)} (rango ${insertada.puntosAsignarId}). Con rangos traslapados, SQL Server no ` +
    'garantiza qué fila toma el INSERT … TOP 1; la demo usa la de menor PuntosAsignar.Id.'
  )
}

function explicarRelleno(elegido: CandidatoInterno, faltante: bigint): string {
  const motivo = cubreFaltante(elegido, faltante)
    ? 'cubre el faltante y es la que menos se pasa'
    : 'ninguna cubre el faltante y es la que más acerca'
  return (
    `Faltan ${puntos(faltante)}. Primero las cuentas que cubren el faltante (la de menos puntos); si ninguna cubre, ` +
    `la de más puntos. Se elige ${elegido.indicador} (${puntos(elegido.puntos)} puntos): ${motivo}.`
  )
}

function listar(filas: readonly FilaDepuracion[]): string {
  return filas.length > 0 ? ` Id: ${filas.map((fila) => fila.id).join(', ')}.` : ''
}

// --- Conversiones y utilidades ---------------------------------------------------------------------

/** El NOT EXISTS del paso 2: misma cuenta, usuario, índice y periodo que una fila de #filtrado. */
function quedoEnLaCombinacion(registro: RegistroInterno, fila: CandidatoInterno): boolean {
  return (
    fila.dataMartId === registro.dataMartId &&
    fila.usuarioId === registro.usuarioId &&
    fila.indiceId === registro.indiceId &&
    fila.yy === registro.yy &&
    fila.mm === registro.mm
  )
}

function enDecimal18(valor: bigint, variable: string): bigint {
  if (!cabeEnDecimal18(valor)) throw new DesbordamientoDecimal(variable)
  return valor
}

function sumar(valores: readonly bigint[]): bigint {
  return valores.reduce((total, valor) => total + valor, 0n)
}

function aCandidatoTraza(candidato: CandidatoInterno, ranking: number | null, cubre: boolean | null): CandidatoTraza {
  return {
    clave: candidato.clave,
    registroId: String(candidato.registroId),
    puntosAsignarId: candidato.puntosAsignarId,
    indicador: String(candidato.indicador),
    dataMartId: String(candidato.dataMartId),
    usuarioId: candidato.usuarioId,
    indiceId: candidato.indiceId,
    yy: candidato.yy,
    mm: candidato.mm,
    monto: monto(candidato.monto),
    puntos: puntos(candidato.puntos),
    ranking,
    cubreFaltante: cubre,
  }
}

function aFilaFiltrado({ orden, fila, aporte }: FiltradoInterno): FilaFiltrado {
  return {
    orden,
    indicador: String(fila.indicador),
    dataMartId: String(fila.dataMartId),
    usuarioId: fila.usuarioId,
    indiceId: fila.indiceId,
    yy: fila.yy,
    mm: fila.mm,
    monto: monto(fila.monto),
    puntos: puntos(fila.puntos),
    aporte: puntos(aporte),
  }
}

function aFilaDepuracion(registro: RegistroInterno): FilaDepuracion {
  return {
    id: String(registro.id),
    yy: registro.yy,
    mm: registro.mm,
    indiceId: registro.indiceId,
    usuarioId: registro.usuarioId,
    indicador: String(registro.indicador),
    dataMartId: String(registro.dataMartId),
  }
}

function periodo(yy: number, mm: number): string {
  return `${yy}-${String(mm).padStart(2, '0')}`
}

function monto(unidades: bigint): string {
  return formatearDecimal(unidades, ESCALA_MONTO)
}

function puntos(unidades: bigint): string {
  return formatearDecimal(unidades, ESCALA_PUNTOS)
}

function puntosONulo(unidades: bigint | null): string | null {
  return unidades === null ? null : puntos(unidades)
}
