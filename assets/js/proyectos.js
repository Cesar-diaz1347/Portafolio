/* proyectos.js — fuente única de datos del segmento "Proyectos".
   Todos los proyectos provienen de la experiencia real del CV; las demos
   reconstruyen la lógica de cada sistema con datos ficticios. */
window.PROYECTOS = [
  {
    slug: "cafeteria",
    titulo: "Automatización integral de cafetería institucional",
    empresa: "Banco Internacional",
    empresaId: "banco",
    icono: "☕",
    tipo: "demo",
    demo: "proyectos/cafeteria/index.html",
    desc: "Ecosistema completo: portal de reservas de almuerzo para el colaborador, app del proveedor para despachar, y gestión de cobros y conciliación para RRHH.",
    stack: ["React", "C# .NET", "ASP.NET MVC", "SQL Server", "REST API"],
    detalle: {
      reto: "El banco necesitaba eliminar el registro manual de consumos de la cafetería institucional y cobrar por planilla sin fricción para el colaborador.",
      hice: [
        "Lideré el diseño e implementación end-to-end del sistema, desarrollando la solución completa en React, C# (.NET) y SQL Server.",
        "Desarrollé el portal de autoservicio donde el colaborador reserva su almuerzo por sucursal, fecha y menú.",
        "Construí la app del proveedor para publicar el menú diario y despachar las reservas recibidas.",
        "Implementé el cobro electrónico y la gestión de cobros para RRHH con descuento por planilla."
      ],
      resultado: "Reserva, consumo, cobro y conciliación en un solo flujo digital, con trazabilidad por colaborador y cierre mensual automático."
    }
  },
  {
    slug: "embozado",
    titulo: "Sistema de embozado de tarjetas de crédito",
    empresa: "Banco Internacional",
    empresaId: "banco",
    icono: "💳",
    tipo: "demo",
    demo: "proyectos/embozado/index.html",
    desc: "Aplicación crítica que arma, valida y despacha los lotes de tarjetas enviados a la embozadora, con control de estados y trazabilidad.",
    stack: ["C# .NET", "T-SQL", "Stored Procedures", "WinForms"],
    detalle: {
      reto: "Aplicación crítica del banco: un lote mal formado detiene la entrega de tarjetas a los clientes.",
      hice: [
        "Soporte, optimización y mantenimiento del sistema en producción.",
        "Validación de datos del plástico y del titular antes de generar el lote.",
        "Control de estados solicitada, embozada y entregada con bitácora por operación.",
        "Generación del archivo de lote para la embozadora y su conciliación posterior."
      ],
      resultado: "Lotes consistentes y auditables, con errores detectados antes de llegar a la máquina embozadora."
    }
  },
  {
    slug: "sorteos",
    titulo: "Sistema de sorteos diarios",
    empresa: "Banco Internacional",
    empresaId: "banco",
    icono: "🎲",
    tipo: "demo",
    demo: "proyectos/sorteos/index.html",
    desc: "Motor de sorteos de campañas: carga de participantes, selección aleatoria auditable, control de no repetidos e historial de ganadores.",
    stack: ["C# .NET", "SQL Server", "TypeScript"],
    detalle: {
      reto: "Las campañas del banco requerían un sorteo diario reproducible y auditable ante auditoría interna.",
      hice: [
        "Soporte y mantenimiento del sistema de sorteos diarios en producción.",
        "Carga de participantes elegibles según reglas de la campaña.",
        "Selección aleatoria con semilla registrada para reproducir el resultado.",
        "Control de ganadores previos e historial persistente por campaña."
      ],
      resultado: "Sorteos diarios ejecutados sin intervención manual y con evidencia verificable de cada resultado."
    }
  },
  {
    slug: "csat",
    titulo: "Calificación de servicio al cliente",
    empresa: "Banco Internacional",
    empresaId: "banco",
    icono: "⭐",
    tipo: "demo",
    demo: "proyectos/csat/index.html",
    desc: "Captura de encuestas CSAT/NPS por canal y agente, con agregación en vivo y tablero de resultados para las jefaturas.",
    stack: ["C# .NET", "SQL Server", "SSRS", "TypeScript"],
    detalle: {
      reto: "Medir la calidad de atención por agente y canal con datos confiables y disponibles el mismo día.",
      hice: [
        "Soporte y mantenimiento de la aplicación de calificación de servicio al cliente.",
        "Captura de la encuesta en el punto de atención y consolidación en base de datos.",
        "Cálculo de CSAT y NPS y su distribución por agente, canal y periodo.",
        "Publicación de resultados en el ecosistema de reportes empresariales."
      ],
      resultado: "Indicadores de servicio disponibles para las jefaturas sin consolidación manual de encuestas."
    }
  },
  {
    slug: "etl-ssis",
    titulo: "Tuberías ETL en SSIS y ecosistema de reportes SSRS",
    empresa: "Banco Internacional",
    empresaId: "banco",
    icono: "🔄",
    tipo: "demo",
    demo: "proyectos/etl-ssis/index.html",
    desc: "Orquestación de datos masivos: APIs REST asíncronas a staging, transformación en SSIS, carga al Data Warehouse y publicación en SSRS.",
    stack: ["SSIS", "SSRS", "T-SQL", "Azure DevOps", "JSON"],
    detalle: {
      reto: "Procesar volúmenes masivos de JSON provenientes de terceros e integrarlos a bases de datos relacionales sin perder trazabilidad.",
      hice: [
        "Desarrollé arquitecturas de integración con terceros consumiendo APIs REST asíncronas.",
        "Construí las tuberías ETL en SSIS desplegadas con Azure DevOps.",
        "Modelé el paso de staging a Data Warehouse con control de errores y reintentos.",
        "Administré e implementé el ecosistema institucional de reportes empresariales con SSRS y SSIS."
      ],
      resultado: "Procesamiento masivo automatizado y reportes empresariales publicados sobre datos ya conciliados."
    }
  },
  {
    slug: "inventarios",
    titulo: "Traslado de inventarios inter-sucursales",
    empresa: "Grupo Unicomer",
    empresaId: "unicomer",
    icono: "📦",
    tipo: "demo",
    demo: "proyectos/inventarios/index.html",
    desc: "Aplicación de traslados entre sucursales con validación de existencias, estados en tránsito y kardex de movimientos.",
    stack: ["SQL Server", "T-SQL", "C# .NET"],
    detalle: {
      reto: "Los traslados entre sucursales descuadraban el inventario cuando no había control de existencias ni de recepción.",
      hice: [
        "Mantenimiento y soporte a la aplicación de traslado de inventarios inter-sucursales.",
        "Validación de existencias antes de autorizar el envío.",
        "Control de estados en tránsito y recibido con kardex por producto y sucursal.",
        "Depuración y optimización de rendimiento en las bases de datos involucradas."
      ],
      resultado: "Inventario consistente entre sucursales y movimientos rastreables producto por producto."
    }
  },
  {
    slug: "integraciones",
    titulo: "Integración de software con terceros vía APIs REST",
    empresa: "Banco Internacional",
    empresaId: "banco",
    icono: "🔌",
    tipo: "caso",
    demo: null,
    desc: "Arquitecturas de integración con proveedores externos consumiendo APIs REST asíncronas y normalizando su respuesta JSON.",
    stack: ["REST API", "JSON", "JWT", "C# .NET", "LINQ"],
    detalle: {
      reto: "Cada proveedor exponía contratos distintos y tiempos de respuesta variables.",
      hice: [
        "Diseñé la capa de integración asíncrona con reintentos y manejo de time-outs.",
        "Normalicé con LINQ respuestas JSON heterogéneas hacia el modelo relacional del banco.",
        "Aseguré el consumo con autenticación por token y bitácora de cada llamada."
      ],
      resultado: "Integraciones estables con terceros y errores de proveedor aislados del core bancario."
    }
  },
  {
    slug: "dw-datamarts",
    titulo: "ETL entre Data Warehouse y Datamarts",
    empresa: "Grupo Unicomer",
    empresaId: "unicomer",
    icono: "🗄️",
    tipo: "caso",
    demo: null,
    desc: "Diseño y ejecución de procesos ETL que alimentan los datamarts de decisión empresarial, explotados con SSRS.",
    stack: ["SSIS", "SSRS", "Data Warehouse", "T-SQL"],
    detalle: {
      reto: "Las áreas de negocio necesitaban información agregada sin consultar directamente el Data Warehouse.",
      hice: [
        "Diseñé y ejecuté los procesos ETL entre Data Warehouse y Datamarts.",
        "Depuré y optimicé el rendimiento de las bases de datos relacionales origen.",
        "Habilité el consumo de los datamarts mediante reportes SSRS."
      ],
      resultado: "Soporte a la toma de decisiones empresariales con datos agregados y consistentes."
    }
  },
  {
    slug: "categorias-cam",
    titulo: "Monitoreo de categorías comerciales en Centroamérica",
    empresa: "Colgate-Palmolive",
    empresaId: "colgate",
    icono: "📊",
    tipo: "caso",
    demo: null,
    desc: "Solución analítica regional para seguir el desempeño de las categorías comerciales a nivel Centroamérica.",
    stack: ["SQL Server", "SSRS", "Python (Data)", "ETL", "Angular"],
    detalle: {
      reto: "La región no tenía una vista única del comportamiento por categoría comercial.",
      hice: [
        "Desarrollé la solución analítica para el monitoreo de categorías a nivel Centroamérica.",
        "Consolidé las fuentes de datos por país en un modelo comparable.",
        "Publiqué los indicadores para el seguimiento comercial periódico.",
        "Probé en Angular las interfaces de consulta de la solución analítica."
      ],
      resultado: "Visibilidad regional del desempeño por categoría en un solo tablero."
    }
  },
  {
    slug: "empaquetado-plc",
    titulo: "Control de empaquetado integrado con PLCs",
    empresa: "Colgate-Palmolive",
    empresaId: "colgate",
    icono: "🏭",
    tipo: "caso",
    demo: null,
    desc: "Sistema de control de empaquetado que integra software con controladores lógicos programables para medir eficiencia y pérdidas operativas.",
    stack: ["C# .NET", "PLC", "SQL Server"],
    detalle: {
      reto: "Las pérdidas de línea se estimaban a mano y no eran comparables entre turnos.",
      hice: [
        "Construí el sistema de control de empaquetado para análisis de eficiencia y pérdidas.",
        "Integré el software con los controladores lógicos programables de la línea.",
        "Registré la producción por turno para comparar rendimiento real contra meta."
      ],
      resultado: "Eficiencia y pérdidas medidas con datos de máquina en lugar de estimaciones manuales."
    }
  },
  {
    slug: "productividad",
    titulo: "Análisis de productividad por categorías operativas",
    empresa: "Colgate-Palmolive",
    empresaId: "colgate",
    icono: "📈",
    tipo: "caso",
    demo: null,
    desc: "Aplicación para analizar la productividad por categoría operativa en la operación de Guatemala.",
    stack: ["C# .NET", "SQL Server", "Reporting", "Angular"],
    detalle: {
      reto: "No existía una medida homogénea de productividad entre categorías operativas.",
      hice: [
        "Creé la aplicación de análisis de productividad por categorías operativas en Guatemala.",
        "Definí los indicadores y su cálculo sobre los datos de operación.",
        "Automaticé la generación periódica del análisis.",
        "Probé en Angular las interfaces de consulta del análisis."
      ],
      resultado: "Comparación objetiva de productividad entre categorías operativas."
    }
  },
  {
    slug: "autopan-inventarios",
    titulo: "Sistema de control de inventarios y administración de BD",
    empresa: "Autopan (Sur-Occidente)",
    empresaId: "autopan",
    icono: "🧾",
    tipo: "caso",
    demo: null,
    desc: "Desarrollo del sistema de control de inventarios y administración integral de la base de datos de la empresa.",
    stack: ["C# .NET", "SQL Server", "T-SQL"],
    detalle: {
      reto: "La empresa operaba el inventario sin un sistema propio ni administración formal de su base de datos.",
      hice: [
        "Administración integral de la base de datos: respaldos, seguridad y rendimiento.",
        "Desarrollo del sistema de control de inventarios de punta a punta.",
        "Definición del modelo de datos y de los procesos de carga."
      ],
      resultado: "Control de inventarios propio y una base de datos administrada de forma consistente."
    }
  },
  {
    slug: "itics-academico",
    titulo: "Plataforma de asignación académica y gestión de tareas",
    empresa: "Itics",
    empresaId: "itics",
    icono: "🎓",
    tipo: "caso",
    demo: null,
    desc: "Plataforma para la asignación académica y la gestión de tareas de estudiantes, con desarrollo y soporte continuo.",
    stack: ["TypeScript", "SQL Server", "Web"],
    detalle: {
      reto: "La asignación de cursos y tareas se llevaba de forma dispersa entre docentes y estudiantes.",
      hice: [
        "Desarrollo de la plataforma de asignación académica y gestión de tareas.",
        "Soporte continuo y evolución de la plataforma durante su operación.",
        "Atención a docentes y estudiantes como usuarios finales del sistema."
      ],
      resultado: "Un solo lugar para asignaciones y entregas, con seguimiento por estudiante."
    }
  }
];

/* Con qué nombre aparece cada competencia de la matriz dentro del stack de los
   proyectos. Sirve para que un chip de la sección "Stack" filtre los sistemas
   que la respaldan. Lista vacía = el CV la declara pero todavía no hay ningún
   proyecto publicado que la demuestre. */
window.COMPETENCIAS = {
  "C#":                                  ["C# .NET"],
  ".NET 8 / .NET Core / .NET Framework": ["C# .NET"],
  "ASP.NET MVC":                         ["ASP.NET MVC"],
  "WinForms":                            ["WinForms"],
  "T-SQL":                               ["T-SQL"],
  "Stored Procedures":                   ["Stored Procedures"],
  "Triggers":                            [],
  "LINQ":                                ["LINQ"],
  "React.js":                            ["React"],
  "Angular":                             ["Angular"],
  "TypeScript":                          ["TypeScript"],
  "JavaScript":                          ["JavaScript"],
  "HTML5":                               ["Web"],
  "CSS3":                                ["Web"],
  "REST API":                            ["REST API"],
  "JSON":                                ["JSON"],
  "JWT":                                 ["JWT"],
  "SQL Server":                          ["SQL Server"],
  "SSIS":                                ["SSIS"],
  "SSRS":                                ["SSRS"],
  "ETL":                                 ["ETL"],
  "ELT":                                 [],
  "Data Warehouse":                      ["Data Warehouse"],
  "Datamarts":                           ["Data Warehouse"],
  "Database Design":                     [],
  "Data Cleaning":                       [],
  "PySpark":                             [],
  "Python":                              ["Python (Data)"],
  "Azure DevOps":                        ["Azure DevOps"],
  "Git":                                 [],
  "GitHub Actions":                      [],
  "CI/CD":                               [],
  "AWS (Machine Learning)":              []
};
