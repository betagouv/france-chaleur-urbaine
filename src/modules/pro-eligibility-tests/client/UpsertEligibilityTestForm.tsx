import { useStore } from '@tanstack/react-form';
import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';

import DSFRSelect from '@/components/form/dsfr/Select';
import Upload from '@/components/form/dsfr/Upload';
import Notice, { type NoticeProps } from '@/components/ui/Notice';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import { parseUnknownCharsetText } from '@/utils/strings';

import {
  allowedExtensions,
  FormErrorMessage,
  NO_SEPARATOR_VALUE,
  zCreateEligibilityTestInput,
  zUpdateEligibilityTestInput,
} from '../constants';
import { analyzeCSV, type ColumnMapping } from '../utils/csvColumnDetection';
import CSVImportTable from './CSVImportTable';

// create + update inputs merged; the runtime values stay mode-consistent (name only when
// creating, id only when updating) so each mode's strict schema validates its own shape
type UpsertEligibilityTestFormValues = Omit<z.input<typeof zCreateEligibilityTestInput>, 'name'> & {
  name?: string;
  id?: string;
};

const separatorOptions = [
  { label: ',', value: ',' },
  { label: ';', value: ';' },
  { label: 'Tab', value: '\t' },
  { label: '|', value: '|' },
  { label: 'Espace', value: ' ' },
  { label: 'Aucun', value: NO_SEPARATOR_VALUE },
];

const dataTypeOptions = [
  { label: 'Adresses textuelles', nativeInputProps: { value: 'address' } },
  { label: 'Coordonnées géographiques (latitude/longitude)', nativeInputProps: { value: 'coordinates' } },
];

type UpsertEligibilityTestFormProps = {
  testId?: string;
  onComplete?: () => void;
};

/**
 * CSV upload form to create or complete a pro eligibility test: analyzes the file,
 * lets the user adjust separator/headers/column mapping, then submits the content.
 */
const UpsertEligibilityTestForm = ({ testId, onComplete }: UpsertEligibilityTestFormProps) => {
  const isUpdate = !!testId;

  const { mutateAsync: createTest } = trpc.proEligibilityTests.create.useMutation();
  const { mutateAsync: updateTest } = trpc.proEligibilityTests.update.useMutation();
  const utils = trpc.useUtils();

  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeCSV> | null>(null);

  const defaultValues: UpsertEligibilityTestFormValues = {
    ...(isUpdate ? { id: testId } : { name: '' }),
    columnMapping: undefined,
    content: '',
    dataType: 'address',
    hasHeaders: true,
    separator: ',',
  };

  // both mode schemas validate the mode-consistent runtime values; unify their type for TanStack
  const schema = (isUpdate ? zUpdateEligibilityTestInput : zCreateEligibilityTestInput) as unknown as z.ZodType<
    UpsertEligibilityTestFormValues,
    UpsertEligibilityTestFormValues
  >;

  const form = useAppForm({
    ...schemaValidation(schema),
    defaultValues,
    onSubmit: toastErrors(async ({ value }) => {
      let bulkTest = null;
      if (isUpdate) {
        bulkTest = await updateTest({ ...value, id: testId });
        void utils.proEligibilityTests.get.invalidate({ id: testId });
      } else {
        bulkTest = await createTest({ ...value, name: value.name ?? '' });
      }

      trackPostHogEvent('bulk_test:processing_started', {
        bulk_test_id: bulkTest.id,
        rows_count: analysis?.nbRows,
      });
      void utils.proEligibilityTests.list.invalidate();
      onComplete?.();
    }, FormErrorMessage),
  });

  const processContent = useCallback(
    toastErrors((content: string, separator?: string) => {
      const fileAnalysis = analyzeCSV(content, separator);

      if (!separator) {
        form.setFieldValue('separator', fileAnalysis.separator);
      }

      const newColumnMapping = fileAnalysis.hasCoordinateColumns
        ? {
            addressColumn: undefined,
            latitudeColumn: fileAnalysis.suggestedLatitudeColumn,
            longitudeColumn: fileAnalysis.suggestedLongitudeColumn,
          }
        : {
            addressColumn: fileAnalysis.suggestedAddressColumn || 0,
            latitudeColumn: undefined,
            longitudeColumn: undefined,
          };

      form.setFieldValue('columnMapping', newColumnMapping);

      const newDataType = fileAnalysis.hasCoordinateColumns ? 'coordinates' : 'address';
      form.setFieldValue('dataType', newDataType);

      trackPostHogEvent('bulk_test:file_uploaded', {
        file_size_kb: new TextEncoder().encode(content).length / 1024,
        rows_count: fileAnalysis.nbRows,
      });
      setAnalysis(fileAnalysis);
    }),
    []
  );

  const handleFileChange = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        setAnalysis(null);
        form.reset();
        return;
      }
      const content = await parseUnknownCharsetText(await file.arrayBuffer());
      // initialize the test name with the file name if it's not already set
      if (!isUpdate && form.getFieldValue('name') === '') {
        form.setFieldValue('name', file.name);
      }
      form.setFieldValue('content', content);

      void processContent(content);
    },
    [form, isUpdate]
  );

  const hasHeaders = useStore(form.store, (state) => state.values.hasHeaders);
  const columnMapping: ColumnMapping = useStore(form.store, (state) => state.values.columnMapping) ?? {};
  const dataType = useStore(form.store, (state) => state.values.dataType);
  const content = useStore(form.store, (state) => state.values.content);
  const canHaveHeaders = (analysis?.nbRows ?? 0) > 1;

  // évite que l'utilisateur choisisse un fichier d'une ligne + entête de colonne
  useEffect(() => {
    if (!canHaveHeaders && hasHeaders) {
      form.setFieldValue('hasHeaders', false);
    }
  }, [canHaveHeaders, hasHeaders, form]);

  const getColumnLabel = (index: number): string =>
    hasHeaders && analysis?.headers[index] ? analysis?.headers[index] : String.fromCharCode(65 + index);

  const columnOptions = [
    { label: 'Aucune colonne', value: '' },
    ...(analysis?.headers || []).map((_, index) => ({
      label: getColumnLabel(index),
      value: index.toString(),
    })),
  ];

  const hasAddress = columnMapping.addressColumn !== undefined;
  const hasCoordinates = columnMapping.latitudeColumn !== undefined && columnMapping.longitudeColumn !== undefined;
  const isConfigurationValid = (dataType === 'address' && hasAddress) || (dataType === 'coordinates' && hasCoordinates);

  const getNoticeProps = (): { description: string; variant: NoticeProps['variant'] } => {
    if (isConfigurationValid) {
      return {
        description: hasAddress
          ? `✓ Utilisation des adresses : colonne ${getColumnLabel(columnMapping.addressColumn!)}`
          : `✓ Utilisation des coordonnées : ${getColumnLabel(columnMapping.latitudeColumn!)} / ${getColumnLabel(columnMapping.longitudeColumn!)}`,
        variant: 'info',
      };
    }

    if (dataType === 'address') {
      return { description: 'Sélectionnez la colonne contenant les adresses', variant: 'warning' };
    }

    const { latitudeColumn, longitudeColumn } = columnMapping;
    if (latitudeColumn !== undefined && longitudeColumn === undefined) {
      return { description: 'Sélectionnez également la colonne longitude', variant: 'warning' };
    }
    if (longitudeColumn !== undefined && latitudeColumn === undefined) {
      return { description: 'Sélectionnez également la colonne latitude', variant: 'warning' };
    }
    return { description: 'Sélectionnez les colonnes latitude et longitude', variant: 'warning' };
  };

  const { description, variant } = getNoticeProps();

  return (
    <Form form={form}>
      <div className="flex flex-col gap-4">
        <Upload
          label="Choisissez un fichier .txt ou .csv (une adresse par ligne) :"
          hint="Si le fichier est un .csv, les colonnes seront découpées pour déduire l'adresse ou les coordonnées géographiques."
          nativeInputProps={{
            accept: allowedExtensions.join(','),
            onChange: async (e) => {
              const file = e.target.files?.[0];
              await handleFileChange(file);
            },
            required: true,
          }}
        />
        {analysis && (
          <div>
            <div className="space-y-4">
              <hr />
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>
                  <form.AppField
                    name="separator"
                    listeners={{
                      onChange: ({ value }) => processContent(content, value ?? undefined),
                    }}
                  >
                    {(field) => <field.SelectField label="Séparateur" options={separatorOptions} />}
                  </form.AppField>
                </span>
                <div>
                  <label className="fr-label">Colonnes</label>
                  <div className="font-bold text-lg mt-2">{analysis.columns.length}</div>
                </div>
                <div>
                  <label className="fr-label whitespace-nowrap">Lignes affichées</label>
                  <div className="font-bold text-lg mt-2">
                    <strong>{analysis.rows.length}</strong> / <strong>{analysis.nbRows}</strong>
                  </div>
                </div>
              </div>
              <CSVImportTable analysis={analysis} hasHeaders={hasHeaders} mapping={columnMapping} dataType={dataType} />
              {canHaveHeaders && (
                <form.AppField name="hasHeaders">
                  {(field) => <field.CheckboxField label="Le fichier a des entêtes de colonnes" />}
                </form.AppField>
              )}
              <hr />
              <form.AppField name="dataType">
                {(field) => (
                  <field.RadioField
                    small
                    label="Quel type de données contient votre fichier ?"
                    orientation="horizontal"
                    options={dataTypeOptions}
                  />
                )}
              </form.AppField>
            </div>
            <div className="flex gap-4">
              {dataType === 'address' ? (
                <div className="flex-1">
                  <DSFRSelect
                    label={
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm bg-purple-100 border border-purple-300" />
                        Adresse
                      </span>
                    }
                    nativeSelectProps={{
                      onChange: (e) => {
                        form.setFieldValue('columnMapping', {
                          addressColumn: e.target.value ? Number(e.target.value) : undefined,
                          latitudeColumn: undefined,
                          longitudeColumn: undefined,
                        });
                      },
                      value: columnMapping.addressColumn?.toString() ?? '',
                    }}
                    options={columnOptions}
                  />
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <DSFRSelect
                      label={
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
                          Latitude
                        </span>
                      }
                      nativeSelectProps={{
                        onChange: (e) => {
                          form.setFieldValue('columnMapping.addressColumn', undefined);
                          form.setFieldValue('columnMapping.latitudeColumn', e.target.value ? Number(e.target.value) : undefined);
                        },
                        value: columnMapping.latitudeColumn?.toString() || '',
                      }}
                      options={columnOptions}
                    />
                  </div>
                  <div className="flex-1">
                    <DSFRSelect
                      label={
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
                          Longitude
                        </span>
                      }
                      nativeSelectProps={{
                        onChange: (e) => {
                          form.setFieldValue('columnMapping.addressColumn', undefined);
                          form.setFieldValue('columnMapping.longitudeColumn', e.target.value ? Number(e.target.value) : undefined);
                        },
                        value: columnMapping.longitudeColumn?.toString() || '',
                      }}
                      options={columnOptions}
                    />
                  </div>
                </>
              )}
            </div>
            <Notice variant={variant} title={description} />
          </div>
        )}

        {!isUpdate && (
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label="Nom du test"
                hintText="Le nom du test sera utilisé pour identifier le test dans l'historique"
                nativeInputProps={{
                  placeholder: 'Nom du test',
                }}
              />
            )}
          </form.AppField>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <form.SubmitButton disabled={!analysis}>{isUpdate ? 'Compléter le test' : 'Créer le test'}</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
};

export default UpsertEligibilityTestForm;
