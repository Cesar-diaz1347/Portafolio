export interface GrupoHabilidades {
  id: string
  titulo: string
  items: readonly string[]
}

/** Competencias técnicas: los 4 grupos del CV, en su orden. */
export const GRUPOS_HABILIDADES: readonly GrupoHabilidades[] = [
  {
    id: 'backend',
    titulo: 'Backend & Lenguajes',
    items: [
      'C#',
      '.NET 8 / .NET Core / .NET Framework',
      'ASP.NET MVC',
      'WinForms',
      'T-SQL',
      'Stored Procedures',
      'Triggers',
      'LINQ',
    ],
  },
  {
    id: 'frontend',
    titulo: 'Frontend & Web',
    items: ['React.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'REST API', 'JSON', 'JWT'],
  },
  {
    id: 'datos',
    titulo: 'Datos & ETL',
    items: [
      'SQL Server',
      'SSIS',
      'SSRS',
      'ETL',
      'ELT',
      'Data Warehouse',
      'Datamarts',
      'Database Design',
      'Data Cleaning',
      'PySpark',
      'Python',
    ],
  },
  {
    id: 'cloud',
    titulo: 'Cloud & DevOps',
    items: ['Azure DevOps', 'Git', 'GitHub Actions', 'CI/CD', 'AWS (Machine Learning)'],
  },
]

/** Resumen del stack para la tarjeta de la portada. */
export const STACK_PRINCIPAL: readonly string[] = [
  'React',
  'TypeScript',
  'C# / .NET',
  'SQL Server',
  'SSIS / SSRS',
  'Azure DevOps',
]
