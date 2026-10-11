import type { PokemonBasic } from '../types/pokemon';
import PokemonCard from './PokemonCard';

interface PokemonGridProps {
  items: PokemonBasic[];
  loading: boolean;
  error: string | null;
  onSelect: (name: string) => void;
}

export default function PokemonGrid({ items, loading, error, onSelect }: PokemonGridProps) {
  if (error) {
    return <p className="status-message status-error">{error}</p>;
  }

  if (loading) {
    return <p className="status-message">Cargando Pokémon...</p>;
  }

  if (items.length === 0) {
    return <p className="status-message">No se encontraron Pokémon.</p>;
  }

  return (
    <div className="pokemon-grid">
      {items.map((pokemon) => (
        <PokemonCard key={pokemon.id} pokemon={pokemon} onSelect={onSelect} />
      ))}
    </div>
  );
}
