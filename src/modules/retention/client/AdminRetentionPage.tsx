import { useMemo, useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { businessRules } from '@/modules/app/business-rules';
import { notify, toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';

import { type RetentionRule, type RetentionRuleDefinition, retentionRuleDefinitions, retentionRules } from '../constants';

type RetentionPreview = RouterOutput['retention']['preview'][number];
type RetentionPreviewItem = RetentionPreview['items'][number];

/**
 * Admin page applying the data retention rules: for each rule, the rows that would be archived today,
 * the field-level effect of the archiving, then a manual, confirmed and audited action.
 */
const AdminRetentionPage = () => {
  const [selectedRule, setSelectedRule] = useState<RetentionRule | null>(null);
  const utils = trpc.useUtils();
  const { data: previews, isLoading } = trpc.retention.preview.useQuery();
  const archiveRule = trpc.retention.archive.useMutation();

  const selectedPreview = previews?.find((preview) => preview.rule === selectedRule);

  const handleArchive = toastErrors(async (rule: RetentionRule) => {
    const result = await archiveRule.mutateAsync({ rule });
    notify('success', `${result.count} élément(s) archivé(s) : ${retentionRuleDefinitions[rule].title}`);
    setSelectedRule(null);
    await utils.retention.preview.invalidate();
  });

  return (
    <SimplePage title="Conservation des données" mode="authenticated" layout="center">
      <Heading as="h1" color="blue-france">
        Conservation des données
      </Heading>
      <Text className="mb-6">
        Application manuelle des durées de conservation publiées dans la politique de confidentialité. Chaque règle affiche ce qu'elle
        archiverait aujourd'hui ; l'archivage est irréversible et tracé dans l'activité du site.
      </Text>

      <div className="flex flex-col gap-6">
        {retentionRules.map((rule) => {
          const definition = retentionRuleDefinitions[rule];
          const preview = previews?.find((item) => item.rule === rule);
          return (
            <RetentionRuleCard
              key={rule}
              definition={definition}
              duration={businessRules[definition.ruleId].display}
              loading={isLoading}
              preview={preview}
              onOpen={() => setSelectedRule(rule)}
            />
          );
        })}
      </div>

      <Dialog
        title={selectedRule ? `Archiver : ${retentionRuleDefinitions[selectedRule].title}` : ''}
        size="xl"
        open={!!selectedRule}
        onOpenChange={(open) => !open && setSelectedRule(null)}
      >
        {selectedRule && selectedPreview && (
          <RetentionConfirmation
            definition={retentionRuleDefinitions[selectedRule]}
            preview={selectedPreview}
            onCancel={() => setSelectedRule(null)}
            onConfirm={() => handleArchive(selectedRule)}
          />
        )}
      </Dialog>
    </SimplePage>
  );
};

export default AdminRetentionPage;

type RetentionRuleCardProps = {
  definition: RetentionRuleDefinition;
  duration: string;
  loading: boolean;
  preview?: RetentionPreview;
  onOpen: () => void;
};

/**
 * One retention rule: description, duration, number of rows concerned today and the entry point to the preview.
 */
function RetentionRuleCard({ definition, duration, loading, preview, onOpen }: RetentionRuleCardProps) {
  const count = preview?.count ?? 0;
  return (
    <div className="fr-card fr-card--no-arrow p-6">
      <Heading as="h2" size="h4" className="mb-2">
        {definition.title}
      </Heading>
      <Text className="mb-1">{definition.description}</Text>
      <Text size="sm" className="text-faded mb-4">
        Durée : {duration}. {definition.action}.
      </Text>
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-bold">{loading ? 'Calcul…' : `${count} élément(s) à archiver`}</span>
        <Button size="small" priority="secondary" disabled={loading || count === 0} onClick={onOpen}>
          Prévisualiser et archiver
        </Button>
      </div>
    </div>
  );
}

type RetentionConfirmationProps = {
  definition: RetentionRuleDefinition;
  preview: RetentionPreview;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Confirmation step: the field-level transformations, the full list of rows concerned, then the irreversible action.
 */
function RetentionConfirmation({ definition, preview, onCancel, onConfirm }: RetentionConfirmationProps) {
  const columns: ColumnDef<RetentionPreviewItem>[] = useMemo(
    () => [
      { accessorKey: 'label', header: definition.ruleId === 'retentionDemandsClosedYears' ? 'Adresse' : 'Email' },
      { accessorKey: 'date', cellType: 'Date', header: 'Date de référence', width: '160px' },
      { accessorKey: 'id', header: 'Identifiant', width: '320px' },
    ],
    [definition.ruleId]
  );

  return (
    <div className="flex flex-col gap-4">
      <Text className="mb-0">
        <strong>{preview.count} élément(s)</strong> seront traités. Cette opération est irréversible.
      </Text>

      <Heading as="h3" size="h6" className="mb-0">
        Ce qui sera modifié
      </Heading>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-(--border-default-grey) bg-(--background-alt-grey) px-3 py-2 text-left">Champ</th>
            <th className="border border-(--border-default-grey) bg-(--background-alt-grey) px-3 py-2 text-left">Après archivage</th>
          </tr>
        </thead>
        <tbody>
          {definition.transformations.map((transformation) => (
            <tr key={transformation.field}>
              <td className="border border-(--border-default-grey) px-3 py-2">{transformation.field}</td>
              <td className="border border-(--border-default-grey) px-3 py-2">{transformation.after}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Heading as="h3" size="h6" className="mb-0">
        Éléments concernés
      </Heading>
      <TableSimple
        columns={columns}
        data={preview.items}
        enableGlobalFilter
        padding="sm"
        initialSortingState={[{ desc: false, id: 'date' }]}
      />

      <div className="flex justify-end gap-2">
        <Button priority="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <AsyncButton iconId="ri-delete-bin-line" onClick={onConfirm}>
          Archiver {preview.count} élément(s)
        </AsyncButton>
      </div>
    </div>
  );
}
