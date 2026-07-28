import { fr } from '@codegouvfr/react-dsfr';
import type React from 'react';
import { useCallback, useId } from 'react';

import FieldWrapper from '@/components/form/dsfr/FieldWrapper';
import { highlightMatch } from '@/modules/form/AddressSearch';
import { Autocomplete } from '@/modules/form/Autocomplete';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import cx from '@/utils/cx';

export type ContributionNetworkSearchResult = RouterOutput['reseaux']['searchForContribution'][number];

type ContributionNetworkSncuFieldProps = {
  label: React.ReactNode;
  selectedNetwork: ContributionNetworkSearchResult | null;
  onNetworkSelect: (network: ContributionNetworkSearchResult) => void;
  onNetworkClear: () => void;
  value?: string;
  onChange?: (value: string) => void;
  hintText?: React.ReactNode;
  state?: 'error' | 'default';
  stateRelatedMessage?: string;
  className?: string;
  nativeInputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;
};

/**
 * SNCU identifier autocomplete for the public contribution form.
 * The stored form value is updated only after selecting a suggestion, so free
 * text never satisfies validation by itself.
 */
export function ContributionNetworkSncuField({
  label,
  selectedNetwork,
  onNetworkSelect,
  onNetworkClear,
  value,
  onChange,
  hintText,
  state = 'default',
  stateRelatedMessage,
  className,
  nativeInputProps,
}: ContributionNetworkSncuFieldProps) {
  const id = useId();
  const utils = trpc.useUtils();
  const isRequired = nativeInputProps?.required === true;
  const isDisabled = nativeInputProps?.disabled === true;

  const fetchFn = useCallback(
    async (query: string) => {
      return await utils.reseaux.searchForContribution.fetch({ search: query });
    },
    [utils]
  );

  const handleSelect = useCallback(
    (network: ContributionNetworkSearchResult) => {
      onChange?.(network.identifiant_reseau);
      onNetworkSelect(network);
    },
    [onChange, onNetworkSelect]
  );

  const handleClear = useCallback(() => {
    onChange?.('');
    onNetworkClear();
  }, [onChange, onNetworkClear]);

  const decoratedLabel = (
    <>
      {label}
      {!isRequired && <small> (Optionnel)</small>}
    </>
  );

  return (
    <FieldWrapper
      fieldId={id}
      label={decoratedLabel}
      hintText={hintText}
      disabled={isDisabled}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      className={className}
    >
      {selectedNetwork ? (
        <button
          type="button"
          className={fr.cx('fr-tag', 'fr-tag--sm', 'fr-tag--dismiss', 'fr-mt-2w')}
          title="Supprimer la sélection du réseau"
          onClick={handleClear}
        >
          {formatSelectedNetwork(selectedNetwork)}
        </button>
      ) : (
        <Autocomplete<ContributionNetworkSearchResult>
          id={id}
          fetchFn={fetchFn}
          getOptionValue={(network) => network.identifiant_reseau}
          getOptionLabel={(network, query) => (
            <div className="flex flex-col">
              <span className="font-medium">{highlightMatch(network.identifiant_reseau, query)}</span>
              <span className="text-xs text-gray-500">{formatNetworkDetails(network)}</span>
            </div>
          )}
          value={value ?? ''}
          onSelect={handleSelect}
          onClear={handleClear}
          minCharThreshold={2}
          emptyMessage="Aucun identifiant SNCU trouvé"
          nativeInputProps={{
            className: cx(
              fr.cx('fr-input', {
                'fr-input--error': state === 'error',
              })
            ),
            disabled: isDisabled,
            placeholder: 'Ex. 7501C',
            required: isRequired,
            ...nativeInputProps,
          }}
        />
      )}
    </FieldWrapper>
  );
}

const formatSelectedNetwork = (network: ContributionNetworkSearchResult): string =>
  [network.identifiant_reseau, network.nom_reseau].filter(isNonEmptyString).join(' - ');

const formatNetworkDetails = (network: ContributionNetworkSearchResult): string =>
  [network.nom_reseau, network.localisation].filter(isNonEmptyString).join(' · ');

const isNonEmptyString = (value: string | null | undefined): value is string => Boolean(value);
