import Button from '@/components/ui/Button';

/**
 * Opens the DSFR cookie consent modal from a page body (privacy policy).
 * The modal is created by react-dsfr's consent management with a fixed id; DSFR's JS handles the opening.
 */
export function CookieConsentButton() {
  return (
    <Button
      className="mb-6"
      priority="secondary"
      size="small"
      nativeButtonProps={{ 'aria-controls': 'fr-consent-modal', 'data-fr-opened': false }}
    >
      Gérer mes cookies
    </Button>
  );
}
