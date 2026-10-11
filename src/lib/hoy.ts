import { mesAnioDeFecha, type MesAnio } from './fechas'

/**
 * Fecha en que se cargó la página, tomada una sola vez fuera del render (así los
 * componentes siguen siendo puros). Es la base del año del pie y de la duración
 * del puesto actual.
 */
const FECHA_CARGA = new Date()

export const ANIO_ACTUAL: number = FECHA_CARGA.getFullYear()
export const MES_ACTUAL: MesAnio = mesAnioDeFecha(FECHA_CARGA)
