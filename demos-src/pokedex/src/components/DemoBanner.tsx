/**
 * Aviso discreto de demo: regreso al portafolio, origen de los datos y nota de marca.
 * La app usa la PokeAPI real (no hay datos simulados).
 */
export default function DemoBanner() {
  return (
    <section className="demo-banner" aria-label="Aviso de demo">
      <a className="demo-banner-link" href="../../index.html#proyectos">
        <span aria-hidden="true">←</span> Volver al portafolio
      </a>
      <p className="demo-banner-note">
        <strong>Datos en vivo de PokeAPI.</strong> Pokémon es marca de Nintendo / Game Freak; proyecto educativo sin fines
        comerciales.
      </p>
    </section>
  );
}
