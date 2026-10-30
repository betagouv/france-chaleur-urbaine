import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';

import { FUNNEL_LEGEND, type FunnelColumn, type FunnelLegendItem } from './simulation-funnel';

const COLUMN_TITLES: Record<FunnelColumn, string> = {
  entry: '1. Page d’arrivée',
  outcome: '3. Issue',
  situation: '2. Contact proposé',
};
const COLUMNS: FunnelColumn[] = ['entry', 'situation', 'outcome'];

/**
 * Self-documentation of the simulations flow: every possible value of each column with its meaning, how to read the
 * chart and what the colors mean. Opened from a button next to the page title.
 */
export function SimulationsFunnelHelpDialog() {
  return (
    <Dialog
      title="Lire le flux des simulations"
      size="lg"
      trigger={
        <Button priority="tertiary" size="small" iconId="fr-icon-question-line" iconPosition="left">
          Comprendre les étapes
        </Button>
      }
    >
      <div className="flex flex-col gap-6 text-sm">
        <p className="mb-0">
          Une simulation est une adresse testée sur la page de résultats, suivie jusqu’à son issue : changer de bâtiment, ou d’adresse sans
          bâtiment connu, ouvre une nouvelle simulation reliée à la précédente, modifier les autres paramètres met à jour la même simulation
          et c’est son état courant qui compte. Le diagramme la fait passer par trois colonnes ; l’épaisseur d’un lien est le nombre de
          simulations, le pourcentage inscrit dessus est sa part de la case de départ (masqué sur les liens trop fins), le survol donne les
          deux.
        </p>
        {COLUMNS.map((column) => (
          <section key={column}>
            <h3 className="mb-2 text-base font-bold">{COLUMN_TITLES[column]}</h3>
            <dl className="mb-0 flex flex-col gap-2">
              {FUNNEL_LEGEND[column].map((item) => (
                <LegendRow key={item.label} item={item} />
              ))}
            </dl>
          </section>
        ))}
        <section>
          <h3 className="mb-2 text-base font-bold">Couleurs</h3>
          <p className="mb-0">
            Seules les issues ont une couleur propre, fixe d’un affichage à l’autre. Les pages d’arrivée et les contacts proposés sont
            structurelles, en bleu. Chaque lien prend la couleur de la case où il arrive : on lit un flux par sa destination. Toutes les
            cases sont libellées avec leur volume, la couleur n’est jamais la seule information.
          </p>
        </section>
      </div>
    </Dialog>
  );
}

type LegendRowProps = { item: FunnelLegendItem };

function LegendRow({ item }: LegendRowProps) {
  return (
    <div className="flex items-start gap-3">
      {/* color swatch: the only genuinely dynamic style of the page */}
      <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-xs" style={{ backgroundColor: item.color }} aria-hidden="true" />
      <div>
        <dt className="font-bold">{item.label}</dt>
        <dd className="mb-0 ml-0 text-(--text-mention-grey)">{item.description}</dd>
      </div>
    </div>
  );
}
