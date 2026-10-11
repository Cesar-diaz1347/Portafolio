import type { MesAnio } from '../lib/fechas'

/** Un puesto del CV; `fin: 'actual'` significa «Presente». */
export interface Puesto {
  id: string
  cargo: string
  empresa: string
  modalidad?: 'Freelance'
  inicio: MesAnio
  fin: MesAnio | 'actual'
  logros: readonly string[]
}

/** Experiencia profesional, del puesto más reciente al más antiguo. Fuente: CV. */
export const PUESTOS: readonly Puesto[] = [
  {
    id: 'banco-internacional',
    cargo: 'Desarrollador de Tecnología',
    empresa: 'Banco Internacional',
    inicio: { anio: 2022, mes: 7 },
    fin: 'actual',
    logros: [
      'Lideré el diseño e implementación end-to-end del sistema de automatización de la cafetería institucional (app de proveedor, gestión de órdenes/cobros para RRHH, cobro electrónico y portal web), desarrollando la solución completa en React, C# (.NET) y SQL Server.',
      'Diseñé e implementé pipelines ETL en SSIS integrados con Azure DevOps para consumir APIs REST asíncronas de terceros, procesando datos JSON hacia bases de datos relacionales del banco.',
      'Aseguré la disponibilidad y el rendimiento de aplicaciones críticas (Sistema de Embozado de Tarjetas de Crédito, Sorteos Diarios, Calificación de Servicio al Cliente) mediante soporte, optimización y mantenimiento continuo.',
      'Administré e implementé el ecosistema institucional de reportes empresariales con SSRS y SSIS, respaldando la toma de decisiones de negocio.',
    ],
  },
  {
    id: 'grupo-unicomer',
    cargo: 'Especialista en Soporte & Bases de Datos',
    empresa: 'Grupo Unicomer',
    inicio: { anio: 2022, mes: 1 },
    fin: { anio: 2022, mes: 6 },
    logros: [
      'Brindé soporte y mantenimiento a la aplicación de traslado de inventarios inter-sucursales.',
      'Depuré, mantuve y optimicé el rendimiento de bases de datos relacionales.',
      'Diseñé y ejecuté procesos ETL entre Data Warehouse y Datamarts mediante SSRS, habilitando reportes que respaldaron la toma de decisiones empresariales.',
    ],
  },
  {
    id: 'colgate-palmolive',
    cargo: 'Desarrollador de Tecnología',
    empresa: 'Colgate-Palmolive',
    inicio: { anio: 2020, mes: 11 },
    fin: { anio: 2021, mes: 10 },
    logros: [
      'Desarrollé una solución analítica para el monitoreo de categorías comerciales a nivel Centroamérica mediante dashboards de seguimiento.',
      'Construí un sistema de control de empaquetado integrado con controladores lógicos programables (PLC) para análisis de eficiencia y pérdidas operativas en tiempo real.',
      'Creé una aplicación de análisis de productividad por categoría operativa en Guatemala.',
    ],
  },
  {
    id: 'autopan',
    cargo: 'Desarrollador de Software & Administrador BD',
    empresa: 'Autopan (Sur-Occidente)',
    modalidad: 'Freelance',
    inicio: { anio: 2018, mes: 1 },
    fin: { anio: 2020, mes: 4 },
    logros: [
      'Administré integralmente la base de datos y desarrollé el sistema de control de inventarios mediante automatización de reportes y procesos.',
    ],
  },
  {
    id: 'itics',
    cargo: 'Desarrollador de Sistemas',
    empresa: 'Itics',
    modalidad: 'Freelance',
    inicio: { anio: 2016, mes: 2 },
    fin: { anio: 2019, mes: 12 },
    logros: [
      'Desarrollé y di soporte continuo a la plataforma de asignación académica y gestión de tareas para estudiantes mediante mejoras iterativas de backend y base de datos.',
    ],
  },
]
