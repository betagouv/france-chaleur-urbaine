import Link from '@/components/ui/Link';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import type { FranceRenovSpace } from '@/modules/chaleur-renouvelable/constants';
import trpc from '@/modules/trpc/client';

/**
 * Renders the France Rénov' advisor callout for non heat-network recommendations.
 */
export function FranceRenovAdvisorCallout() {
  const chauffageQuery = useChoixChauffageQueryParams();
  const params = chauffageQuery.params;
  const hasLocationInput = Boolean(params.constructionId || params.adresse);
  const franceRenovSpaceQuery = trpc.batEnr.getFranceRenovSpace.useQuery(
    {
      address: params.adresse,
      batimentConstructionId: params.constructionId,
    },
    {
      enabled: hasLocationInput,
      retry: false,
    }
  );

  return (
    <aside
      id="help-ademe"
      className="mt-6 scroll-mt-4 rounded-sm bg-[#FFF7D7] p-6 text-(--text-title-grey)"
      aria-label="Accompagnement France Rénov’"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h4 className="mb-4 text-2xl font-bold">Vous souhaitez aller plus loin ?</h4>
          {hasLocationInput && franceRenovSpaceQuery.isLoading ? (
            <p>Recherche du conseiller France Rénov’ de votre commune…</p>
          ) : (
            <FranceRenovAdvisorDetails franceRenovSpace={franceRenovSpaceQuery.data ?? null} />
          )}
        </div>
        <img className="w-40 shrink-0 self-start md:self-center" src="/img/france-renov-logo.svg" alt="France Rénov’" />
      </div>
    </aside>
  );
}

type FranceRenovAdvisorDetailsProps = {
  franceRenovSpace: FranceRenovSpace | null;
};

function FranceRenovAdvisorDetails({ franceRenovSpace }: FranceRenovAdvisorDetailsProps) {
  if (!franceRenovSpace) {
    return (
      <>
        <p className="mb-5">
          Un conseiller France Rénov’ vous accompagne <strong>gratuitement et en toute neutralité</strong>.
        </p>
        <Link
          href="https://france-renov.gouv.fr/preparer-projet/trouver-conseiller"
          variant="primary"
          className="fr-btn--lg fr-btn--icon-right fr-icon-external-link-line"
          isExternal
          postHogEventKey="fcr_results:france_renov_cta_clicked"
        >
          Trouver un conseiller France Rénov’
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="mb-4 text-lg">
        Votre espace France Rénov’ : <strong>{franceRenovSpace.name}</strong>
      </p>
      <address className="mb-5 not-italic">
        {franceRenovSpace.address && (
          <div className="flex gap-3 py-2">
            <span className="fr-icon-map-pin-2-fill mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {franceRenovSpace.address}, {franceRenovSpace.zipcode} {franceRenovSpace.city}
            </span>
          </div>
        )}
        {franceRenovSpace.phone && (
          <div className="flex gap-3 py-2">
            <span className="fr-icon-phone-fill mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <a href={`tel:${franceRenovSpace.phone}`}>{formatPhoneNumber(franceRenovSpace.phone)}</a>
              {franceRenovSpace.secondaryPhone && (
                <>
                  <br />
                  <a href={`tel:${franceRenovSpace.secondaryPhone}`}>{formatPhoneNumber(franceRenovSpace.secondaryPhone)}</a>
                </>
              )}
            </span>
          </div>
        )}
        {franceRenovSpace.email && (
          <div className="flex gap-3 py-2">
            <span className="fr-icon-mail-fill mt-0.5 shrink-0" aria-hidden="true" />
            <a href={`mailto:${franceRenovSpace.email}`}>{franceRenovSpace.email}</a>
          </div>
        )}
      </address>
      <Link
        href={franceRenovSpace.website ? getExternalUrl(franceRenovSpace.website) : `mailto:${franceRenovSpace.email}`}
        variant="primary"
        className="fr-btn--lg fr-btn--icon-right fr-icon-external-link-line"
        isExternal={Boolean(franceRenovSpace.website)}
        postHogEventKey="fcr_results:france_renov_cta_clicked"
      >
        Contacter mon conseiller France Rénov’
      </Link>
    </>
  );
}

function formatPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');

  return digits.length === 10 ? digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim() : phone;
}

function getExternalUrl(url: string) {
  return url.startsWith('http') ? url : `https://${url}`;
}
