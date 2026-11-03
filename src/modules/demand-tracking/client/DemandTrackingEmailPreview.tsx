import { raccordementStatusDisplays } from '@/modules/demand-tracking/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

const PREVIEW_STATUS = raccordementStatusDisplays[DEMANDE_STATUS.RECONTACTED];

/**
 * Static illustration of the "Où en est votre demande ?" email: one sample row with the four columns the visitor will receive.
 */
export function DemandTrackingEmailPreview() {
  return (
    <div className="flex flex-col gap-3 border border-(--border-default-grey) bg-white p-4 text-sm" aria-label="Aperçu de l'email reçu">
      <p className="mb-0 text-xs font-bold uppercase text-(--text-mention-grey)">Aperçu de l'email</p>
      <p className="mb-0 font-bold">Objet : [France Chaleur Urbaine] Où en est votre demande ?</p>
      <p className="mb-0">Bonjour Marie, voici où en est votre demande aujourd'hui.</p>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-(--border-default-grey) pt-3">
        <dt className="font-bold">Adresse</dt>
        <dd className="m-0">12 place du Capitole, 31000 Toulouse</dd>
        <dt className="font-bold">État</dt>
        <dd className="m-0">{PREVIEW_STATUS.label}</dd>
        <dt className="font-bold">Explication</dt>
        <dd className="m-0">{PREVIEW_STATUS.explanation}</dd>
      </dl>
    </div>
  );
}
