import { useEffect, useMemo, useState } from 'react';
import { fetchAllPokemonBasics, fetchPokemonByType } from './api/pokeApi';
import DemoBanner from './components/DemoBanner';
import Pagination from './components/Pagination';
import PokemonDetailModal from './components/PokemonDetailModal';
import PokemonGrid from './components/PokemonGrid';
import SearchBar from './components/SearchBar';
import ThemeToggle from './components/ThemeToggle';
import TypeFilter from './components/TypeFilter';
import { useTheme } from './hooks/useTheme';
import type { PokemonBasic } from './types/pokemon';

const PAGE_SIZE = 24;

export default function App() {
  const [theme, toggleTheme] = useTheme();

  // Lista completa (todos los Pokémon), cargada una sola vez al montar.
  const [allPokemon, setAllPokemon] = useState<PokemonBasic[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState<string | null>(null);

  // Lista filtrada por tipo (solo se pide cuando hay un tipo seleccionado).
  const [type, setType] = useState('');
  const [typePool, setTypePool] = useState<PokemonBasic[] | null>(null);
  const [loadingType, setLoadingType] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingAll(true);
    setErrorAll(null);

    fetchAllPokemonBasics()
      .then((data) => {
        if (!cancelled) setAllPokemon(data);
      })
      .catch(() => {
        if (!cancelled) setErrorAll('No se pudo conectar con la PokeAPI.');
      })
      .finally(() => {
        if (!cancelled) setLoadingAll(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!type) {
      setTypePool(null);
      setErrorType(null);
      setLoadingType(false);
      return;
    }

    let cancelled = false;
    setLoadingType(true);
    setErrorType(null);

    fetchPokemonByType(type)
      .then((data) => {
        if (!cancelled) setTypePool(data);
      })
      .catch(() => {
        if (!cancelled) setErrorType(`No se pudo cargar el tipo "${type}".`);
      })
      .finally(() => {
        if (!cancelled) setLoadingType(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  const pool = type ? typePool ?? [] : allPokemon;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pool;
    return pool.filter((p) => p.name.includes(term) || p.id.toString() === term);
  }, [pool, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Página "efectiva": evita un parpadeo de "sin resultados" mientras el
  // useEffect de abajo corrige el estado `page` tras un cambio de filtro.
  const effectivePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = filtered.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

  const loading = type ? loadingType : loadingAll;
  const error = type ? errorType : errorAll;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleTypeChange(value: string) {
    setType(value);
    setPage(1);
  }

  return (
    <>
      <DemoBanner />
      <div className="app">
        <header className="app-header">
          <div className="app-header-top">
            <h1>Pokédex Regional</h1>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
          <div className="app-filters">
            <SearchBar value={search} onSearch={handleSearch} />
            <TypeFilter value={type} onChange={handleTypeChange} />
          </div>
        </header>

        <main>
          <PokemonGrid items={pageItems} loading={loading} error={error} onSelect={setSelectedName} />
          {!loading && !error && filtered.length > 0 && (
            <Pagination page={effectivePage} totalPages={totalPages} onPageChange={setPage} />
          )}
        </main>

        {selectedName && (
          <PokemonDetailModal name={selectedName} onClose={() => setSelectedName(null)} />
        )}
      </div>
    </>
  );
}
