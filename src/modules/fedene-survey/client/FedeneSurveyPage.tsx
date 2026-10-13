import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { useState } from 'react';
import { z } from 'zod';

import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import Notice from '@/components/ui/Notice';
import { useDialogState } from '@/hooks/useDialogState';
import type { UploadedFile } from '@/modules/files/constants';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { notify, toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { postFormDataFetchJSON } from '@/utils/network';

import {
  type SurveyDiscrepancyDecision,
  type SurveyDiscrepancyField,
  surveyDiscrepancyDecisionLabels,
  surveyDiscrepancyFieldLabels,
} from '../constants';
import { type DiffSegment, diffValues } from '../text-diff';

type ImportReport = RouterOutput['fedeneSurvey']['previewImport'];
type Discrepancy = RouterOutput['fedeneSurvey']['listDiscrepancies'][number];

const zImportForm = z.object({
  fichier: z.array(z.instanceof(File)).length(1, 'Choisissez le fichier de la bibliothèque FEDENE (xlsx)'),
});
type ImportFormValues = z.infer<typeof zImportForm>;
const importDefaultValues: ImportFormValues = { fichier: [] };

const plural = (count: number, singular: string, pluralForm = `${singular}s`) => `${count} ${count > 1 ? pluralForm : singular}`;

/**
 * « Enquête FEDENE » admin page: imports the FEDENE library (simulation first, then for real), then decides, field by field,
 * the FCU corrections that still differ from the survey: keep the correction, or restore the survey value.
 */
export default function FedeneSurveyPage() {
  return (
    <SimplePage
      title="Enquête FEDENE"
      description="Import de la bibliothèque FEDENE et traitement des écarts avec les corrections FCU"
      currentPage="/admin/modifications-reseau"
      mode="authenticated"
    >
      <div className="fr-container py-8 flex flex-col gap-10">
        <FedeneImportSection />
        <SurveyDiscrepanciesSection />
      </div>
    </SimplePage>
  );
}

/** Upload of the FEDENE library, simulation, then application of the simulated file. */
function FedeneImportSection() {
  const utils = trpc.useUtils();
  const previewImport = trpc.fedeneSurvey.previewImport.useMutation();
  const applyImport = trpc.fedeneSurvey.applyImport.useMutation();
  // the simulated file: « Appliquer » imports exactly what was simulated
  const [preview, setPreview] = useState<{ fileId: string; report: ImportReport } | null>(null);
  const [applied, setApplied] = useState<ImportReport | null>(null);

  const form = useAppForm({
    ...schemaValidation(zImportForm),
    defaultValues: importDefaultValues,
    onSubmit: toastErrors(async ({ value }) => {
      setApplied(null);
      const uploaded = await postFormDataFetchJSON<{ files: UploadedFile[] }>('/api/files/upload', { files: value.fichier });
      const fileId = uploaded.files[0].id;
      const report = await previewImport.mutateAsync({ fileId });
      // the file changed meanwhile: this simulation is stale, « Appliquer » must not import it
      if (form.state.values.fichier[0] === value.fichier[0]) {
        setPreview({ fileId, report });
      }
    }),
  });

  const apply = toastErrors(async () => {
    if (!preview) {
      return;
    }
    const report = await applyImport.mutateAsync({ fileId: preview.fileId });
    setApplied(report);
    setPreview(null);
    await utils.fedeneSurvey.listDiscrepancies.invalidate();
    notify('success', 'Bibliothèque FEDENE importée');
  });

  return (
    <section className="flex flex-col gap-4">
      <Heading as="h2" size="h4" className="mb-0">
        Importer la bibliothèque FEDENE
      </Heading>
      <p className="mb-0 text-sm text-gray-600">
        Le fichier met à jour les données d'enquête des réseaux de chaleur et de froid (chiffres, et valeurs d'enquête du nom, du
        gestionnaire et du maître d'ouvrage). Une correction FCU que l'enquête rejoint est retirée ; une correction qui diffère encore
        devient un écart à trancher ci-dessous. La simulation montre d'abord ce que l'import va faire, sans rien écrire.
      </p>
      <Form form={form}>
        <form.AppField name="fichier" listeners={{ onChange: () => setPreview(null) }}>
          {(field) => (
            <field.UploadField
              label="Bibliothèque de données des réseaux de chaleur et de froid"
              hint="Fichier xlsx publié par la FEDENE, onglet « BDD - complète »"
              nativeInputProps={{ accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }}
            />
          )}
        </form.AppField>
        <form.SubmitButton priority="secondary" iconId="fr-icon-search-line" className="mt-4">
          Simuler l'import
        </form.SubmitButton>
      </Form>
      {preview && (
        <>
          <ImportReportSummary report={preview.report} />
          <div>
            <Button iconId="fr-icon-save-3-line" loading={applyImport.isPending} onClick={apply}>
              Appliquer l'import
            </Button>
          </div>
        </>
      )}
      {applied && <ImportReportSummary report={applied} />}
    </section>
  );
}

type ImportReportSummaryProps = { report: ImportReport };

/** What the import did (or would do, in simulation), per filière. */
function ImportReportSummary({ report }: ImportReportSummaryProps) {
  const filieres = [
    { label: 'Réseaux de chaleur', result: report.chaleur },
    { label: 'Réseaux de froid', result: report.froid },
  ];
  return (
    <Notice variant="info" size="sm">
      <p className="mb-2 font-semibold">
        {report.dryRun
          ? `Simulation de ${report.filename} (${plural(report.rows, 'ligne')}) : rien n'est encore écrit.`
          : `${report.filename} importé (${plural(report.rows, 'ligne')}).`}
        {report.ignoredRows > 0 ? ` ${plural(report.ignoredRows, 'ligne ignorée', 'lignes ignorées')} (identifiant SNCU invalide).` : ''}
      </p>
      <div className="flex flex-col gap-3">
        {filieres.map(({ label, result }) => (
          <div key={label}>
            <p className="mb-1 font-medium">{label}</p>
            <ul className="mb-0 text-sm">
              <li>
                {result.updated} réseaux mis à jour, dont {result.changed} avec des valeurs modifiées
              </li>
              <li>{result.clearedCorrections} corrections FCU retirées (rejointes par l'enquête)</li>
              <li>
                {result.discrepancyNetworks} réseaux avec un écart à trancher ({result.discrepancyFields} valeurs)
              </li>
              {result.created.length > 0 && (
                <li>
                  {result.created.length} réseaux inconnus de la base, créés sans tracé (à compléter dans{' '}
                  <Link href="/admin/reseaux" isExternal>
                    Gestion des réseaux
                  </Link>
                  ) : {result.created.map((network) => `${network.sncu}${network.name ? ` (${network.name})` : ''}`).join(', ')}
                </li>
              )}
              {result.missing.length > 0 && (
                <li>
                  {result.missing.length} réseaux de la base absents du fichier, laissés tels quels : {result.missing.join(', ')}
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </Notice>
  );
}

/** The pending survey discrepancies, decided field by field. */
function SurveyDiscrepanciesSection() {
  const utils = trpc.useUtils();
  const { data: discrepancies = [], isLoading } = trpc.fedeneSurvey.listDiscrepancies.useQuery();
  const resolveDiscrepancy = trpc.fedeneSurvey.resolveDiscrepancy.useMutation();
  const clearDiscrepancies = trpc.fedeneSurvey.clearDiscrepancies.useMutation();
  const clearDialog = useDialogState<null>();
  // one decision at a time: the buttons of the other fields wait for the list to refresh
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const valuesCount = discrepancies.reduce((count, discrepancy) => count + discrepancy.fields.length, 0);

  const resolve = toastErrors(async (requestId: string, field: SurveyDiscrepancyField, decision: SurveyDiscrepancyDecision) => {
    setPendingKey(`${requestId}:${field}:${decision}`);
    try {
      await resolveDiscrepancy.mutateAsync({ decision, field, requestId });
      await utils.fedeneSurvey.listDiscrepancies.invalidate();
    } finally {
      setPendingKey(null);
    }
  });

  const clear = async () => {
    const { count } = await clearDiscrepancies.mutateAsync();
    await utils.fedeneSurvey.listDiscrepancies.invalidate();
    notify('success', `${count} écarts supprimés`);
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading as="h2" size="h4" className="mb-0">
          Écarts avec l'enquête à trancher
          {isLoading ? '' : ` (${plural(discrepancies.length, 'réseau', 'réseaux')}, ${plural(valuesCount, 'valeur')})`}
        </Heading>
        {discrepancies.length > 0 && (
          <Button
            size="small"
            priority="tertiary"
            variant="destructive"
            iconId="fr-icon-delete-line"
            onClick={() => clearDialog.open(null)}
          >
            Vider les écarts en attente
          </Button>
        )}
      </div>
      <p className="mb-0 text-sm text-gray-600">
        Pour chaque valeur corrigée par FCU qui diffère encore de l'enquête, choisissez la valeur à garder : «{' '}
        {surveyDiscrepancyDecisionLabels.keep_fcu} » ne change rien sur le réseau, l'écart est simplement clos et ne sera pas reproposé tant
        que l'enquête donne la même valeur ; « {surveyDiscrepancyDecisionLabels.restore_fedene} » retire la correction, la valeur de
        l'enquête s'affiche aussitôt (la carte suit à la génération des tuiles). Chaque décision s'applique immédiatement. Les mots{' '}
        <mark className={differentClass}>surlignés en rouge</mark> n'existent que d'un côté, les mots{' '}
        <mark className={variantClass}>surlignés en jaune</mark> ne diffèrent que par la casse ou les accents.
      </p>
      {isLoading ? (
        <Loader />
      ) : discrepancies.length === 0 ? (
        <p className="mb-0 italic">Aucun écart à trancher.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {discrepancies.map((discrepancy) => (
            <SurveyDiscrepancyCard key={discrepancy.requestId} discrepancy={discrepancy} pendingKey={pendingKey} onResolve={resolve} />
          ))}
        </div>
      )}
      <ConfirmDialog control={clearDialog} title="Vider les écarts en attente" confirmLabel="Vider les écarts" danger onConfirm={clear}>
        <p className="mb-0">
          Les écarts en attente ({plural(discrepancies.length, 'réseau', 'réseaux')}) sont supprimés, ainsi que les décisions déjà prises
          sur leurs champs. Le prochain import de la bibliothèque FEDENE les recrée. Les écarts déjà traités restent.
        </p>
      </ConfirmDialog>
    </section>
  );
}

// `text-inherit`: the browser styles <mark> in black, unreadable on a dark contrast background
const differentClass = 'rounded-xs bg-(--background-contrast-error) px-0.5 text-inherit';
const variantClass = 'rounded-xs bg-(--background-contrast-yellow-tournesol) px-0.5 text-inherit';

type DiffValueProps = { segments: DiffSegment[] };

/** The value with its words that differ from the other side highlighted. */
function DiffValue({ segments }: DiffValueProps) {
  return (
    <span className="break-words">
      {segments.map((segment, index) =>
        segment.kind === 'different' ? (
          <mark key={index} className={differentClass}>
            {segment.text}
          </mark>
        ) : segment.kind === 'variant' ? (
          <mark key={index} className={variantClass}>
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </span>
  );
}

type SurveyDiscrepancyCardProps = {
  discrepancy: Discrepancy;
  pendingKey: string | null;
  onResolve: (requestId: string, field: SurveyDiscrepancyField, decision: SurveyDiscrepancyDecision) => void;
};

/** One network: its fields in discrepancy, each value with the decision that keeps it right below. */
function SurveyDiscrepancyCard({ discrepancy, pendingKey, onResolve }: SurveyDiscrepancyCardProps) {
  return (
    <article className="flex flex-col gap-2 rounded-sm bg-(--background-alt-grey) p-4">
      <h3 className="mb-0 flex flex-wrap items-baseline gap-2 text-base">
        {discrepancy.sncu && (
          <Link href={`/reseaux/${discrepancy.sncu}`} isExternal>
            {discrepancy.sncu}
          </Link>
        )}
        <span>{discrepancy.networkName}</span>
        {discrepancy.networkType === 'reseau_de_froid' && (
          <Badge as="span" small noIcon>
            Réseau de froid
          </Badge>
        )}
      </h3>
      {discrepancy.fields.map((fieldDiscrepancy) => {
        const diff = diffValues(fieldDiscrepancy.fcuValue ?? '', fieldDiscrepancy.fedeneValue);
        const options = [
          { decision: 'keep_fcu' as const, label: 'Correction FCU (affichée)', segments: diff.left, value: fieldDiscrepancy.fcuValue },
          { decision: 'restore_fedene' as const, label: 'Valeur FEDENE', segments: diff.right, value: fieldDiscrepancy.fedeneValue },
        ];
        return (
          <div
            key={fieldDiscrepancy.field}
            className="grid gap-3 rounded-sm bg-(--background-default-grey) p-3 md:grid-cols-[minmax(140px,180px)_1fr_1fr]"
          >
            <span className="text-sm font-semibold">{surveyDiscrepancyFieldLabels[fieldDiscrepancy.field]}</span>
            {options.map((option) => (
              <div key={option.decision} className="flex flex-col items-start gap-2">
                <span className="text-xs text-gray-600">{option.label}</span>
                {option.value ? (
                  <DiffValue segments={option.segments} />
                ) : (
                  // the correction was removed meanwhile (admin edit): the survey value is already the one displayed
                  <em>correction déjà retirée</em>
                )}
                <Button
                  size="small"
                  priority={option.decision === 'keep_fcu' ? 'secondary' : 'tertiary'}
                  iconId="fr-icon-check-line"
                  disabled={pendingKey !== null}
                  loading={pendingKey === `${discrepancy.requestId}:${fieldDiscrepancy.field}:${option.decision}`}
                  onClick={() => onResolve(discrepancy.requestId, fieldDiscrepancy.field, option.decision)}
                >
                  {surveyDiscrepancyDecisionLabels[option.decision]}
                  <span className="fr-sr-only">
                    {' '}
                    pour {surveyDiscrepancyFieldLabels[fieldDiscrepancy.field].toLowerCase()} de {discrepancy.networkName}
                  </span>
                </Button>
              </div>
            ))}
          </div>
        );
      })}
    </article>
  );
}
