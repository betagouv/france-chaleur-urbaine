import { Button, Checkbox, TextInput } from '@dataesr/react-dsfr';
import React, { useCallback, useEffect, useState } from 'react';
import { useServices } from 'src/services';
import type { RowsParams } from 'src/services/demandsService';
import {
  demandEditableRowsParams,
  demandRowsParams,
} from 'src/services/demandsService';
import { Demand } from 'src/types/Summary/Demand';

const renderEditable = (
  type: string,
  key: keyof Demand,
  label: string,
  demand: Demand
) => {
  switch (type) {
    case 'checkbox':
      return (
        <Checkbox
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: to fix in react-dsfr
          name={key}
          id={key}
          label={label}
          defaultChecked={demand?.[key] as boolean}
        />
      );
    case 'textarea':
      return (
        <TextInput
          textarea
          label={label}
          name={key}
          id={key}
          defaultValue={demand?.[key] as string}
        />
      );
    default:
      return `${label} : ${demand?.[key] ?? 'Valeur inconnu'}`;
  }
};

function DemandDetails({ demandId }: { demandId: string }) {
  const { demandsService } = useServices();
  const [demand, setDemand] = useState<Demand | null>(null);

  const handleSubmit = useCallback(
    (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();

      const editableParams = (evt.target as Record<string, any>).elements;
      const demandUpdate = demandEditableRowsParams.reduce(
        (acc, { name, editable }) => {
          return editable
            ? {
                ...acc,
                [name]:
                  editableParams?.[name][
                    ['checkbox', 'radio'].includes(editable)
                      ? 'checked'
                      : 'value'
                  ],
              }
            : acc;
        },
        {}
      );

      const demandId = demand?.id;
      if (!demandId) return;
      demandsService
        .updateDemand(demandId, demandUpdate)
        .then(({ data: record }) => setDemand(record as Demand));
    },
    [demand, demandsService]
  );

  useEffect(() => {
    demandsService.fetchDemand(demandId).then((record) => {
      setDemand(record);
    });
  }, [demandId, demandsService]);

  return (
    <div>
      <h2>Detail de la demande ref. {demandId}</h2>
      {!demand ? (
        'Chargement'
      ) : (
        <form onSubmit={handleSubmit}>
          <ul>
            {demandRowsParams.map(({ name, label, render }: RowsParams) => (
              <li key={name}>
                {label}&nbsp;:{' '}
                {demand && render
                  ? render(demand)
                  : demand?.[name as keyof Demand]}
              </li>
            ))}
          </ul>
          <hr />
          <ul>
            {demandEditableRowsParams.map(
              ({ name, label, editable, render }: RowsParams) => (
                <li key={name}>
                  {demand && render ? (
                    <>
                      {label}&nbsp;:{''}
                      {render(demand)}
                    </>
                  ) : demand && editable ? (
                    renderEditable(
                      editable,
                      name as keyof Demand,
                      label,
                      demand as Demand
                    )
                  ) : (
                    demand?.[name as keyof Demand]
                  )}
                </li>
              )
            )}
          </ul>
          <Button submit>Envoyer</Button>
        </form>
      )}
    </div>
  );
}

export default DemandDetails;
