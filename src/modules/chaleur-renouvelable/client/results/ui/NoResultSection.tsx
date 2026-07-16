import Link from '@/components/ui/Link';
import { FranceRenovAdvisorCallout } from '@/modules/chaleur-renouvelable/client/FranceRenovAdvisorCallout';

export function NoResultSection() {
  const renovationActions = [
    {
      description: 'toiture, murs, fenêtres, planchers, c’est souvent le geste le plus efficace',
      title: 'Isoler votre logement',
    },
    {
      description: 'une VMC performante améliore la qualité de l’air et limite les pertes de chaleur',
      title: 'Améliorer votre système de ventilation',
    },
    {
      description: 'entretien de la chaudière, désembouage des radiateurs, installation de robinets thermostatiques',
      title: 'Optimiser votre chauffage actuel',
    },
    {
      description: 'mousseurs, pommeaux économes, calorifugeage des tuyaux',
      title: 'Réduire vos consommations d’eau chaude',
    },
  ];

  return (
    <>
      <section className="mt-6 border border-[#e5e5e5] border-l-4 border-l-[#c74700] bg-white px-6 py-5 text-(--text-title-grey)">
        <h3 className="mb-4 flex items-start gap-2 text-xl font-bold">
          <span className="fr-icon-information-line mt-0.5 text-error" aria-hidden="true" />
          Aucune solution de chauffage alternatif n’est adaptée à votre situation
        </h3>
        <p className="mb-4 max-w-5xl">
          Pas d’inquiétude, d’autres actions permettent de réduire vos consommations d’énergie, vos factures et votre impact environnemental
          :
        </p>
        <ul className="mb-4 space-y-2 pl-0">
          {renovationActions.map((action) => (
            <li key={action.title} className="flex items-start gap-2">
              <span className="mt-1.5 h-3 w-3 shrink-0 rounded-xs border border-blue" aria-hidden="true" />
              <span>
                <strong>{action.title}</strong> : {action.description}
              </span>
            </li>
          ))}
        </ul>
        <p className="mb-3">Ces travaux peuvent être éligibles à des aides financières (MaPrimeRénov’, CEE, éco-prêt à taux zéro).</p>
        <p className="mb-0 font-bold">
          <span className="fr-icon-search-line mr-1 text-sm" aria-hidden="true" />
          Pour encore plus d’actions possibles,&nbsp;
          <Link
            href="https://agirpourlatransition.ademe.fr/particuliers/"
            isExternal
            className="font-normal underline underline-offset-4"
            postHogEventKey="fcr_results:agir_link_clicked"
          >
            rendez-vous sur Agir
          </Link>
        </p>
      </section>
      <FranceRenovAdvisorCallout />
    </>
  );
}
