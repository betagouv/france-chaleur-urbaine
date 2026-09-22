import { FooterConsentManagementItem } from '@/components/ConsentBanner';

/**
 * Opens the DSFR cookie consent modal from a page body (privacy policy).
 * Wraps the footer list item provided by react-dsfr, which is the only public opener.
 */
export function CookieConsentButton() {
  return (
    <ul className="fr-footer__bottom-list">
      <FooterConsentManagementItem />
    </ul>
  );
}
