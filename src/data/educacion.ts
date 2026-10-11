import type { MesAnio } from '../lib/fechas'

export interface Certificacion {
  nombre: string
  emisor: string
  fecha: MesAnio
}

/** Fuente: CV. */
export const CARRERA = 'Ingeniería en Electrónica, Informática y Ciencias de la Computación'

/** En el mismo orden que el CV. */
export const CERTIFICACIONES: readonly Certificacion[] = [
  {
    nombre: 'AWS Machine Learning – Specialty Certification Preparation',
    emisor: 'QA',
    fecha: { anio: 2024, mes: 9 },
  },
  { nombre: 'Data Warehousing Concepts', emisor: 'DataCamp', fecha: { anio: 2024, mes: 7 } },
  { nombre: 'ETL and ELT in Python', emisor: 'DataCamp', fecha: { anio: 2024, mes: 9 } },
  { nombre: 'Big Data Fundamentals with PySpark', emisor: 'DataCamp', fecha: { anio: 2024, mes: 9 } },
  { nombre: 'Database Design', emisor: 'DataCamp', fecha: { anio: 2024, mes: 10 } },
  {
    nombre: 'Functions for Manipulating Data in SQL Server',
    emisor: 'DataCamp',
    fecha: { anio: 2024, mes: 11 },
  },
  {
    nombre: 'Cleaning Data in SQL Server Databases',
    emisor: 'DataCamp',
    fecha: { anio: 2024, mes: 11 },
  },
]
