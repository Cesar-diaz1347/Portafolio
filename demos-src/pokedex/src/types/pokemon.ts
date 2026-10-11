/** Referencia mínima a un Pokémon: solo lo que trae la lista /pokemon o /type/{name}. */
export interface PokemonBasic {
  id: number;
  name: string;
}

export interface PokemonStat {
  name: string;
  baseValue: number;
}

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  baseExperience: number;
  spriteUrl: string | null;
  artworkUrl: string | null;
  types: string[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
}

/** Datos "de especie" (GET /pokemon-species/{name}): descripción, rareza, hábitat, etc. */
export interface PokemonSpecies {
  genus: string | null;
  flavorText: string | null;
  isLegendary: boolean;
  isMythical: boolean;
  habitat: string | null;
  captureRate: number;
  baseHappiness: number | null;
  color: string | null;
}
