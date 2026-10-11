import { STAT_LABELS } from '../constants/types';
import type { PokemonStat } from '../types/pokemon';

const MAX_STAT_VALUE = 255; // tope teórico de un stat base en los juegos

interface StatBarProps {
  stat: PokemonStat;
}

export default function StatBar({ stat }: StatBarProps) {
  const percentage = Math.min(100, (stat.baseValue / MAX_STAT_VALUE) * 100);
  const label = STAT_LABELS[stat.name] ?? stat.name;

  return (
    <div className="stat-bar-row">
      <span className="stat-bar-label">{label}</span>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
      <span className="stat-bar-value">{stat.baseValue}</span>
    </div>
  );
}
