import Tile from '@codegouvfr/react-dsfr/Tile';

export default function DashboardProfessionnel() {
  return (
    <>
      <div className="grid gap-8 grid-cols-2 items-center justify-between mb-5">
        {process.env.NEXT_PUBLIC_FLAG_ENABLE_TEST_ADRESSES === 'true' && (
          <Tile
            title="Tests d'adresses"
            desc="Testez l'éligibilité d'adresses pour le raccordement à un réseau de chaleur"
            linkProps={{
              href: '/pro/tests-adresses',
            }}
            orientation="horizontal"
            enlargeLinkOrButton
          />
        )}
        {process.env.NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR === 'true' && (
          <Tile
            title="Comparateur de performances"
            desc="Comparez les performances énergétiques et environnementales des différents modes de chauffage et de refroidissement"
            linkProps={{
              href: '/pro/comparateur-couts-performances',
            }}
            orientation="horizontal"
            enlargeLinkOrButton
          />
        )}
      </div>
    </>
  );
}
