import { colorForType } from '../constants/types';

interface TypeBadgeProps {
  type: string;
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span className="type-badge" style={{ backgroundColor: colorForType(type) }}>
      {type}
    </span>
  );
}
