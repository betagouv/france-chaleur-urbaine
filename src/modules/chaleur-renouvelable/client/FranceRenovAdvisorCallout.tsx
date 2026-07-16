import { useState } from 'react';

import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import type { FranceRenovSpace } from '@/modules/chaleur-renouvelable/constants';
import trpc from '@/modules/trpc/client';

/**
 * Renders the France Rénov' advisor callout for non heat-network recommendations.
 */
export function FranceRenovAdvisorCallout({ variant = 'callout' }: { variant?: 'callout' | 'inline' }) {
  const [isOpen, setIsOpen] = useState(false);
  const chauffageQuery = useChoixChauffageQueryParams();
  const params = chauffageQuery.params;
  const hasLocationInput = Boolean(params.constructionId || params.adresse);
  const franceRenovSpaceQuery = trpc.batEnr.getFranceRenovSpace.useQuery(
    {
      address: params.adresse,
      batimentConstructionId: params.constructionId,
    },
    {
      enabled: isOpen && hasLocationInput,
      retry: false,
    }
  );

  const content = (
    <FranceRenovAdvisorContent
      franceRenovSpace={franceRenovSpaceQuery.data ?? null}
      isLoading={hasLocationInput && franceRenovSpaceQuery.isLoading}
      isOpen={isOpen}
      variant={variant}
      onToggle={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
    />
  );

  if (variant === 'inline') {
    return <div className="mt-4">{content}</div>;
  }

  return (
    <aside
      id="help-ademe"
      className="mt-6 scroll-mt-4 rounded-sm bg-[#FFF7D7] p-6 text-(--text-title-grey)"
      aria-label="Accompagnement France Rénov’"
    >
      {content}
    </aside>
  );
}

type FranceRenovAdvisorContentProps = {
  franceRenovSpace: FranceRenovSpace | null;
  isLoading: boolean;
  isOpen: boolean;
  variant: string;
  onToggle: () => void;
};

function FranceRenovAdvisorContent({ franceRenovSpace, isLoading, isOpen, variant, onToggle }: FranceRenovAdvisorContentProps) {
  return (
    <div>
      {variant !== 'inline' && (
        <>
          <h4 className="text-xl font-bold md:text-2xl">Échangez avec un conseiller neutre et gratuit du service public</h4>
          <p className="mb-4">
            Un conseiller du service public vous aidera à identifier la meilleure alternative parmi les solutions compatibles ci-dessus.
          </p>
        </>
      )}
      <Button
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="mb-0"
        postHogEventKey="fcr_results:france_renov_coordinates_toggled"
        postHogEventProps={{ is_open: !isOpen }}
      >
        {isOpen ? 'Masquer les coordonnées' : 'Afficher les coordonnées'}
      </Button>

      {isOpen && (
        <div className="mt-6">
          {isLoading ? (
            <p>Recherche du conseiller France Rénov’ de votre commune…</p>
          ) : (
            <FranceRenovAdvisorDetails franceRenovSpace={franceRenovSpace} />
          )}
        </div>
      )}
    </div>
  );
}

function FranceRenovAdvisorDetails({ franceRenovSpace }: { franceRenovSpace: FranceRenovSpace | null }) {
  if (!franceRenovSpace) {
    return (
      <>
        <p className="mb-5 max-w-4xl">
          Les conseillers France Rénov’ sont des experts de la rénovation. Ils vous apportent des informations sur les travaux et les aides
          les plus adaptées à votre logement et à vos besoins.
        </p>
        <Link
          href="https://france-renov.gouv.fr/preparer-projet/trouver-conseiller"
          variant="primary"
          className="fr-btn--icon-right fr-icon-arrow-right-line"
          isExternal
          postHogEventKey="fcr_results:france_renov_cta_clicked"
        >
          Prendre rendez-vous avec un conseiller
        </Link>
      </>
    );
  }

  const advisorUrl = franceRenovSpace.website
    ? getExternalUrl(franceRenovSpace.website)
    : franceRenovSpace.email
      ? `mailto:${franceRenovSpace.email}`
      : 'https://france-renov.gouv.fr/preparer-projet/trouver-conseiller';

  return (
    <>
      <p className="mb-5">
        Les conseillers France Rénov’ sont des experts de la rénovation. Ils vous apportent des informations sur les travaux et les aides
        les plus adaptées à votre logement et à vos besoins.
      </p>

      <p className="mb-3 font-bold">{franceRenovSpace.name}</p>

      {franceRenovSpace.address && (
        <address className="mb-5 not-italic">
          {franceRenovSpace.address} - {franceRenovSpace.zipcode} {franceRenovSpace.city}
        </address>
      )}

      {(franceRenovSpace.phone || franceRenovSpace.secondaryPhone || franceRenovSpace.email || franceRenovSpace.website) && (
        <>
          <p className="mb-2 font-bold">Coordonnées</p>
          <ul className="mb-5 list-disc pl-5">
            {franceRenovSpace.phone && (
              <li>
                <a href={`tel:${franceRenovSpace.phone}`}>{formatPhoneNumber(franceRenovSpace.phone)}</a>
              </li>
            )}
            {franceRenovSpace.secondaryPhone && (
              <li>
                <a href={`tel:${franceRenovSpace.secondaryPhone}`}>{formatPhoneNumber(franceRenovSpace.secondaryPhone)}</a>
              </li>
            )}
            {franceRenovSpace.email && (
              <li>
                <a href={`mailto:${franceRenovSpace.email}`}>{franceRenovSpace.email}</a>
              </li>
            )}
            {franceRenovSpace.website && (
              <li>
                <a href={getExternalUrl(franceRenovSpace.website)} target="_blank" rel="noopener noreferrer">
                  {franceRenovSpace.website}
                </a>
              </li>
            )}
          </ul>
        </>
      )}

      <Link
        href={advisorUrl}
        variant="secondary"
        className="fr-btn--icon-right fr-icon-arrow-right-line"
        isExternal={Boolean(franceRenovSpace.website) || !franceRenovSpace.email}
        postHogEventKey="fcr_results:france_renov_cta_clicked"
      >
        Prendre rendez-vous avec un conseiller
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
