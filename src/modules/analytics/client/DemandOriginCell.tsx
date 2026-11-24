import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

import { type DemandOrigin, demandOriginFields, getDemandOriginValue, originChannels } from '../demand-origin';

type DemandOriginCellProps = { origin: DemandOrigin };

/** Displays an admin-only origin summary and the evidence retained with the demand. */
export function DemandOriginCell({ origin }: DemandOriginCellProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="max-w-full break-words text-left text-sm text-(--text-action-high-blue-france) underline"
          aria-label={`Origine : ${originChannels[origin.channel]}. Voir les détails`}
        >
          {originChannels[origin.channel]}
        </button>
      </PopoverTrigger>
      <PopoverContent
        full={false}
        className="max-h-[70vh] w-80 max-w-[90vw] overflow-y-auto bg-(--background-default-grey)! p-4 text-(--text-default-grey)!"
      >
        <p className="mb-3 font-bold">Origine de la demande</p>
        <dl className="m-0 space-y-2 text-sm">
          {origin.detail && (
            <div className="break-words">
              <dt className="font-bold">Détail de l’origine</dt>
              <dd className="m-0">{origin.detail}</dd>
            </div>
          )}
          {demandOriginFields
            .map(([key, label]) => [label, getDemandOriginValue(origin.acquisition, key)])
            .filter(([, value]) => !!value)
            .map(([label, value]) => (
              <div key={label} className="break-words">
                <dt className="font-bold">{label}</dt>
                <dd className="m-0">{value}</dd>
              </div>
            ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
