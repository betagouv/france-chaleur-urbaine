import Image from 'next/image';
import { useState } from 'react';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import PopoverTrigger, { Popover, PopoverContent } from '@/components/ui/Popover';

import { CcrtArchiveForm } from './CcrtArchiveForm';
import { CcrtTransferForm } from './CcrtTransferForm';

type CcrtDemandModerationMenuProps = { demandId: string; full?: boolean };

/**
 * Offers the two moderation paths before opening their dedicated forms.
 */
export function CcrtDemandModerationMenu({ demandId, full }: CcrtDemandModerationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'archive' | 'transfer' | null>(null);
  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button full={full} priority="secondary" size="small">
            Ne pas valider
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          aria-label="Ne pas valider la demande"
          className="w-[279px] max-w-[calc(100vw-2rem)] rounded-none! border border-(--border-default-grey) py-2"
        >
          <p className="mb-2 px-4 text-left text-[10px] leading-6 uppercase">Ne pas valider la demande</p>
          {(
            [
              ['transfer', 'Transférer à un gestionnaire de réseau', 'La demande est réaffectée'],
              ['archive', 'Archiver la demande', 'Elle ne sera transmise à aucun gestionnaire'],
            ] as const
          ).map(([action, label, description]) => (
            <div key={action}>
              <Image src="/icons/ccrt-moderation-separator.svg" width={277} height={1} alt="" />
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
                onClick={() => {
                  setIsOpen(false);
                  setMode(action);
                }}
              >
                <Image src={`/icons/ccrt-moderation-${action}.svg`} width={16} height={16} alt="" className="shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-5 text-(--text-action-high-blue-france)">{label}</span>
                  <span className="block text-xs leading-[17px]">{description}</span>
                </span>
              </button>
            </div>
          ))}
        </PopoverContent>
      </Popover>
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => !open && setMode(null)}
        title={mode === 'transfer' ? 'Transférer la demande' : 'Archiver la demande'}
      >
        {mode === 'archive' && <CcrtArchiveForm demandId={demandId} onClose={() => setMode(null)} />}
        {mode === 'transfer' && <CcrtTransferForm demandId={demandId} onClose={() => setMode(null)} />}
      </Dialog>
    </>
  );
}
