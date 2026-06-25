'use client';

import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { fetchJSON } from '@/utils/network';

type FranceRenovLine = {
  Nom_Structure?: string;
  Adresse_Structure?: string;
  Code_Postal_Structure?: string;
  Commune_Structure?: string;
  Telephone_Structure?: string;
  Email_Structure?: string;
  Site_Internet_Structure?: string;
  Horaires_Structure?: string;
};

// Affiche les coordonnées de l'Espace Conseil FranceRénov' le plus proche
// Ne s'affiche que quand aucun mode de chauffage n'est possible
export default function FranceRenovHelp({ codeInsee }: { codeInsee?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coordonneesECFR, setCoordonneesECFR] = useState<FranceRenovLine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Il nous faut une clé d'API pour utiliser ce endpoint
  // Pour l'instant, on affiche donc juste le n° de la hotline
  useEffect(() => {
    if (!codeInsee) return;

    const doFetch = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const line = await fetchJSON(
          `https://data.ademe.fr/data-fair/api/v1/datasets/perimetre-espaces-conseil-france-renov/lines?q=${encodeURIComponent(
            codeInsee
          )}&q_fields=Code_Insee_Commune`
        );

        setCoordonneesECFR(line.result as FranceRenovLine | null);
      } catch {
        setCoordonneesECFR(null);
        setErrorMsg('Impossible de charger les infos France Rénov’ pour cette commune.');
      } finally {
        setIsLoading(false);
      }
    };

    // doFetch();
  }, [codeInsee]);

  const { nom, rue, ville } = useMemo(() => getAdresse(coordonneesECFR), [coordonneesECFR]);

  const telephone = coordonneesECFR?.Telephone_Structure?.trim() || '';
  const email = coordonneesECFR?.Email_Structure?.trim() || '';

  const site = useMemo(() => {
    const raw = coordonneesECFR?.Site_Internet_Structure?.trim();
    if (!raw) return '';
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }, [coordonneesECFR]);

  const horaires = useMemo(() => {
    const raw = coordonneesECFR?.Horaires_Structure;
    if (!raw) return [] as string[];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((horaire) => typeof horaire === 'string' && horaire.trim() !== '') : [];
    } catch {
      return [];
    }
  }, [coordonneesECFR]);

  return (
    <section className="mt-8 border-l-4 border-[#d6a100] bg-[#feeccf] px-6 py-6 text-(--text-title-grey)">
      <h3 className="mb-4 flex items-start gap-2 text-xl font-bold">
        <span className="fr-icon-customer-service-line mt-0.5 text-danger" aria-hidden="true" />
        Contactez gratuitement un conseiller France Rénov’ pour faire le point
      </h3>
      <p className="mb-4 max-w-4xl">
        Les conseillers France Rénov vous aident gratuitement à élaborer votre projet de rénovation, trouver des aides financières et
        choisir les professionnels compétents.
      </p>
      <Button
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
        onClick={() => {
          trackPostHogEvent('fcr_results:france_renov_cta_clicked');
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
      >
        {isOpen ? 'Masquer les coordonnées' : 'Prendre rdv avec un conseiller'}
      </Button>
      {isOpen && (
        <div className="mt-5">
          <h4 className="mb-2 text-lg font-bold">Nous n’avons pas trouvé d’espace Conseil France Rénov’ pour votre territoire.</h4>
          <p>
            Appelez un téléconseiller France Rénov’ pour vous accompagner dans votre démarche :<br />
            <span className="underline">0 808 800 700</span> Service gratuit + prix appel
          </p>
          <p className="fr-mt-3w">Du lundi au vendredi de 9h à 18h (heure métropolitaine).</p>
          {isLoading && <p>Chargement…</p>}
          {false && !isLoading && errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          {false && !isLoading && !errorMsg && (
            <>
              <div>
                <div>{nom}</div>
                {rue && <div>{rue}</div>}
                {ville && <div>{ville}</div>}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {telephone && (
                  <a href={`tel:${telephone}`} title="Contacter par téléphone">
                    <span className="fr-icon-phone-line mr-1" aria-hidden="true" />
                    {telephone}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} title="Contacter par courriel">
                    <span className="fr-icon-mail-line mr-1" aria-hidden="true" />
                    {email}
                  </a>
                )}
                {site && (
                  <a rel="noopener noreferrer" href={site} target="_blank" title={`${site} - nouvelle fenêtre`}>
                    <span className="fr-icon-global-line mr-1" aria-hidden="true" />
                    {site}
                  </a>
                )}
              </div>

              {horaires.length > 0 && (
                <div className="text-sm">
                  <div className="mb-1 font-medium">
                    <span className="fr-icon-time-line mr-1" aria-hidden="true" />
                    Horaires
                  </div>
                  <ul className="list-inside list-disc space-y-1 text-gray-700">
                    {horaires.map((horaire) => (
                      <li key={horaire}>{horaire}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!coordonneesECFR && <p className="text-sm text-gray-600">Aucune structure trouvée pour cette commune.</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function getAdresse(obj: FranceRenovLine | null): { nom: string; rue: string; ville: string } {
  if (!obj) return { nom: 'Adresse inconnue', rue: '', ville: '' };

  const nom = obj.Nom_Structure?.trim() || 'Adresse inconnue';
  const rue = obj.Adresse_Structure?.trim() || '';
  const ville = `${obj.Code_Postal_Structure?.trim() || ''} ${obj.Commune_Structure?.trim() || ''}`.trim();
  return { nom, rue, ville };
}
