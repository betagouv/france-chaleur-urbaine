import Button from '@codegouvfr/react-dsfr/Button';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { copyToClipboard } from '@/components/ui/ButtonCopy';
import Link from '@/components/ui/Link';

export default function Share() {
  const searchParams = useSearchParams();

  const [copied, setCopied] = useState(false);
  const searchParamsString = searchParams?.toString();
  const url = `${window.location.origin}${window.location.pathname}?${searchParamsString}`;
  useEffect(() => {
    setCopied(false);
  }, [searchParams]);

  return (
    <>
      <h3>Partager le lien de votre simulation</h3>
      <p>Conservez les résultats de votre simulation en la partageant par mail ou en copiant le lien.</p>
      <form>
        <Button
          priority="secondary"
          title="Cliquez pour partager le lien"
          className="w-full justify-center fr-mb-3w"
          onClick={async (e) => {
            e.preventDefault();
            copyToClipboard(url);
            setCopied(true);
          }}
        >
          {!copied ? (
            <>
              <span className="fr-icon-links-fill fr-mr-1w" aria-hidden="true" /> Copier le lien de ma simulation
            </>
          ) : (
            <>
              <span className="fr-icon-check-line fr-mr-1w" aria-hidden="true" /> Lien copié
            </>
          )}
        </Button>
        <Link
          variant="secondary"
          className="w-full justify-center"
          title="Envoyez le lien par email"
          href={`mailto:?subject=${encodeURIComponent('[France Chaleur Urbaine] Lien de ma simulation')}&body=${encodeURIComponent(
            `Bonjour,

Voici les résultats de ma simulation faite sur France Chaleur Urbaine pour mon projet de rénovation énergétique :

${window.location.href}

Simulation réalisée sur france-chaleur-urbaine.beta.gouv.fr

Cordialement,
L'équipe France Chaleur Urbaine`
          )}`}
        >
          <span className="fr-icon-mail-fill fr-mr-1w" aria-hidden="true" /> Envoyez le lien par email
        </Link>
      </form>
    </>
  );
}
