'use client';

import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';

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

export default function FranceRenovHelp({ codeInsee }: { codeInsee?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<FranceRenovLine | null>(null);
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
        const res = await fetch(
          `https://data.ademe.fr/data-fair/api/v1/datasets/perimetre-espaces-conseil-france-renov/lines?q=${encodeURIComponent(
            codeInsee
          )}&q_fields=Code_Insee_Commune`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const line = (json?.result ?? null) as FranceRenovLine | null;

        setData(line);
      } catch (e: any) {
        setData(null);
        setErrorMsg('Impossible de charger les infos France Rénov’ pour cette commune.');
      } finally {
        setIsLoading(false);
      }
    };

    // doFetch();
  }, [codeInsee]);

  const { nom, rue, ville } = useMemo(() => getAdresse(data), [data]);

  const telephone = data?.Telephone_Structure?.trim() || '';
  const email = data?.Email_Structure?.trim() || '';

  const site = useMemo(() => {
    const raw = data?.Site_Internet_Structure?.trim();
    if (!raw) return '';
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }, [data]);

  const horaires = useMemo(() => {
    const raw = data?.Horaires_Structure;
    if (!raw) return [] as string[];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string' && x.trim() !== '') : [];
    } catch {
      return [];
    }
  }, [data]);

  return (
    <>
      <h3>👉 Contactez gratuitement un conseiller France Rénov&apos; pour faire le point</h3>
      <CallOut title="Rencontrez votre conseiller France Rénov’" size="lg" colorVariant="yellow-moutarde">
        <p>
          Les conseillers France Rénov vous aident gratuitement à élaborer votre projet de rénovation, trouver des aides financières et
          choisir les professionnels compétents.
        </p>
        <Button iconId="fr-icon-arrow-right-line" iconPosition="right" onClick={() => setIsOpen((prev) => !prev)} aria-expanded={isOpen}>
          {isOpen ? 'Masquer les coordonnées' : 'Prendre rdv avec un conseiller'}
        </Button>
        {isOpen && (
          <>
            <h4 className="text-lg fr-mt-3w">😕 Nous n'avons pas trouvé d'espace Conseil France Rénov' pour votre territoire.</h4>
            <p>
              👉️ Appelez un téléconseiller France Rénov' pour vous accompagner dans votre démarche :<br />
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
                      📞 {telephone}
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} title="Contacter par courriel">
                      ✉️ {email}
                    </a>
                  )}
                  {site && (
                    <a rel="noopener noreferrer" href={site} target="_blank" title={`${site} - nouvelle fenêtre`}>
                      🌐 {site}
                    </a>
                  )}
                </div>

                {horaires.length > 0 && (
                  <div className="text-sm">
                    <div className="mb-1 font-medium">🕑 Horaires</div>
                    <ul className="list-inside list-disc space-y-1 text-gray-700">
                      {horaires.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!data && <p className="text-sm text-gray-600">Aucune structure trouvée pour cette commune.</p>}
              </>
            )}
          </>
        )}
      </CallOut>
    </>
  );
}

function getAdresse(obj: FranceRenovLine | null): { nom: string; rue: string; ville: string } {
  if (!obj) return { nom: 'Adresse inconnue', rue: '', ville: '' };

  try {
    const nom = obj.Nom_Structure?.trim() || 'Adresse inconnue';
    const rue = obj.Adresse_Structure?.trim() || '';
    const ville = `${obj.Code_Postal_Structure?.trim() || ''} ${obj.Commune_Structure?.trim() || ''}`.trim();
    return { nom, rue, ville };
  } catch {
    return { nom: 'Adresse inconnue', rue: '', ville: '' };
  }
}
