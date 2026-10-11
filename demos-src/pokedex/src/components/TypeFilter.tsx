import { POKEMON_TYPES } from '../constants/types';

interface TypeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TypeFilter({ value, onChange }: TypeFilterProps) {
  return (
    <select className="type-filter" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Todos los tipos</option>
      {POKEMON_TYPES.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  );
}
