import type {
  PokemonAbility,
  PokemonBasic,
  PokemonDetail,
  PokemonSpecies,
  PokemonStat,
} from '../types/pokemon';

const BASE_URL = 'https://pokeapi.co/api/v2';

interface NamedApiResource {
  name: string;
  url: string;
}

interface PokemonListResponse {
  results: NamedApiResource[];
}

interface TypeResponse {
  pokemon: { pokemon: NamedApiResource }[];
}

interface PokemonApiResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: { front_default: string | null };
    };
  };
  types: { slot: number; type: NamedApiResource }[];
  stats: { base_stat: number; stat: NamedApiResource }[];
  abilities: { is_hidden: boolean; ability: NamedApiResource }[];
}

/** Forma cruda de GET /pokemon-species/{name} (solo los campos que usamos). */
interface PokemonSpeciesApiResponse {
  is_legendary: boolean;
  is_mythical: boolean;
  capture_rate: number;
  base_happiness: number | null;
  habitat: NamedApiResource | null;
  color: NamedApiResource | null;
  genera: { genus: string; language: NamedApiResource }[];
  flavor_text_entries: { flavor_text: string; language: NamedApiResource }[];
}

/** Extrae el id numérico de una url tipo https://pokeapi.co/api/v2/pokemon/25/ */
function extractIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

/** URL estable del artwork oficial, sin necesidad de pedir el detalle de cada Pokémon. */
export function spriteUrlForId(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/**
 * Trae la lista completa de nombres/ids (~1300 Pokémon) en una sola llamada.
 * Se guarda en memoria (variable de módulo) durante la sesión: no hay backend
 * ni almacenamiento persistente, solo caché en RAM del navegador mientras la
 * pestaña sigue abierta.
 */
let allPokemonCache: PokemonBasic[] | null = null;

export async function fetchAllPokemonBasics(): Promise<PokemonBasic[]> {
  if (allPokemonCache) {
    return allPokemonCache;
  }

  const response = await fetch(`${BASE_URL}/pokemon?limit=2000&offset=0`);
  if (!response.ok) {
    throw new Error('No se pudo obtener la lista de Pokémon.');
  }

  const data = (await response.json()) as PokemonListResponse;
  allPokemonCache = data.results.map((item) => ({
    id: extractIdFromUrl(item.url),
    name: item.name,
  }));

  return allPokemonCache;
}

const typeCache = new Map<string, PokemonBasic[]>();

export async function fetchPokemonByType(type: string): Promise<PokemonBasic[]> {
  const cached = typeCache.get(type);
  if (cached) {
    return cached;
  }

  const response = await fetch(`${BASE_URL}/type/${type}`);
  if (!response.ok) {
    throw new Error(`No se pudo obtener el tipo "${type}".`);
  }

  const data = (await response.json()) as TypeResponse;
  const items: PokemonBasic[] = data.pokemon.map((entry) => ({
    id: extractIdFromUrl(entry.pokemon.url),
    name: entry.pokemon.name,
  }));

  typeCache.set(type, items);
  return items;
}

const detailCache = new Map<string, PokemonDetail>();

function mapDetail(raw: PokemonApiResponse): PokemonDetail {
  const stats: PokemonStat[] = raw.stats.map((s) => ({
    name: s.stat.name,
    baseValue: s.base_stat,
  }));

  const abilities: PokemonAbility[] = raw.abilities.map((a) => ({
    name: a.ability.name,
    isHidden: a.is_hidden,
  }));

  const types = [...raw.types]
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name);

  return {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    baseExperience: raw.base_experience,
    spriteUrl: raw.sprites.front_default,
    artworkUrl: raw.sprites.other?.['official-artwork']?.front_default ?? null,
    types,
    stats,
    abilities,
  };
}

export async function fetchPokemonDetail(nameOrId: string): Promise<PokemonDetail> {
  const key = nameOrId.trim().toLowerCase();
  const cached = detailCache.get(key);
  if (cached) {
    return cached;
  }

  const response = await fetch(`${BASE_URL}/pokemon/${key}`);
  if (!response.ok) {
    throw new Error('Pokémon no encontrado.');
  }

  const raw = (await response.json()) as PokemonApiResponse;
  const detail = mapDetail(raw);
  detailCache.set(key, detail);

  return detail;
}

/** Elige la entrada en español si existe; si no, en inglés; si no, la primera disponible. */
function pickLocalizedText<T extends { language: NamedApiResource }>(
  entries: T[],
  extract: (entry: T) => string,
): string | null {
  const preferred =
    entries.find((e) => e.language.name === 'es') ??
    entries.find((e) => e.language.name === 'en') ??
    entries[0];

  if (!preferred) {
    return null;
  }

  // Los flavor_text de PokeAPI traen saltos de línea/form-feed sueltos.
  return extract(preferred).replace(/[\n\f\r]+/g, ' ').trim();
}

function mapSpecies(raw: PokemonSpeciesApiResponse): PokemonSpecies {
  return {
    genus: pickLocalizedText(raw.genera, (e) => e.genus),
    flavorText: pickLocalizedText(raw.flavor_text_entries, (e) => e.flavor_text),
    isLegendary: raw.is_legendary,
    isMythical: raw.is_mythical,
    habitat: raw.habitat?.name ?? null,
    captureRate: raw.capture_rate,
    baseHappiness: raw.base_happiness,
    color: raw.color?.name ?? null,
  };
}

const speciesCache = new Map<string, PokemonSpecies>();

/** GET /pokemon-species/{name}: descripción de Pokédex, rareza y hábitat. */
export async function fetchPokemonSpecies(nameOrId: string): Promise<PokemonSpecies> {
  const key = nameOrId.trim().toLowerCase();
  const cached = speciesCache.get(key);
  if (cached) {
    return cached;
  }

  const response = await fetch(`${BASE_URL}/pokemon-species/${key}`);
  if (!response.ok) {
    throw new Error('Especie no encontrada.');
  }

  const raw = (await response.json()) as PokemonSpeciesApiResponse;
  const species = mapSpecies(raw);
  speciesCache.set(key, species);

  return species;
}
