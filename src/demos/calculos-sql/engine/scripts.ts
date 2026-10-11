// Copias exactas de los scripts del repo CalculoConteoValor (ver sql/.gitattributes).
import scriptDatos from '../sql/CrearFicticios.sql?raw'
import scriptLogica from '../sql/LogicaConteoYValor_Ficticios.sql?raw'

/** LogicaConteoYValor_Ficticios.sql tal cual: el script que replica el motor. */
export const SCRIPT_LOGICA: string = scriptLogica

/** CrearFicticios.sql tal cual: crea las tablas y carga los datos ficticios. */
export const SCRIPT_DATOS: string = scriptDatos
