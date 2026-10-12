import { useStore } from '@tanstack/react-form';
import { skipToken } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Loader from '@/components/ui/Loader';
import Notice from '@/components/ui/Notice';
import type { DialogControl } from '@/hooks/useDialogState';
import { Autocomplete } from '@/modules/form/Autocomplete';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { notify, toastErrors } from '@/modules/notification';
import { MAX_MERGED_NETWORKS, type MergeableNetworkTable } from '@/modules/reseaux/constants';
import trpc, { type RouterOutput } from '@/modules/trpc/client';

import MergeNetworkImpacts from './MergeNetworkImpacts';

export type NetworkToMerge = { table: MergeableNetworkTable };

type MergeNetworksDialogProps = {
  control: DialogControl<NetworkToMerge>;
  onMerged: () => void;
};

type MergeCandidate = RouterOutput['reseaux']['mergePreview']['candidates'][number];
type NetworkToAdd = RouterOutput['reseaux']['searchNetworksToMerge'][number];

const zMergeForm = z.object({
  choices: z.record(z.string(), z.string()),
  keptId: z.string().min(1, 'Choisissez le réseau conservé'),
});

const networkLabel = (network: { id_fcu: number; nom_reseau: string | null; identifiant_reseau: string | null }) =>
  [network.identifiant_reseau, network.nom_reseau ?? `Réseau #${network.id_fcu}`].filter(Boolean).join(' - ');

/**
 * Merges networks of one type into one: the admin adds the networks, picks the kept one and, field by field, the value to
 * keep, sees everything that will be repointed (demands, permissions, documents…) and confirms with a single button.
 */
function MergeNetworksDialog({ control, onMerged }: MergeNetworksDialogProps) {
  return (
    <Dialog {...control.dialogProps} size="lg" title="Fusionner des réseaux">
      {control.isOpen && control.data && (
        <MergeNetworksForm key={control.data.table} table={control.data.table} onMerged={onMerged} close={control.close} />
      )}
    </Dialog>
  );
}

export default MergeNetworksDialog;

type MergeNetworksFormProps = { table: MergeableNetworkTable; onMerged: () => void; close: () => void };

function MergeNetworksForm({ table, onMerged, close }: MergeNetworksFormProps) {
  const utils = trpc.useUtils();
  const [added, setAdded] = useState<NetworkToAdd[]>([]);
  const ids = added.map((candidate) => candidate.id_fcu);
  const { data: preview, isFetching } = trpc.reseaux.mergePreview.useQuery(ids.length >= 2 ? { ids, table } : skipToken);
  const mergeNetworks = trpc.reseaux.mergeNetworks.useMutation();

  const form = useAppForm({
    ...schemaValidation(zMergeForm),
    defaultValues: { choices: {} as Record<string, string>, keptId: '' },
    onSubmit: toastErrors(async ({ value }) => {
      const keptId = Number(value.keptId);
      const impacts = await mergeNetworks.mutateAsync({
        absorbedIds: ids.filter((id) => id !== keptId),
        choices: Object.fromEntries(Object.entries(value.choices).map(([field, id]) => [field, Number(id)])),
        keptId,
        table,
      });
      notify('success', `Réseaux fusionnés : ${impacts.demands} demande(s) et ${impacts.permissions.length} permission(s) repointées`);
      close();
      onMerged();
    }),
  });
  const keptId = useStore(form.store, (state) => state.values.keptId);
  const kept = preview?.candidates.find((candidate) => String(candidate.id_fcu) === keptId);
  const absorbed = preview?.candidates.filter((candidate) => String(candidate.id_fcu) !== keptId) ?? [];
  // a field is proposed when the networks carry different values; the kept network's value is preselected
  const differingFields = (preview?.fields ?? []).filter(
    (field) => new Set(preview?.candidates.map((candidate) => candidate.values[field.key] ?? '')).size > 1
  );
  useEffect(() => {
    // the first network added is kept by default, until the admin picks another one still in the merge
    if (!ids.includes(Number(keptId))) {
      form.setFieldValue('keptId', ids.length > 0 ? String(ids[0]) : '', { dontUpdateMeta: true });
    }
    form.setFieldValue('choices', Object.fromEntries(differingFields.map((field) => [field.key, keptId])), { dontUpdateMeta: true });
    // reset when the networks or the kept one change: the preview carries the candidates and their fields
  }, [preview, keptId, added]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCandidates = useCallback(
    async (search: string) =>
      (await utils.reseaux.searchNetworksToMerge.fetch({ search, table })).filter((candidate) => !ids.includes(candidate.id_fcu)),
    [utils, table, ids]
  );

  return (
    <Form form={form}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="mb-0 text-sm font-medium">Réseaux à fusionner</p>
          {ids.length < MAX_MERGED_NETWORKS && (
            <Autocomplete<NetworkToAdd>
              // remounted after each pick: the field is emptied for the next network
              key={added.length}
              fetchFn={fetchCandidates}
              getOptionValue={networkLabel}
              getOptionLabel={networkLabel}
              onSelect={(candidate) => setAdded((current) => [...current, candidate])}
              minCharThreshold={1}
              nativeInputProps={{ className: 'fr-input', placeholder: 'nom, identifiant SNCU ou id FCU' }}
            />
          )}
          {added.length < 2 && <p className="mb-0 text-sm text-faded">Ajoutez au moins deux réseaux.</p>}
          {added.length > 0 && (
            <ul className="mb-0 flex flex-wrap gap-2">
              {added.map((candidate) => (
                <li key={candidate.id_fcu} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm">
                  <span>{networkLabel(candidate)}</span>
                  <Button
                    size="small"
                    priority="tertiary"
                    iconId="fr-icon-close-line"
                    title="Retirer de la fusion"
                    onClick={() => setAdded((current) => current.filter((item) => item.id_fcu !== candidate.id_fcu))}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {isFetching && <Loader size="sm" />}
        {preview && (
          <>
            <form.AppField name="keptId">
              {(field) => (
                <field.RadioField
                  label="Réseau conservé (son identifiant FCU reste, les autres sont supprimés)"
                  small
                  options={preview.candidates.map((candidate) => ({
                    label: `${networkLabel(candidate)}${candidate.has_geometry ? '' : ' — sans tracé'}`,
                    nativeInputProps: { value: String(candidate.id_fcu) },
                  }))}
                />
              )}
            </form.AppField>

            {differingFields.map((field) => (
              <form.AppField key={field.key} name={`choices.${field.key}`}>
                {(choice) => (
                  <choice.RadioField
                    label={field.label}
                    small
                    options={preview.candidates.map((candidate) => ({
                      label: `${candidate.values[field.key] ?? '(vide)'} — ${candidate.nom_reseau ?? `#${candidate.id_fcu}`}`,
                      nativeInputProps: { value: String(candidate.id_fcu) },
                    }))}
                  />
                )}
              </form.AppField>
            ))}
            {differingFields.length === 0 && (
              <p className="mb-0 text-sm text-faded">Les réseaux portent les mêmes valeurs : rien à choisir.</p>
            )}

            {kept && <MergeNetworkImpacts absorbed={absorbed as MergeCandidate[]} keptLabel={networkLabel(kept)} />}
            {preview.blockers.map((blocker) => (
              <Notice key={blocker} variant="alert" size="sm">
                {blocker}
              </Notice>
            ))}
            <div className="flex justify-end">
              <form.SubmitButton disabled={preview.blockers.length > 0 || isFetching} loading={mergeNetworks.isPending}>
                Fusionner {ids.length} réseaux
              </form.SubmitButton>
            </div>
          </>
        )}
      </div>
    </Form>
  );
}
