/** Datos personales y de presentación. Fuente: CV y Portafolio1.2. */
export interface Perfil {
  nombre: string
  nombreCorto: string
  titulo: string
  lema: string
  disponibilidad: string
  fraseBreve: string
  /** El resumen del CV, literal, partido en párrafos cortos. */
  resumen: readonly string[]
  aniosExperiencia: string
  sectores: readonly string[]
  ubicacion: {
    pais: string
    modalidad: string
    ingles: string
    idiomas: string
  }
}

export const PERFIL: Perfil = {
  nombre: 'César Alejandro Díaz Cano',
  nombreCorto: 'César Díaz',
  titulo: 'Desarrollador Full Stack & Especialista ETL / SQL Server',
  lema: 'Full Stack & Datos',
  disponibilidad: 'Disponible para nuevos proyectos · remoto',
  // Condensa las dos primeras frases del resumen del CV.
  fraseBreve:
    'Desarrollo end-to-end en Full Stack (React, C# / .NET 8-10, SQL Server) e ingeniería de datos (SSIS, SSRS, ETL/ELT), integrando sistemas críticos en banca, retail y manufactura.',
  resumen: [
    'Ingeniero en Electrónica, Informática y Ciencias de la Computación con más de 8 años de experiencia end-to-end en desarrollo Full Stack (React, C# / .NET 8-10, SQL Server) e ingeniería de datos (SSIS, SSRS, ETL/ELT, Data Warehousing).',
    'Historial integrando sistemas críticos en banca, retail y manufactura: arquitecturas de APIs REST, automatización de procesos de negocio y orquestación de datos masivos hacia bases de datos relacionales. Experiencia adicional como freelance desarrollando plataformas web y sistemas de control de inventarios.',
    'Trabajo en entornos ágiles con Azure DevOps y GitHub Actions. Inglés B1.',
  ],
  // «8+ años», igual que el CV.
  aniosExperiencia: '8+',
  sectores: ['Banca', 'Retail', 'Manufactura'],
  ubicacion: {
    pais: 'Guatemala',
    modalidad: 'Disponible remoto',
    ingles: 'Inglés B1',
    idiomas: 'Español nativo · Inglés B1',
  },
}
