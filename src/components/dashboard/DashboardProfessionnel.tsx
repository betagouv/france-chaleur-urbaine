import Tile from '@codegouvfr/react-dsfr/Tile';

export default function DashboardProfessionnel() {
  return (
    <>
      <div className="grid gap-8 grid-cols-2 items-center justify-between mb-5">
        <Tile
          title="Comparateur de prix et d'émissions de CO2"
          desc="Comparez les performances des modes de chauffage et de refroidissement (réseaux de chaleur et de froid, gaz, fioul, biomasse, PAC...) en termes de coûts et émissions de CO2."
          linkProps={{
            href: '/pro/comparateur-couts-performances',
          }}
          orientation="horizontal"
          enlargeLinkOrButton
        />
        <Tile
          title="Test d'adresses en masse"
          desc="Repérez sur un parc de bâtiments ceux potentiellement raccordables, et accédez aux caractéristiques des réseaux les plus proches."
          linkProps={{
            href: '/pro/tests-adresses',
          }}
          orientation="horizontal"
          enlargeLinkOrButton
        />
      </div>
    </>
  );
}
