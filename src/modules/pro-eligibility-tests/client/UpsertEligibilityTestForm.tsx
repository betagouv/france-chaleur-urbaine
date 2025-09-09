import React, { useCallback, useState } from 'react';

import DSFRSelect from '@/components/form/dsfr/Select';
import Upload from '@/components/form/dsfr/Upload';
import useForm from '@/components/form/react-form/useForm';
import Notice, { type NoticeProps } from '@/components/ui/Notice';
import trpc from '@/modules/trpc/client';
import { toastErrors } from '@/services/notification';
import { parseUnknownCharsetText } from '@/utils/strings';

import CSVImportTable from './CSVImportTable';
import {
  allowedExtensions,
  FormErrorMessage,
  NO_SEPARATOR_VALUE,
  zCreateEligibilityTestInput,
  zUpdateEligibilityTestInput,
} from '../constants';
import { analyzeCSV, type ColumnMapping } from '../utils/csvColumnDetection';

type UpsertEligibilityTestFormProps = {
  testId?: string;
  onComplete?: () => void;
};

const UpsertEligibilityTestForm = ({ testId, onComplete }: UpsertEligibilityTestFormProps) => {
  const isUpdate = !!testId;

  const { mutateAsync: createTest } = trpc.proEligibilityTests.create.useMutation();
  const { mutateAsync: updateTest } = trpc.proEligibilityTests.update.useMutation();
  const utils = trpc.useUtils();

  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeCSV> | null>(null);

  const { form, Form, Field, Radio, Submit, FieldWrapper, Checkbox, useValue, Select } = useForm({
    schema: isUpdate ? zUpdateEligibilityTestInput : zCreateEligibilityTestInput,
    defaultValues: {
      ...(isUpdate ? { id: testId } : { name: '' }),
      content: '',
      hasHeaders: true,
      dataType: 'address',
      separator: ',',
      columnMapping: {} as ColumnMapping,
    },
    onSubmit: toastErrors(async ({ value }) => {
      if (isUpdate) {
        await updateTest({ ...value, id: testId });
        void utils.proEligibilityTests.get.invalidate({ id: testId });
      } else {
        await createTest(value);
      }
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
            latitudeColumn: fileAnalysis.suggestedLatitudeColumn,
            longitudeColumn: fileAnalysis.suggestedLongitudeColumn,
            addressColumn: undefined,
          }
        : {
            addressColumn: fileAnalysis.suggestedAddressColumn || 0,
            latitudeColumn: undefined,
            longitudeColumn: undefined,
          };

      form.setFieldValue('columnMapping', newColumnMapping);

      const newDataType = fileAnalysis.hasCoordinateColumns ? 'coordinates' : 'address';
      form.setFieldValue('dataType', newDataType);

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
      if (!isUpdate) {
        form.setFieldValue('name', file.name);
      }
      form.setFieldValue('content', content);
      void processContent(content);
    },
    [form, isUpdate]
  );

  const hasHeaders = useValue('hasHeaders') as boolean;
  const columnMapping = useValue('columnMapping') as ColumnMapping;
  const dataType = useValue('dataType') as 'address' | 'coordinates';
  const content = useValue('content') as string;

  const getColumnLabel = (index: number): string =>
    hasHeaders && analysis?.headers[index] ? analysis?.headers[index] : String.fromCharCode(65 + index);

  const columnOptions = [
    { value: '', label: 'Aucune colonne' },
    ...(analysis?.headers || []).map((_, index) => ({
      value: index.toString(),
      label: getColumnLabel(index),
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
    <Form>
      <div className="flex flex-col gap-4">
        {isUpdate && <Field.Input name="id" nativeInputProps={{ type: 'hidden' }} label="" />}
        <FieldWrapper>
          {/* <Field.Custom
            name="file"
            Component={({ value, onChange, ...props }: any) => (

            // TODO: uncomment this when we have a way to handle files
            */}
          <Upload
            label="Choisissez un fichier .txt ou .csv (une adresse par ligne) :"
            hint="Si le fichier est un .csv, les colonnes seront découpées pour déduire l'adresse ou les coordonnées géographiques."
            nativeInputProps={{
              required: true,
              accept: allowedExtensions.join(','),
              onChange: async (e) => {
                const file = e.target.files?.[0];
                // onChange(file);
                await handleFileChange(file);
              },
            }}
          />
          {/* )}
          /> */}
        </FieldWrapper>
        {analysis && (
          <FieldWrapper>
            <div className="space-y-4">
              <hr />
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>
                  <Select
                    name="separator"
                    label="Séparateur"
                    options={[
                      { label: ',', value: ',' },
                      { label: ';', value: ';' },
                      { label: 'Tab', value: '\t' },
                      { label: '|', value: '|' },
                      { label: 'Espace', value: ' ' },
                      { label: 'Aucun', value: NO_SEPARATOR_VALUE },
                    ]}
                    fieldInputProps={{
                      listeners: {
                        onChange: ({ value }) => processContent(content as string, value as string),
                      },
                    }}
                  />
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
              <Checkbox small name="hasHeaders" label="Le fichier a des entêtes de colonnes" />
              <hr />
              <Radio
                name="dataType"
                small
                label="Quel type de données contient votre fichier ?"
                orientation="horizontal"
                options={[
                  { label: 'Adresses textuelles', nativeInputProps: { value: 'address' } },
                  { label: 'Coordonnées géographiques (latitude/longitude)', nativeInputProps: { value: 'coordinates' } },
                ]}
              />
            </div>
            <div className="flex gap-4">
              {dataType === 'address' ? (
                <div className="flex-1">
                  <DSFRSelect
                    label={
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded bg-purple-100 border border-purple-300"></span>
                        Adresse
                      </span>
                    }
                    nativeSelectProps={{
                      value: columnMapping.addressColumn?.toString() ?? '',
                      onChange: (e) => {
                        form.setFieldValue('columnMapping', {
                          addressColumn: e.target.value ? Number(e.target.value) : undefined,
                          latitudeColumn: undefined,
                          longitudeColumn: undefined,
                        });
                      },
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
                          <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300"></span>
                          Latitude
                        </span>
                      }
                      nativeSelectProps={{
                        value: columnMapping.latitudeColumn?.toString() || '',
                        onChange: (e) => {
                          form.setFieldValue('columnMapping.addressColumn', undefined);
                          form.setFieldValue('columnMapping.latitudeColumn', e.target.value ? Number(e.target.value) : undefined);
                        },
                      }}
                      options={columnOptions}
                    />
                  </div>
                  <div className="flex-1">
                    <DSFRSelect
                      label={
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
                          Longitude
                        </span>
                      }
                      nativeSelectProps={{
                        value: columnMapping.longitudeColumn?.toString() || '',
                        onChange: (e) => {
                          form.setFieldValue('columnMapping.addressColumn', undefined);
                          form.setFieldValue('columnMapping.longitudeColumn', e.target.value ? Number(e.target.value) : undefined);
                        },
                      }}
                      options={columnOptions}
                    />
                  </div>
                </>
              )}
            </div>
            <Notice variant={variant} title={description} />
          </FieldWrapper>
        )}

        {!isUpdate && (
          <FieldWrapper>
            <Field.Input
              name="name"
              label="Nom du test"
              hintText="Le nom du test sera utilisé pour identifier le test dans l'historique"
              nativeInputProps={{
                placeholder: 'Nom du test',
              }}
            />
          </FieldWrapper>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Submit disabled={!analysis}>{isUpdate ? 'Compléter le test' : 'Créer le test'}</Submit>
        </div>
      </div>
    </Form>
  );
};

export default UpsertEligibilityTestForm;
