import AsyncButton from '@/components/ui/AsyncButton';

type CcrtDemandValidationProps = { demandId: string; full?: boolean; onValidate: (demandId: string) => Promise<void> };

/**
 * Keeps publication controls identical in desktop rows and mobile cards.
 */
export function CcrtDemandValidation({ demandId, full, onValidate }: CcrtDemandValidationProps) {
  return (
    <AsyncButton
      priority="primary"
      size="large"
      full={full}
      iconId="fr-icon-check-line"
      iconPosition="right"
      title="Valider la demande et la rendre visible aux CCRT autorisés"
      onClick={() => onValidate(demandId)}
    >
      Valider
    </AsyncButton>
  );
}
