import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { reseauDeChaleurClasseColor, reseauDeChaleurNonClasseColor, reseauDeChaleurNonOuvertColor } from './reseauxDeChaleur';

/**
 * Réseaux de chaleur — top-level Reseaux tab row.
 * Flat layout : single checkbox + three colored "line" swatches
 * (classés / non classés / non ouverts), with hint sub-text. Filters
 * (taux EnR&R, CO2, …) live in a separate filters panel — not inline here.
 */
export function ReseauxDeChaleurLegend() {
  return (
    <LegendCheckbox
      path="reseauxDeChaleur.show"
      trackingEvent="Carto|Réseaux chaleur"
      label={
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <LineSwatch color={reseauDeChaleurClasseColor} />
            <span>Réseaux de chaleur classés</span>
          </div>
          <div className="flex items-start gap-2">
            <LineSwatch color={reseauDeChaleurNonClasseColor} />
            <div>
              <div>Réseaux de chaleur non classés</div>
              <div className="text-xs">(tracé ou cercle au centre de la commune si tracé non disponible)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LineSwatch color={reseauDeChaleurNonOuvertColor} />
            <span className="text-xs">Non ouverts aux raccordements</span>
          </div>
        </div>
      }
      tooltip={
        <>
          Pour les réseaux classés, le raccordement des bâtiments neufs ou renouvelant leur installation de chauffage au-dessus d'une
          certaine puissance est obligatoire dès lors qu'ils sont situés dans le périmètre de développement prioritaire (sauf dérogation).
          <br />
          Les réseaux affichés comme classés sont ceux listés par arrêté du 22 décembre 2023. Collectivités : pour signaler un
          dé-classement, cliquez sur Contribuer.
        </>
      }
    />
  );
}

/** Small 24×8 rounded line swatch. */
function LineSwatch({ color }: { color: string }) {
  return <span aria-hidden className="mt-1.5 inline-block h-2 min-w-6 shrink-0 rounded-sm" style={{ backgroundColor: color }} />;
}
