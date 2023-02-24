import { useRef } from 'react';
import { Description } from '../RessourceContent.styles';
import { List, Source, Subtitle } from './Contents.styles';

const Fundings = () => {
  const maPrimeRenovCoproRef = useRef<null | HTMLHeadingElement>(null);
  const maPrimeRenovSereRef = useRef<null | HTMLHeadingElement>(null);
  const coupDePouceRef = useRef<null | HTMLHeadingElement>(null);
  const ecoPretIndiRef = useRef<null | HTMLHeadingElement>(null);
  const ecoPretCoproRef = useRef<null | HTMLHeadingElement>(null);
  return (
    <>
      <Description>
        <ul>
          <li
            onClick={() =>
              maPrimeRenovCoproRef.current &&
              maPrimeRenovCoproRef.current.scrollIntoView()
            }
          >
            MaPrimeRénov’Copropriétés
          </li>
          <li
            onClick={() =>
              maPrimeRenovSereRef.current &&
              maPrimeRenovSereRef.current.scrollIntoView()
            }
          >
            MaPrimeRénov’Sérénité
          </li>
          <li
            onClick={() =>
              coupDePouceRef.current && coupDePouceRef.current.scrollIntoView()
            }
          >
            Le coup de pouce "rénovation performante de bâtiment résidentiel
            collectif"
          </li>
          <li
            onClick={() =>
              ecoPretIndiRef.current && ecoPretIndiRef.current.scrollIntoView()
            }
          >
            L’Éco-prêt à taux zéro "individuel"
          </li>
          <li
            onClick={() =>
              ecoPretCoproRef.current &&
              ecoPretCoproRef.current.scrollIntoView()
            }
          >
            L’Éco-prêt à taux zéro "copropriétés"
          </li>
        </ul>
      </Description>
      <Subtitle ref={maPrimeRenovCoproRef}>MaPrimeRénov’Copropriétés</Subtitle>
      <b>
        MaPrimeRénov’Copropriétés peut être versée aux syndics des copropriétés
        pour les travaux effectués sur les parties communes, lorsque le
        raccordement s’inscrit dans des travaux de rénovation globale, avec un
        gain énergétique supérieur à 35 %,
      </b>
      <br />
      <br />
      <b>Quelles sont les conditions d’éligibilité ?</b>
      <br />
      <br />
      <List>
        <li>
          Travaux de rénovation globale, qui garantissent une amélioration
          significative du confort et de la performance énergétique de la
          copropriété (35 % minimum de gain énergétique après travaux).
        </li>
        <li>
          Copropriété composée d’au moins 75 % de lots d’habitation principale.
        </li>
        <li>Copropriété immatriculée au registre national des copropriétés.</li>
      </List>
      <br />
      <br />
      <b>Quel est le montant de l’aide ?</b>
      <br />
      <br />
      La prime couvre jusqu'à 25 % du montant global des travaux, avec une aide
      maximale de 6 250€ par logement. Elle est soumise à des conditions de
      ressources.
      <br />
      <br />
      Pour en savoir plus :{' '}
      <a
        href="https://france-renov.gouv.fr/aides/mpr/coproprietes"
        target="_blank"
        rel="noreferrer"
      >
        https://france-renov.gouv.fr/aides/mpr/coproprietes
      </a>
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={maPrimeRenovSereRef}>MaPrimeRénov’Sérénité</Subtitle>
      <b>
        MaPrimeRénov’ Sérénité permet aux ménages aux revenus modestes et très
        modestes d’obtenir des financements plus avantageux pour leur rénovation
        globale afin de les encourager à réaliser des travaux les plus ambitieux
        possibles.
      </b>
      <br />
      <br />
      MaPrimeRénov’ Sérénité concerne tous les travaux permettant de réaliser{' '}
      <b>
        un gain énergétique (en énergie primaire) d’au moins 35 % et d’atteindre
        au moins la classe E sur l’étiquette énergie du diagnostic de
        performance énergétique
      </b>{' '}
      (à partir du 1er juillet 2022).
      <br />
      <br />
      MaPrimeRénov’ Sérénité peut se cumuler avec les aides versées au titre des
      certificats d’économie d’énergie (coup de pouce chauffage).
      <br />
      <br />
      <b>Quelles sont les conditions d’éligibilité ?</b>
      <br />
      <br />
      <List>
        <li>Réservé aux ménages à revenus modestes et très modestes </li>
        <li>
          Pour des logements d’au moins 15 ans en résidence principale, qui
          seront occupés encore 3 ans, et n’ayant pas bénéficié d’un prêt à taux
          zéro pour l’accession à la propriété depuis 5 ans.
        </li>
        <li>
          Être obligatoirement accompagné d'un tiers de confiance Mon
          Accompagnateur Rénov' avant de faire la demande de prime si le coût
          des travaux de rénovation énergétique globale dépasse 5 000 € toutes
          taxes comprises (TTC)
        </li>
      </List>
      <br />
      <br />
      <b>Quel est le montant de l’aide ?</b>
      <br />
      <br />
      <List>
        <li>
          Ménages aux revenus très modestes : 50 % du montant total des travaux
          (hors taxes), avec une prime versée de 17 500 € maximum.
        </li>
        <li>
          Ménages aux revenus modestes : 35 % du montant total des travaux (hors
          taxes), avec une prime versé de 12 250 € maximum.
        </li>
      </List>
      <br />
      <br />
      Pour en savoir plus :{' '}
      <a
        href="https://france-renov.gouv.fr/aides/mpr/serenite"
        target="_blank"
        rel="noreferrer"
      >
        https://france-renov.gouv.fr/aides/mpr/serenite
      </a>
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={coupDePouceRef}>
        Le coup de pouce « rénovation performante de bâtiment résidentiel
        collectif »
      </Subtitle>
      Dans le cadre d’une{' '}
      <b>
        rénovation globale du bâtiment, avec un gain énergétique d’au moins 35%
      </b>
      , il est possible de bénéficier du{' '}
      <b>
        coup de pouce « Rénovation performante de bâtiment résidentiel
        collectif ».
      </b>
      <br />
      <br />
      <b>
        Le raccordement aux réseaux de chaleur alimentés majoritairement par des
        énergies renouvelables ou de récupération est alors obligatoire lorsque
        cette rénovation globale inclut le changement du mode de chauffage du
        bâtiment.
      </b>
      <br />
      <br />
      Seule une dérogation justifiant l'impossibilité technique ou économique du
      raccordement délivrée par le gestionnaire du réseau de chaleur permet de
      bénéficier de ce coup de pouce en installant un mode de chauffage
      alternatif.
      <br />
      <br />
      <b>Quelles sont les conditions d’éligibilité ?</b>
      <br />
      <br />
      <List>
        <li>
          Un audit énergétique doit être réalisé par une entreprise reconnue
          garant de l’environnement, avant l’engagement des travaux{' '}
        </li>
        <li>
          Les travaux doivent permettre d’obtenir un gain énergétique d’au moins
          35 % par rapport à la consommation conventionnelle annuelle en énergie
          primaire avant travaux.{' '}
        </li>
        <li>
          Les bâtiments résidentiels collectifs entrant dans ce dispositif sont
          les immeubles dont au moins 75% de la surface totale chauffée est
          utilisée ou destinée à être utilisée en tant qu’habitation.
        </li>
        <li>
          Les copropriétés qui souhaitent bénéficier de ce coup de pouce doivent
          être inscrites sur le registre d'immatriculation des copropriétés
        </li>
      </List>
      <br />
      <br />
      <b>Quel est le montant de la prime ?</b>
      <br />
      <br />
      <b>
        Le montant de la prime varie en fonction des offres des entreprises
        signataires de la charte Coup de pouce, mais doit respecter une valeur
        minimale.
      </b>
      <br />
      <br />
      Les montants minimaux sont calculés en euros par mégawatt-heure (MWh) de
      consommation conventionnelle annuelle d'énergie finale économisée du
      bâtiment rénové. Ils diffèrent selon que les travaux génèrent plus ou
      moins 50 % de chaleur renouvelable après travaux (voir{' '}
      <a
        href="https://www.service-public.fr/particuliers/vosdroits/F35779#:~:text='agit%2Dil%20%3F-,La%20prime%20Coup%20de%20pouce%20R%C3%A9novation%20performante%20de%20b%C3%A2timent%20r%C3%A9sidentiel,d'%C3%A9conomies%20d'%C3%A9nergie."
        target="_blank"
        rel="noreferrer"
      >
        le site service-public.fr
      </a>
      ).
      <br />
      <br />
      <b>
        Le bénéficiaire doit se rapprocher des signataires de la charte pour
        connaître et comparer le montant des primes proposées.
      </b>
      <br />
      <br />
      <a
        href="https://www.ecologie.gouv.fr/sites/default/files/CdP%20R%C3%A9no%20Batiment%20residentiel%20collectif%20-%20Les%20offres%20Coup%20de%20pouce.pdf"
        target="_blank"
        rel="noreferrer"
      >
        Accéder à la liste des signataires de la charte
      </a>
      <br />
      <br />
      <b>Exemple :</b>
      <br />
      Pour la rénovation d'un bâtiment collectif composé de 30 logements sur une
      surface totale de 2100 m², le syndicat de copropriétaires fait isoler la
      toiture terrasse et les façades, remplacer les menuiseries, changer le
      système de ventilation, installer des robinets thermostatiques et
      remplacer les chaudières fioul par un raccordement à un réseau de chaleur
      efficace. Avant les travaux, la copropriété consomme 400 kWh/m² an en
      énergie finale. Après les travaux, la copropriété consomme 220 kWh/m² an
      en énergie finale. Pour un coût total de travaux de 510 000 €, une
      copropriété peut toucher une prime de 189 000 €, soit 6 300 € d'aide par
      logement.
      <br />
      <br />
      <b> Quel cumul possible avec d’autres aides ?</b>
      <br />
      <br />
      Ce coup de pouce est cumulable avec les dispositifs MaPrimeRénov’ et
      l'Éco-prêt à taux zéro. En revanche, il n’est pas possible de cumuler deux
      coups de pouce (CEE).
      <br />
      <br />
      Pour en savoir plus :{' '}
      <a
        href="https://www.ecologie.gouv.fr/coup-pouce-renovation-performante-batiment-residentiel-collectif"
        target="_blank"
        rel="noreferrer"
      >
        https://www.ecologie.gouv.fr/coup-pouce-renovation-performante-batiment-residentiel-collectif
      </a>
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={ecoPretIndiRef}>
        L’Éco-prêt à taux zéro « individuel »
      </Subtitle>
      L'Éco-prêt à taux-zéro « individuel » (éco-PTZ) permet de financer des
      travaux d’amélioration de la performance énergétique, dont le raccordement
      au réseau de chaleur. Il est versé par certaines banques. C'est un{' '}
      <b>
        prêt sans intérêts d'un montant maximal de 50 000 €, attribué sans
        condition de ressources.
      </b>
      <br />
      <br />
      <b>Quelles sont les conditions d’éligibilité ?</b>
      <br />
      <br />
      <List>
        <li>
          Logement en résidence principal (ou destiné à l’être) construit depuis
          plus de 2 ans (propriétaire occupant ou bailleur)
        </li>
        <li>
          Effectuer des travaux de rénovation énergétique globaux ou ponctuels
          (action efficace d’amélioration de la performance énergétique, travaux
          ayant ouvert droit à l’aide MaPrimeRénov’ Sérénité ou à
          MaPrimeRénov’...)
        </li>
        <li>
          Les travaux doivent impérativement être réalisés par une entreprise
          Reconnue garant de l'environnement (RGE).
        </li>
      </List>
      <br />
      <br />
      <b>Quelles banques proposent ce prêt ?</b>
      <br />
      <br />
      Seules les banques ayant signé une convention avec l’État peuvent proposer
      l'éco-PTZ. Vous pouvez{' '}
      <a
        href="https://www2.sgfgas.fr/web/site-public/etablissements-affilies"
        target="_blank"
        rel="noreferrer"
      >
        consulter la liste des banques actuellement concernées par ce dispositif
      </a>
      . Vous devez vous renseigner auprès de l'un de ces établissements.
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={ecoPretCoproRef}>
        L’Éco-prêt à taux zéro « copropriétés »
      </Subtitle>
      L’éco-prêt à taux zéro « copropriétés » (« éco-PTZ copropriétés ») est un
      <b>
        prêt collectif octroyé au syndicat des copropriétaires, pour le compte
        des copropriétaires qui souhaitent y participer.
      </b>{' '}
      Comme l’éco-prêt à taux zéro « individuel », il{' '}
      <b>
        permet de financer les travaux d’économie d’énergie des bâtiments de la
        copropriété et les éventuels frais induits par ces travaux.
      </b>
      <br />
      <br />
      <b>Quelles sont les conditions d’éligibilité ?</b>
      <br />
      <br />
      <List>
        <li>
          Au moins 75% des quotes-part de la copropriété sont compris dans des
          lots affectés à l’usage d’habitation, utilisés ou destinés à être
          utilisés en tant que résidence principale.{' '}
        </li>
        <li>
          Seuls les copropriétaires de logements utilisés ou destinés à être
          utilisés en tant que résidence principale peuvent participer à
          l’éco-PTZ copropriétés.{' '}
        </li>
        <li>
          Les logements appartenant aux copropriétaires souscrivant au prêt ne
          doivent pas avoir déjà fait l’objet d’un éco-PTZ individuel.{' '}
        </li>
        <li>Bâtiments achevés depuis au moins 2 ans. </li>
        <li>
          Les travaux doivent impérativement être réalisés par une entreprise
          Reconnue garant de l'environnement (RGE).
        </li>
      </List>
      <br />
      <br />
      <b>Quels types de travaux sont éligibles ?</b>
      <br />
      <br />
      Pour bénéficier de l’éco-PTZ copropriétés, le syndicat des copropriétaires
      doit :
      <br />
      <br />
      <List>
        <li>
          Soit réaliser au moins une action d’amélioration de la performance
          énergétique ;
        </li>
        <li>
          Soit atteindre un niveau de « performance énergétique globale »
          minimal du ou des bâtiments de la copropriété ;
        </li>
        <li>
          Soit réhabiliter un système d’assainissement non collectif par un
          dispositif ne consommant pas d’énergie.
        </li>
      </List>
      <br />
      <br />
      <b>Quelles banques distribuent l'éco-PTZ copropriétés ?</b>
      <br />
      <br />
      Domofinance et la Caisse d’Epargne Île-de-France sont à ce jour les seuls
      signataires de la convention spécifique et sont donc à ce jour les seules
      banques pouvant distribuer l’Éco-PTZ copropriétés.
      <br />
      <br />
      En savoir plus :{' '}
      <a
        href="https://www.ecologie.gouv.fr/eco-pret-taux-zero-eco-ptz"
        target="_blank"
        rel="noreferrer"
      >
        https://www.ecologie.gouv.fr/eco-pret-taux-zero-eco-ptz
      </a>
      <br />
      <br />
      <br />
      <br />
      <b>
        Pour aller plus loin, contactez l’
        <a
          href="https://france-renov.gouv.fr/espaces-conseil-fr"
          target="_blank"
          rel="noreferrer"
        >
          espace France Rénov, le plus proche de chez vous
        </a>{' '}
        !
      </b>
      <br />
      <br />
      <Source>
        Voir aussi le récapitulatif des aides 2023 :{' '}
        <a
          href="https://france-renov.gouv.fr/sites/default/files/2023-01/Guide-des-aides-financieres-2023.pdf"
          target="_blank"
          rel="noreferrer"
        >
          https://france-renov.gouv.fr/sites/default/files/2023-01/Guide-des-aides-financieres-2023.pdf
        </a>
      </Source>
    </>
  );
};

export default Fundings;
