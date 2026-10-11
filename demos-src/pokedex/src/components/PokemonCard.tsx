import { spriteUrlForId } from '../api/pokeApi';
import type { PokemonBasic } from '../types/pokemon';

interface PokemonCardProps {
  pokemon: PokemonBasic;
  onSelect: (name: string) => void;
}

export default function PokemonCard({ pokemon, onSelect }: PokemonCardProps) {
  return (
    <button className="pokemon-card" onClick={() => onSelect(pokemon.name)}>
      <span className="pokemon-card-id">#{pokemon.id.toString().padStart(3, '0')}</span>
      <img
        src={spriteUrlForId(pokemon.id)}
        alt={pokemon.name}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.visibility = 'hidden';
        }}
      />
      <span className="pokemon-card-name">{pokemon.name}</span>
    </button>
  );
}
