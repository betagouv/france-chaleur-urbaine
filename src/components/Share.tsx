import Button from '@codegouvfr/react-dsfr/Button';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { copyToClipboard } from '@/components/ui/ButtonCopy';
import Link from '@/components/ui/Link';
import useIsMobile from '@/hooks/useIsMobile';

export default function Share() {
  const isMobile = useIsMobile();

  const searchParams = useSearchParams();

  const [copied, setCopied] = useState(false);
  const searchParamsString = searchParams?.toString();
  const url = `${window.location.origin}${window.location.pathname}?${searchParamsString}`;
  useEffect(() => {
    setCopied(false);
  }, [searchParams]);

  const share = async () => {
    try {
      await navigator.share({
        text: 'Ma simulation France Chaleur Urbaine',
        title: 'Simulation France Chaleur Urbaine',
        url,
      });
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

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
            isMobile && (await navigator.share()) ? share() : copyToClipboard(url);
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
          href={`mailto:?subject=${encodeURIComponent('[FCU] Lien de ma simulation')}&body=${encodeURIComponent(
            `Bonjour,

Voici le lien vers votre simulation pour votre projet de rénovation énergétique :

${window.location.href}

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
