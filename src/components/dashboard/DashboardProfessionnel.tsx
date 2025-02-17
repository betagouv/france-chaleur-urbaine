import Tile from '@codegouvfr/react-dsfr/Tile';

export default function DashboardProfessionnel() {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-4">
          <Tile
            title="Tests d'adresses"
            desc="Testez l'éligibilité d'adresses pour le raccordement à un réseau de chaleur"
            linkProps={{
              href: '/tests-adresses',
            }}
            orientation="horizontal"
            enlargeLinkOrButton
          />
          <Tile
            title="Comparateur de performances"
            desc="Comparez les performances énergétiques et environnementales des différents modes de chauffage et de refroidissement"
            linkProps={{
              href: '/comparateur-performances',
            }}
            orientation="horizontal"
            enlargeLinkOrButton
          />
        </div>
      </div>
    </>
  );
}
