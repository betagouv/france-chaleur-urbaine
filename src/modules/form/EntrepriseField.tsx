import { fr } from '@codegouvfr/react-dsfr';
import type React from 'react';
import { useCallback, useId } from 'react';

import { clientConfig } from '@/client-config';
import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import type { Entreprise } from '@/modules/users/constants';
import cx from '@/utils/cx';

import { Autocomplete } from './Autocomplete';

const MIN_QUERY_LENGTH = 3;

type RechercheEntreprisesResponse = {
  results: Array<{
    nom_complet: string;
    matching_etablissements: Array<{ siret: string; adresse: string }>;
  }>;
};

const fetchEntreprises = async (query: string, signal: AbortSignal): Promise<Entreprise[]> => {
  const url = new URL('/search', clientConfig.rechercheEntreprisesApiUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('per_page', '10');

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Recherche entreprises indisponible (${res.status})`);

  const data: RechercheEntreprisesResponse = await res.json();
  return data.results.flatMap((r) =>
    r.matching_etablissements.map((e) => ({
      adresse: e.adresse,
      nom_complet: r.nom_complet,
      siret: e.siret,
    }))
  );
};

const formatLabel = (e: Entreprise) => `${e.nom_complet} — ${e.adresse}`;

type FieldProps = {
  fieldId?: string;
  label?: React.ReactNode;
  hintText?: React.ReactNode;
  state?: 'success' | 'error' | 'default' | 'info';
  stateRelatedMessage?: React.ReactNode;
  className?: string;
};

type EntrepriseFieldProps = FieldProps & {
  /** L'entreprise actuellement sélectionnée. */
  value?: Entreprise | null;
  /** Notifié à la sélection ou à l'effacement. Optionnel pour s'aligner sur `Field.Custom` qui l'injecte au runtime. */
  onChange?: (entreprise: Entreprise | null) => void;
  nativeInputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

/**
 * Autocomplete d'entreprise/établissement branché sur l'API publique recherche-entreprises.
 * Recherche libre (nom, SIRET, adresse, etc.) ; un résultat = un établissement.
 *
 * Stocke un objet `Entreprise` complet dans le state du formulaire. Le backend re-valide
 * via le SIRET avant stockage (on ne fait pas confiance au frontend).
 */
export function EntrepriseField({
  value,
  onChange,
  fieldId,
  label,
  hintText,
  state,
  stateRelatedMessage,
  className,
  nativeInputProps,
}: EntrepriseFieldProps) {
  const generatedId = useId();
  const id = fieldId ?? generatedId;
  const fetchFn = useCallback((query: string, signal: AbortSignal) => fetchEntreprises(query, signal), []);

  const decoratedLabel = label ? (
    <>
      {label}
      {!nativeInputProps?.required && <small> (Optionnel)</small>}
    </>
  ) : (
    label
  );

  return (
    <FieldWrapper
      fieldId={id}
      label={decoratedLabel}
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      className={className}
    >
      <Autocomplete<Entreprise>
        id={id}
        fetchFn={fetchFn}
        getOptionValue={formatLabel}
        getOptionLabel={(e) => (
          <div>
            <div className="font-bold">{e.nom_complet}</div>
            <div className="text-xs text-gray-600">{e.adresse}</div>
            <div className="text-xs text-gray-500">SIRET&nbsp;: {e.siret}</div>
          </div>
        )}
        value={value ? formatLabel(value) : ''}
        onSelect={(e) => onChange?.(e)}
        onClear={() => onChange?.(null)}
        minCharThreshold={MIN_QUERY_LENGTH}
        nativeInputProps={{
          className: cx(
            fr.cx('fr-input', {
              'fr-input--error': state === 'error',
              'fr-input--valid': state === 'success',
            })
          ),
          placeholder: 'Nom ou SIRET',
          ...nativeInputProps,
        }}
      />
    </FieldWrapper>
  );
}
