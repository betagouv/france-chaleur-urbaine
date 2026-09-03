import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import ReseauAutocomplete from '@/modules/reseaux/client/ReseauAutocomplete';
import type { NetworkType } from '@/modules/reseaux/constants';

export type NetworkLink = {
  id: number;
  label: string;
};

/** Label d'un réseau référencé dans une colonne ou un dialog de liens : `#id · SNCU · nom` (parties vides omises). */
export const networkLinkLabel = (network: { id_fcu: number; id_sncu?: string | null; nom_reseau?: string | null }) =>
  `#${network.id_fcu}${network.id_sncu ? ` · ${network.id_sncu}` : ''}${network.nom_reseau ? ` · ${network.nom_reseau}` : ''}`;

type NetworkLinksFieldProps = {
  value: NetworkLink[];
  onChange: (links: NetworkLink[]) => void;
  networkType: NetworkType;
  label?: string;
};

/**
 * Edits a list of linked networks (PDP ↔ réseaux) : one removable labelled tag per
 * linked network plus a search-based autocomplete to add one.
 * Controlled via `value`/`onChange` (compatible with the form `CustomField` bridge).
 */
export function NetworkLinksField({ value, onChange, networkType, label }: NetworkLinksFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <span className="fr-label">{label}</span>}
      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {value.map((link) => (
            <Tag key={link.id} size="sm" className="inline-flex items-center gap-1">
              {link.label}
              <Button
                size="small"
                priority="tertiary no outline"
                iconId="fr-icon-close-line"
                title="Retirer le lien"
                onClick={() => onChange(value.filter((otherLink) => otherLink.id !== link.id))}
              />
            </Tag>
          ))}
        </div>
      )}
      <ReseauAutocomplete
        networkTypes={[networkType]}
        placeholder="Ajouter par nom ou SNCU"
        onSelect={(network) => {
          if (!value.some((link) => link.id === network.id_fcu)) {
            onChange([
              ...value,
              {
                id: network.id_fcu,
                label: networkLinkLabel({ id_fcu: network.id_fcu, id_sncu: network.identifiant_reseau, nom_reseau: network.nom_reseau }),
              },
            ]);
          }
        }}
      />
    </div>
  );
}
