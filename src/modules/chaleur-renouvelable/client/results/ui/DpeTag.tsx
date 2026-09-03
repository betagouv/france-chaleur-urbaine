import type { DPE } from '@/modules/chaleur-renouvelable/constants';
import cx from '@/utils/cx';

const DPE_BG: Record<DPE, string> = {
  A: 'bg-[#00A06C]',
  B: 'bg-[#52B053]',
  C: 'bg-[#A6CB71]',
  D: 'bg-[#F5E70F]',
  E: 'bg-[#F0B50E]',
  F: 'bg-[#EC8136]',
  G: 'bg-[#D7211F]',
};

type DpeTagProps = {
  letter: DPE;
  isSelected?: boolean;
  onClick?: (letter: DPE) => void;
  size?: 'md' | 'sm';
};

export function DpeTag({ letter, isSelected = false, onClick, size = 'md' }: DpeTagProps) {
  const className = cx(
    'flex items-center justify-center rounded-sm border-2',
    size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
    DPE_BG[letter],
    onClick && 'cursor-pointer',
    isSelected ? 'border-blue ring-2 ring-blue' : 'border-white'
  );
  const content = (
    <div className={cx('flex items-center justify-center rounded-full bg-white', size === 'sm' ? 'h-5 w-5' : 'h-6 w-6')}>
      <span className={cx('font-bold mt-0.5', size === 'sm' ? 'text-xs' : 'text-sm')}>{letter}</span>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" className={className} aria-label={`Classe énergétique ${letter}`} onClick={() => onClick(letter)}>
        {content}
      </button>
    );
  }

  return (
    <div className={className} aria-label={`Classe énergétique ${letter}`}>
      {content}
    </div>
  );
}
