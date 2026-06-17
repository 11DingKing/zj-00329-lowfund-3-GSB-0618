import type { SupportDirection } from '../../shared/types';
import { ShieldCheck, Cpu, Factory } from 'lucide-react';

interface DirectionIconProps {
  direction: SupportDirection;
  size?: number;
  className?: string;
}

export default function DirectionIcon({ direction, size = 20, className = '' }: DirectionIconProps) {
  switch (direction) {
    case 'testing_capability':
      return <ShieldCheck size={size} className={className} />;
    case 'tech_breakthrough':
      return <Cpu size={size} className={className} />;
    case 'production_expansion':
      return <Factory size={size} className={className} />;
  }
}
