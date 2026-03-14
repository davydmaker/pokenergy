import { ENERGY_TYPES } from '../game/types';

const ICONS: Record<string, React.ReactNode> = {
  fire: <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.17-6.09 4-7.65.5-.43 1.28-.04 1.22.6-.1 1.05.2 2.15.82 3.05.1.15.3.1.34-.05C10.58 9.2 11.6 6.6 11.2 3.8c-.08-.56.48-.97.97-.65C14.94 5.05 18 8.6 18 12.5c0 .47-.04.93-.12 1.38-.05.27.2.48.43.3.58-.44 1.06-1 1.4-1.62.2-.37.74-.37.83.05.15.67.23 1.37.23 2.09 0 4.86-3.58 8.3-8.77 8.3z" />,
  water: <path d="M12 2c-.5 0-1 .2-1.3.58C8.87 5.15 5 10.13 5 14.5 5 18.64 8.13 22 12 22s7-3.36 7-7.5c0-4.37-3.87-9.35-5.7-11.92C13 2.2 12.5 2 12 2z" />,
  grass: <path d="M17.75 3C15.4 3 12.4 4.1 10.13 6.13 7.87 8.16 6.25 11.18 6.25 15c0 .55.45 1 1 1s1-.45 1-1c0-.93.08-1.8.24-2.63C9.74 13.69 11.63 15 14 15c3.31 0 6-2.69 6-6V4c0-.55-.45-1-1-1h-1.25zM4.5 20.5c-.28 0-.5.22-.5.5s.22.5.5.5h15c.28 0 .5-.22.5-.5s-.22-.5-.5-.5h-15z" />,
  lightning: <path d="M7 2v11h3v9l7-12h-4l4-8z" />,
  psychic: <><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" /><circle cx="12" cy="12" r="2" /></>,
  fighting: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01z" />,
  darkness: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.31 0 2.56-.25 3.71-.71-3.58-1.57-6.08-5.12-6.08-9.29s2.5-7.72 6.08-9.29C14.56 2.25 13.31 2 12 2z" />,
  metal: <path d="M19.14 12.94l-3.44-2V7.06l3.44-2 1.72 2.98-1.72 2.98 1.72 2.98-1.72 2.94zm-7.14 4.12L8.56 19.04 5.12 17.06v-3.98l3.44-2 3.44 2v3.98zM8.56 4.96L12 6.94v3.98l-3.44 2-3.44-2V6.94l3.44-1.98z" />,
  fairy: <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8 2.4-7.2-6-4.8h7.6z" />,
  dragon: <><path d="M12 2L4 12l8 10 8-10L12 2zm0 3.5L17.5 12 12 18.5 6.5 12 12 5.5z" /></>,
};

interface Props {
  typeId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 22, md: 32, lg: 80 };
const SVG_SIZES = { sm: 12, md: 18, lg: 44 };

export default function EnergyIcon({ typeId, size = 'md', className = '' }: Props) {
  const t = ENERGY_TYPES.find(e => e.id === typeId);
  const bg = t?.color || '#555';
  const dim = SIZES[size];
  const svgDim = SVG_SIZES[size];

  return (
    <div
      className={`energy-icon ${className}`}
      style={{
        width: dim,
        height: dim,
        minWidth: dim,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg viewBox="0 0 24 24" fill="white" width={svgDim} height={svgDim}>
        {ICONS[typeId]}
      </svg>
    </div>
  );
}
