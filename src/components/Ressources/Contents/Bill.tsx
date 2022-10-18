import { List, Source, Subtitle } from './Contents.styles';

const Bill = () => {
  return (
    <>
      Dans le cas d’un raccordement à un réseau de chaleur,{' '}
      <b>
        la facture est adressée par le gestionnaire du réseau au syndic de
        copropriété, qualifié « d’abonné ». Le syndic a la charge de refacturer
        les coûts aux copropriétaires (« usagers ») conformément au règlement de
        copropriété
      </b>
      , comme pour un chauffage collectif classique. Pour rappel, la loi impose
      que chaque usager ait une facture calculée sur la base de sa propre
      consommation, sauf cas de dérogation (lorsque cela est techniquement
      impossible en particulier).
      <br />
      <br />
      <Subtitle>
        Comment se décompose la facture reçue par le syndic de copropriété ?
      </Subtitle>
      La facture se décompose en :
      <List>
        <li>
          Une <b>part variable (R1)</b>, qui s’obtient en multipliant le prix de
          la chaleur par la <b>consommation de l’abonné</b>. Le prix de la
          chaleur est fonction du prix des combustibles utilisés et du rendement
          énergétique du réseau.
        </li>
        <li>
          Une <b>part fixe (R2)</b>, qui correspond à l’<b>abonnement</b>. Elle
          dépend de la puissance souscrite et couvre les charges d’exploitation
          relatives à la maintenance et au renouvellement des installations,
          ainsi que les investissements réalisés pour les travaux.
        </li>
      </List>
      Le{' '}
      <b>
        poids respectif des parts R1 et R2 varie selon les réseaux, notamment en
        fonction du type d’énergie majoritaire
      </b>
      . Par exemple, pour un réseau alimenté par de la géothermie, le plus gros
      de la dépense résidera dans le forage et donc dans le R2.
      <br />
      <br />
      <b>
        Pour les réseaux de chaleur alimentés à plus de 50 % par des énergies
        renouvelables et de récupération, un taux de TVA réduit à 5.5 %
        s’applique sur l’ensemble de la facture
      </b>
      . Ce taux réduit s’applique uniquement sur la part fixe R2 (abonnement)
      pour les autres réseaux.
      <br />
      <br />À noter qu’en plus de ce que l’exploitant facture à l’abonné,{' '}
      <b>
        un coût est à prévoir pour l’entretien et l’exploitation du réseau
        secondaire
      </b>
      , c’est-à-dire celui qui passe au sein de l’immeuble.
      <br />
      <br />
      <br />
      <Subtitle>La stabilité des prix est-elle assurée ?</Subtitle>
      <b>
        Les réseaux de chaleur offrent une solution de chauffage à prix plus
        stables que ceux du gaz, du fioul ou de l’électricité
      </b>
      . Plus le poids de l’abonnement est important, plus la stabilité sera
      grande. Celle-ci dépendra également du type d’énergie utilisée : un réseau
      majoritairement alimenté par la géothermie ou par la récupération de la
      chaleur issue de l’incinération de nos déchets aura ainsi un prix plus
      stable que celui d’un réseau encore majoritairement fossile.
      <Source>
        Pour en savoir plus :{' '}
        <a
          href="https://reseaux-chaleur.cerema.fr/espace-documentaire/prix-la-chaleur-et-facturation"
          target="_blank"
          rel="noreferrer"
        >
          https://reseaux-chaleur.cerema.fr/espace-documentaire/prix-la-chaleur-et-facturation
        </a>
      </Source>
    </>
  );
};

export default Bill;
