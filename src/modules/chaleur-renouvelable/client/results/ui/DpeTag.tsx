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
};

export function DpeTag({ letter, isSelected = false, onClick }: DpeTagProps) {
  const className = cx(
    'flex h-12 w-12 items-center justify-center rounded-sm border-2',
    DPE_BG[letter],
    onClick && 'cursor-pointer',
    isSelected ? 'border-blue ring-2 ring-blue' : 'border-white'
  );
  const content = (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
      <span className="font-bold">{letter}</span>
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
