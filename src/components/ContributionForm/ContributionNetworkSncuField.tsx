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
  const inputId = useId();
  const trpcUtils = trpc.useUtils();
  const isRequired = nativeInputProps?.required === true;
  const isDisabled = nativeInputProps?.disabled === true;

  const fetchFn = useCallback(
    (query: string) => trpcUtils.reseaux.searchForContribution.fetch({ search: query }),
    [trpcUtils.reseaux.searchForContribution]
  );

  const getOptionValue = useCallback((network: ContributionNetworkSearchResult) => network.identifiant_reseau, []);

  const getOptionLabel = useCallback(
    (network: ContributionNetworkSearchResult, query: string) => (
      <span>
        {highlightMatch(network.identifiant_reseau, query)}
        {formatNetworkDetails(network)}
      </span>
    ),
    []
  );

  const handleNetworkSelect = useCallback(
    (network: ContributionNetworkSearchResult) => {
      onChange?.(network.identifiant_reseau);
      onNetworkSelect(network);
    },
    [onChange, onNetworkSelect]
  );

  const handleNetworkClear = useCallback(() => {
    onChange?.('');
    onNetworkClear();
  }, [onChange, onNetworkClear]);

  return (
    <FieldWrapper
      className={className}
      fieldId={inputId}
      label={
        isRequired ? (
          label
        ) : (
          <>
            {label} <span className="font-normal">(Optionnel)</span>
          </>
        )
      }
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      disabled={isDisabled}
    >
      {selectedNetwork ? (
        <button
          type="button"
          className={fr.cx('fr-tag', 'fr-tag--sm', 'fr-tag--dismiss', 'fr-mt-2w')}
          title="Supprimer la sélection du réseau"
          onClick={handleNetworkClear}
        >
          {formatSelectedNetwork(selectedNetwork)}
        </button>
      ) : (
        <Autocomplete<ContributionNetworkSearchResult>
          id={inputId}
          fetchFn={fetchFn}
          getOptionValue={getOptionValue}
          getOptionLabel={getOptionLabel}
          value={value ?? ''}
          onSelect={handleNetworkSelect}
          onClear={handleNetworkClear}
          minCharThreshold={2}
          emptyMessage="Aucun identifiant SNCU trouvé"
          nativeInputProps={{
            ...nativeInputProps,
            className: cx(fr.cx('fr-input', { 'fr-input--error': state === 'error' }), nativeInputProps?.className),
            disabled: isDisabled,
            placeholder: 'Ex. 7501C',
            required: isRequired,
          }}
        />
      )}
    </FieldWrapper>
  );
}

const formatSelectedNetwork = (network: ContributionNetworkSearchResult) =>
  [network.identifiant_reseau, network.nom_reseau].filter(isNonEmptyString).join(' - ');

const formatNetworkDetails = (network: ContributionNetworkSearchResult) =>
  isNonEmptyString(network.nom_reseau) ? <span className="text-(--text-mention-grey)"> - {network.nom_reseau}</span> : null;

const isNonEmptyString = (value: string | null | undefined): value is string => typeof value === 'string' && value.length > 0;
