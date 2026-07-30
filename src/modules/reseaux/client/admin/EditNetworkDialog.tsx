import { useStore } from '@tanstack/react-form';
import { z } from 'zod';

import DsfrInput from '@/components/form/dsfr/Input';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { type NetworkLink, NetworkLinksField } from '@/modules/reseaux/client/admin/NetworkLinksField';
import { ParentReseauField } from '@/modules/reseaux/client/admin/ParentReseauField';

export type EditableNetwork =
  | {
      type: 'reseau_de_chaleur' | 'reseau_de_froid';
      id_fcu: number;
      nom_reseau: string | null;
      id_sncu: string | null;
      gestionnaire: string | null;
      maitre_ouvrage: string | null;
    }
  | {
      type: 'reseau_en_construction';
      id_fcu: number;
      nom_reseau: string | null;
      id_sncu: string | null;
      gestionnaire: string | null;
      maitre_ouvrage: string | null;
      mise_en_service: string | null;
      ouvert_aux_raccordements: boolean;
      reseau_de_chaleur_id: number | null;
      parentLabel: string | null;
    }
  | {
      type: 'perimetre_de_developpement_prioritaire';
      id_fcu: number;
      gestionnaire: string | null;
      maitre_ouvrage: string | null;
      reseau_de_chaleur_links: NetworkLink[];
      reseau_en_construction_links: NetworkLink[];
    };

/** Only the fields the admin actually changed are present. */
export type EditableNetworkValues = {
  nom_reseau?: string;
  gestionnaire?: string | null;
  maitre_ouvrage?: string | null;
  id_sncu?: string | null;
  mise_en_service?: string | null;
  ouvert_aux_raccordements?: boolean;
  reseau_de_chaleur_id?: number | null;
  reseau_de_chaleur_ids?: number[];
  reseau_en_construction_ids?: number[];
};

const zNetworkLink = z.object({ id: z.number(), label: z.string() });

// Valeurs plates communes aux 4 entités : les champs non affichés pour un type gardent leur valeur par défaut
const zEditNetworkForm = z.object({
  gestionnaire: z.string(),
  id_sncu: z.string(),
  maitre_ouvrage: z.string(),
  mise_en_service: z.string(),
  nom_reseau: z.string(),
  ouvert_aux_raccordements: z.boolean(),
  parent: z.object({ id: z.number(), label: z.string().nullable() }).nullable(),
  reseau_de_chaleur_links: z.array(zNetworkLink),
  reseau_en_construction_links: z.array(zNetworkLink),
});
const zEditNetworkFormAvecNom = zEditNetworkForm.extend({
  nom_reseau: z.string().trim().min(1, 'Le nom du réseau est obligatoire'),
});

// Le nom d'une extension liée est recopié depuis le réseau parent : il n'est requis que sans lien
const zEditNetworkFormConstruction = zEditNetworkForm.superRefine((values, ctx) => {
  if (values.parent === null && values.nom_reseau.trim() === '') {
    ctx.addIssue({ code: 'custom', message: 'Le nom du réseau est obligatoire', path: ['nom_reseau'] });
  }
});

type EditNetworkFormValues = z.infer<typeof zEditNetworkForm>;

type EditNetworkDialogProps = {
  network: EditableNetwork | null;
  onClose: () => void;
  onSave: (network: EditableNetwork, values: EditableNetworkValues) => Promise<void>;
};

/**
 * Row-level edit dialog of the networks admin page: FCU-owned fields only
 * (name, gestionnaire, MO, links between entities). One mutation per save.
 */
export function EditNetworkDialog({ network, onClose, onSave }: EditNetworkDialogProps) {
  return (
    <Dialog
      open={network !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={
        network?.type === 'perimetre_de_developpement_prioritaire'
          ? `Modifier le PDP #${network.id_fcu}`
          : `Modifier le réseau #${network?.id_fcu}`
      }
      size="md"
    >
      {network && <EditNetworkForm key={`${network.type}-${network.id_fcu}`} network={network} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

type EditNetworkFormProps = {
  network: EditableNetwork;
  onClose: () => void;
  onSave: (network: EditableNetwork, values: EditableNetworkValues) => Promise<void>;
};

/**
 * Inner form of the dialog, remounted per network (via key) so the form state
 * always starts from the row values. The name is required for network entities.
 */
function EditNetworkForm({ network, onClose, onSave }: EditNetworkFormProps) {
  const form = useAppForm({
    ...schemaValidation(
      network.type === 'perimetre_de_developpement_prioritaire'
        ? zEditNetworkForm
        : network.type === 'reseau_en_construction'
          ? zEditNetworkFormConstruction
          : zEditNetworkFormAvecNom
    ),
    defaultValues: {
      gestionnaire: network.gestionnaire ?? '',
      id_sncu: network.type === 'reseau_de_chaleur' || network.type === 'reseau_de_froid' ? (network.id_sncu ?? '') : '',
      maitre_ouvrage: network.maitre_ouvrage ?? '',
      mise_en_service: network.type === 'reseau_en_construction' ? (network.mise_en_service ?? '') : '',
      nom_reseau: 'nom_reseau' in network ? (network.nom_reseau ?? '') : '',
      ouvert_aux_raccordements: network.type === 'reseau_en_construction' ? network.ouvert_aux_raccordements : false,
      parent:
        network.type === 'reseau_en_construction' && network.reseau_de_chaleur_id !== null
          ? { id: network.reseau_de_chaleur_id, label: network.parentLabel }
          : null,
      reseau_de_chaleur_links: network.type === 'perimetre_de_developpement_prioritaire' ? network.reseau_de_chaleur_links : [],
      reseau_en_construction_links: network.type === 'perimetre_de_developpement_prioritaire' ? network.reseau_en_construction_links : [],
    } satisfies EditNetworkFormValues,
    onSubmit: async ({ value }) => {
      const changedValues = buildChangedValues(network, value);
      if (Object.keys(changedValues).length > 0) {
        await onSave(network, changedValues);
      }
      onClose();
    },
  });

  // Extension liée à un RC parent : gestionnaire/MO deviennent des copies strictes du parent → désactivés
  const isExtension = useStore(form.store, (state) => state.values.parent !== null);
  const inheritedHint = 'Recopié automatiquement depuis le réseau étendu — se modifie sur le réseau de chaleur';
  const pdpFillHint =
    network.type === 'perimetre_de_developpement_prioritaire'
      ? 'Si laissé vide, repris automatiquement des réseaux liés (quand ils portent une valeur unique)'
      : undefined;

  return (
    <Form form={form}>
      <div className="flex flex-col gap-4">
        {'nom_reseau' in network && (
          <form.AppField name="nom_reseau">
            {(field) => <field.TextField label="Nom du réseau" disabled={isExtension} hintText={isExtension ? inheritedHint : undefined} />}
          </form.AppField>
        )}
        {(network.type === 'reseau_de_chaleur' || network.type === 'reseau_de_froid') && (
          <form.AppField name="id_sncu">
            {(field) => (
              <field.TextField
                label="ID SNCU"
                hintText="Identifiant du réseau dans l'enquête nationale — recopié automatiquement sur les extensions et PDP liés"
              />
            )}
          </form.AppField>
        )}
        {network.type === 'reseau_en_construction' && (
          <form.AppField name="parent">
            {(field) => <field.CustomField Component={ParentReseauField} label="Réseau étendu (extension)" />}
          </form.AppField>
        )}
        {network.type === 'reseau_en_construction' && isExtension && (
          <DsfrInput
            label="ID SNCU"
            hintText={inheritedHint}
            disabled
            hideOptionalLabel
            nativeInputProps={{ readOnly: true, value: network.id_sncu ?? '' }}
          />
        )}
        <form.AppField name="gestionnaire">
          {(field) => <field.TextField label="Gestionnaire" disabled={isExtension} hintText={isExtension ? inheritedHint : pdpFillHint} />}
        </form.AppField>
        <form.AppField name="maitre_ouvrage">
          {(field) => (
            <field.TextField label="Maître d'ouvrage" disabled={isExtension} hintText={isExtension ? inheritedHint : pdpFillHint} />
          )}
        </form.AppField>
        {network.type === 'reseau_en_construction' && (
          <>
            <form.AppField name="mise_en_service">
              {(field) => (
                <field.TextField label="Mise en service prévue" hintText="Texte libre : année ou période (ex. 2026, 2026-2028)" />
              )}
            </form.AppField>
            <form.AppField name="ouvert_aux_raccordements">
              {(field) => <field.CheckboxField label="Ouvert aux raccordements" />}
            </form.AppField>
          </>
        )}
        {network.type === 'perimetre_de_developpement_prioritaire' && (
          <>
            <form.AppField name="reseau_de_chaleur_links">
              {(field) => (
                <field.CustomField Component={NetworkLinksField} label="Réseaux de chaleur liés" networkType="reseau_de_chaleur" />
              )}
            </form.AppField>
            <form.AppField name="reseau_en_construction_links">
              {(field) => (
                <field.CustomField
                  Component={NetworkLinksField}
                  label="Réseaux en construction liés"
                  networkType="reseau_en_construction"
                />
              )}
            </form.AppField>
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button priority="secondary" onClick={onClose}>
            Annuler
          </Button>
          <form.SubmitButton>Enregistrer</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
}

/** Diffs the submitted form values against the row: only the changed fields are sent to the mutation. */
const buildChangedValues = (network: EditableNetwork, value: EditNetworkFormValues): EditableNetworkValues => {
  const values: EditableNetworkValues = {};
  // Extension liée : nom/gestionnaire/MO sont recopiés du parent par la synchro, on n'envoie jamais de saisie
  const inheritedFromParent = network.type === 'reseau_en_construction' && value.parent !== null;
  if (!inheritedFromParent && 'nom_reseau' in network && value.nom_reseau.trim() !== (network.nom_reseau ?? '')) {
    values.nom_reseau = value.nom_reseau.trim();
  }
  if (!inheritedFromParent && value.gestionnaire !== (network.gestionnaire ?? '')) {
    values.gestionnaire = value.gestionnaire.trim() || null;
  }
  if (!inheritedFromParent && value.maitre_ouvrage !== (network.maitre_ouvrage ?? '')) {
    values.maitre_ouvrage = value.maitre_ouvrage.trim() || null;
  }
  if ((network.type === 'reseau_de_chaleur' || network.type === 'reseau_de_froid') && value.id_sncu !== (network.id_sncu ?? '')) {
    values.id_sncu = value.id_sncu.trim() || null;
  }
  if (network.type === 'reseau_en_construction') {
    if ((value.parent?.id ?? null) !== network.reseau_de_chaleur_id) {
      values.reseau_de_chaleur_id = value.parent?.id ?? null;
    }
    if (value.mise_en_service !== (network.mise_en_service ?? '')) {
      values.mise_en_service = value.mise_en_service.trim() || null;
    }
    if (value.ouvert_aux_raccordements !== network.ouvert_aux_raccordements) {
      values.ouvert_aux_raccordements = value.ouvert_aux_raccordements;
    }
  }
  if (network.type === 'perimetre_de_developpement_prioritaire') {
    const toIds = (links: NetworkLink[]) => links.map((link) => link.id);
    if (toIds(value.reseau_de_chaleur_links).join(',') !== toIds(network.reseau_de_chaleur_links).join(',')) {
      values.reseau_de_chaleur_ids = toIds(value.reseau_de_chaleur_links);
    }
    if (toIds(value.reseau_en_construction_links).join(',') !== toIds(network.reseau_en_construction_links).join(',')) {
      values.reseau_en_construction_ids = toIds(value.reseau_en_construction_links);
    }
  }
  return values;
};
