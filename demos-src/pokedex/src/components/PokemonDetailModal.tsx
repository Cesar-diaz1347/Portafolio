import { useEffect, useState } from 'react';
import { fetchPokemonDetail, fetchPokemonSpecies } from '../api/pokeApi';
import type { PokemonDetail, PokemonSpecies } from '../types/pokemon';
import StatBar from './StatBar';
import TypeBadge from './TypeBadge';

interface PokemonDetailModalProps {
  name: string;
  onClose: () => void;
}

export default function PokemonDetailModal({ name, onClose }: PokemonDetailModalProps) {
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPokemon(null);
    setSpecies(null);

    // Se piden en paralelo. La especie (/pokemon-species) es información
    // complementaria: si falla, el modal igual muestra el detalle base.
    Promise.allSettled([fetchPokemonDetail(name), fetchPokemonSpecies(name)]).then(
      ([detailResult, speciesResult]) => {
        if (cancelled) return;

        if (detailResult.status === 'fulfilled') {
          setPokemon(detailResult.value);
        } else {
          setError('No se pudo cargar el detalle de este Pokémon.');
        }

        if (speciesResult.status === 'fulfilled') {
          setSpecies(speciesResult.value);
        }

        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        {loading && <p className="status-message">Cargando...</p>}
        {error && <p className="status-message status-error">{error}</p>}

        {pokemon && (
          <>
            <div className="modal-header">
              <img
                src={pokemon.artworkUrl ?? pokemon.spriteUrl ?? undefined}
                alt={pokemon.name}
                className="modal-artwork"
              />
              <div>
                <span className="pokemon-card-id">#{pokemon.id.toString().padStart(3, '0')}</span>
                <h2>{pokemon.name}</h2>
                {species?.genus && <p className="pokemon-genus">{species.genus}</p>}

                <div className="pokemon-card-types">
                  {pokemon.types.map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                  {species?.isLegendary && (
                    <span className="special-badge special-badge-legendary">Legendario</span>
                  )}
                  {species?.isMythical && (
                    <span className="special-badge special-badge-mythical">Mítico</span>
                  )}
                </div>

                <p>Altura: {pokemon.height / 10} m</p>
                <p>Peso: {pokemon.weight / 10} kg</p>
                <p>Experiencia base: {pokemon.baseExperience}</p>
                {species?.habitat && <p>Hábitat: {species.habitat}</p>}
                {species && <p>Tasa de captura: {species.captureRate}/255</p>}
                <p>
                  Habilidades:{' '}
                  {pokemon.abilities
                    .map((a) => (a.isHidden ? `${a.name} (oculta)` : a.name))
                    .join(', ')}
                </p>
              </div>
            </div>

            {species?.flavorText && <p className="pokemon-flavor-text">{species.flavorText}</p>}

            <h3>Estadísticas base</h3>
            <div className="stat-bar-list">
              {pokemon.stats.map((stat) => (
                <StatBar key={stat.name} stat={stat} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
