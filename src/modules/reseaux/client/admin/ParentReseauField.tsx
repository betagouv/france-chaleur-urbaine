import Button from '@/components/ui/Button';
import { networkLinkLabel } from '@/modules/reseaux/client/admin/NetworkLinksField';
import ReseauAutocomplete from '@/modules/reseaux/client/ReseauAutocomplete';

export type ParentReseauValue = {
  id: number;
  label: string | null;
};

type ParentReseauFieldProps = {
  value: ParentReseauValue | null;
  onChange: (value: ParentReseauValue | null) => void;
  label?: string;
};

/**
 * Edits the parent RC link of a réseau en construction (extension) : shows the linked
 * network with an unlink button, or an RC-only autocomplete to set the link.
 * Controlled via `value`/`onChange` (compatible with the form `CustomField` bridge).
 */
export function ParentReseauField({ value, onChange, label }: ParentReseauFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="fr-label">{label}</span>}
      {value !== null ? (
        <div className="flex items-center justify-between gap-1">
          <span>{value.label ?? `#${value.id}`}</span>
          <Button size="small" priority="tertiary" iconId="fr-icon-close-line" title="Retirer le lien" onClick={() => onChange(null)} />
        </div>
      ) : (
        <ReseauAutocomplete
          networkTypes={['reseau_de_chaleur']}
          placeholder="nom ou SNCU du réseau"
          onSelect={(network) =>
            onChange({
              id: network.id_fcu,
              label: networkLinkLabel({ id_fcu: network.id_fcu, id_sncu: network.identifiant_reseau, nom_reseau: network.nom_reseau }),
            })
          }
        />
      )}
    </div>
  );
}
