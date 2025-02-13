import { fr } from '@codegouvfr/react-dsfr';
import Badge from '@codegouvfr/react-dsfr/Badge';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import React from 'react';

import Accordion from '@/components/ui/Accordion';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import Modal, { createModal } from '@/components/ui/Modal';
import cx from '@/utils/cx';

import { Results, ResultsPlaceholder, Section, Simulator } from './ComparateurPublicodes.style';

type ComparateurPublicodesPlaceholderProps = React.HTMLAttributes<HTMLDivElement> & {};

export type TabId = 'batiment' | 'modes';

export const dataYearDisclaimer = `Les données utilisées par le comparateur portent sur l'année 2023, sauf pour les prix des réseaux de chaleur où l'année de référence est 2022, dans l'attente de la publication des données 2023. Les valeurs de l'ensemble des paramètres utilisés pour les calculs sont modifiables dans le mode avancé.`;
export const ComparateurPublicodesTitle = () => {
  return (
    <div>
      <DescriptionModal />
      <Heading as="h2">
        Comparateur de coûts et d’émissions de CO2 <Badge severity="warning">Beta</Badge>
      </Heading>
      <Logos size="sm" withFCU={false} />
      <div className="fr-text--sm fr-mt-2w">
        Cet outil a pour objectif de comparer des configurations de chauffage et de refroidissement sur les plans techniques, économiques et
        environnementaux.{' '}
        <strong>Il ne remplace en aucun cas une étude de faisabilité technico-économique menée par un bureau d’études</strong> et ne peut
        s'adapter aux situations particulières avec les hypothèses préconfigurées. Ces hypothèses représentent des configurations types,
        elles sont donc sujets à des incertitudes importantes.{' '}
        <a href="#" onClick={() => modalDescription.open()} className="fr-link fr-text--sm">
          Voir l’explication détaillée
        </a>
        <p className="fr-text--sm fr-my-1w">{dataYearDisclaimer}</p>
        <p className="fr-text--sm font-bold">
          Pour une étude plus poussée (prix actualisés, prise en compte des spécificités de votre bâtiment), nous vous invitons à vous
          rapprocher du gestionnaire du réseau de chaleur le plus proche de chez vous ou d'un bureau d'études.
        </p>
      </div>
    </div>
  );
};

export const Logos = ({ size, withFCU = true, ...props }: React.ComponentProps<typeof Box> & { size?: 'sm'; withFCU?: boolean }) => {
  const height = size === 'sm' ? '32px' : '40px';
  return (
    <Box display="flex" gap={size === 'sm' ? '16px' : '32px'} flexDirection="row" alignItems="center" flexWrap="wrap" my="2w" {...props}>
      <img src="/logo-HEAT_COOL.png" alt="logo life Heat & Cool" height={height} className="reset-height fr-mr-2w" />
      <img src="/logo-amorce.svg" alt="logo amorce" height={height} className="reset-height" />
      <img src="/logo-elcimai.png" alt="logo elcimaï" height={height} className="reset-height fr-mr-2w" />
      {withFCU && <img src="/logo-fcu-with-typo-tight.webp" alt="logo france chaleur urbaine" height={height} className="reset-height" />}
    </Box>
  );
};
const modalDescription = createModal({
  id: 'tool-description-modal',
  isOpenedByDefault: false,
});

export const simulatorTabs = [
  {
    tabId: 'batiment',
    label: '1. Paramètres du bâtiment',
  },
  {
    tabId: 'modes-de-chauffage',
    label: '2. Modes de chauffage et de refroidissement à comparer',
  },
  {
    tabId: 'parametres-modes-de-chauffage',
    label: '3. Paramètres des modes de chauffage et de refroidissement',
  },
] as const;

export const ResultsNotAvailable = () => (
  <ResultsPlaceholder>
    <img src="/img/simulateur_placeholder.svg" alt="" />
    <div>
      Les résultats s’afficheront ici une fois <strong>une adresse</strong> et <strong>au moins un mode de chauffage</strong> sélectionnés
    </div>
    <Logos size="sm" withFCU />
  </ResultsPlaceholder>
);

export const DescriptionModal = () => {
  return (
    <Modal modal={modalDescription} title="Description de l'outil" size="large">
      <p>
        Cet outil de comparaison permet aux utilisateurs d’évaluer différents systèmes de chauffage et de refroidissement sur trois aspects
        essentiels : technique, économique et environnemental. Grâce à une approche en coût global, l'outil analyse les performances des
        systèmes sur toute leur durée de vie, en tenant compte des coûts d'installation, d'exploitation, d'entretien, ainsi que des impacts
        environnementaux tels que les émissions de CO₂.
      </p>

      <p>
        Les utilisateurs peuvent facilement comparer plusieurs solutions grâce à des paramètres techniques prédéfinis qui incluent les
        caractéristiques du bâtiment, des usages ainsi que des équipements. Ces hypothèses sont généralistes et sont le travail de mises à
        jour régulières.
      </p>

      <p>
        Les valeurs prédéfinies incluses dans l’outil permettent de simplifier le processus de comparaison, tout en offrant la flexibilité
        de personnaliser certains paramètres pour mieux refléter les conditions réelles de chaque utilisateur.
      </p>

      <p>Deux niveaux d'utilisation sont proposés pour s’adapter à différents profils d’utilisateurs :</p>

      <ul>
        <li>
          Niveau grand public (simplifié) : conçu pour les utilisateurs non-experts, ce mode propose une interface intuitive avec des
          valeurs prédéfinies pour faciliter la comparaison. Il permet une évaluation rapide des coûts globaux et des impacts
          environnementaux sans nécessiter de connaissances techniques approfondies,
        </li>
        <li>
          Niveau technicien (avancé) : destiné aux utilisateurs plus expérimentés, ce mode offre une plus grande flexibilité en permettant
          de modifier en détail un large éventail de variables. Il permet une analyse plus fine et personnalisée des systèmes en fonction
          des spécificités du projet.
        </li>
      </ul>

      <p>
        Cet outil a également une portée pédagogique, permettant aux utilisateurs de mieux comprendre les implications techniques,
        économiques et environnementales des différentes options de chauffage et de refroidissement. Si la version avancée offre une aide à
        la décision pour les techniciens et décideurs, cet outil ne remplace pas les études de faisabilité technico-économique. Seules ces
        dernières, réalisées par des experts, peuvent offrir des incertitudes réduites et des résultats adaptés au projet.
      </p>

      <p>
        À noter que cet outil ne peut être utilisé pour remplir le quatrième critère de dérogation aux obligations de raccordement dans le
        cadre du classement (coût manifestement disproportionné). Une méthodologie dédiée est en cours d'élaboration.
      </p>
      <p>
        Cet outil prend la suite d'RCE33, outil développé par l'association AMORCE. L'association AMORCE pilote le projet, le bureau
        d’études Elcimaï y a apporté son expertise technique et France Chaleur Urbaine a mis en place la version disponible en ligne. Cet
        outil bénéficie d'un financement du programme européen Heat&Cool LIFE, piloté par la Région Sud, qui vise à développer des outils
        dans l'objectif de développer les réseaux de chaleur et de froid vertueux. La mise en place de l'interface en ligne est financée sur
        le budget de France Chaleur Urbaine.
      </p>
      <Logos />
    </Modal>
  );
};

export const modalDisclaimer = createModal({
  id: 'tool-disclaimer-modal',
  isOpenedByDefault: false,
});

export const DisclaimerModal = () => {
  return (
    <Modal modal={modalDisclaimer} title="Note supplémentaire sur l'outil" size="large">
      <p>L'outil ne préjuge pas de la possibilité de remplacer un mode de chauffage par un autre.</p>
      <p>A noter en particulier que :</p>

      <ul>
        <li>
          le passage d'un mode de chauffage individuel à collectif n'est possible que moyennant des travaux conséquents et coûteux (non pris
          en compte dans l'outil)
        </li>
        <li>
          l'installation d'une pompe à chaleur (PAC) requiert qu'un certain nombre de critères soient satisfaits : bâtiment bien isolé avec
          des besoins en chaleur limités, présence d'espaces extérieurs pour les PAC air-air et air-eau...
        </li>
      </ul>
      <p>
        Enfin, au-delà des émissions de CO2, certains modes de chauffage et de refroidissement peuvent avoir d'autres impacts
        environnementaux. A titre d'exemple, les PAC air-air et air-eau amplifient les effets de chaleur urbains en période de forte chaleur
        et peuvent être à l'origine de nuisances sonores, d'un degré variable selon les modèles.
      </p>
    </Modal>
  );
};

export const DisclaimerButton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className }) => {
  return (
    <>
      <DisclaimerModal />
      <p className={cx('fr-text--xs text-warning', className)}>
        <Icon name="fr-icon-info-line" size="xs" /> Tous les modes de chauffage ne sont pas interchangeables.{' '}
        <a href="#" onClick={() => modalDisclaimer.open()} className="fr-link fr-text--xs">
          En savoir plus
        </a>
      </p>
    </>
  );
};

const ComparateurPublicodesPlaceholder: React.FC<ComparateurPublicodesPlaceholderProps> = ({ children, className, ...props }) => {
  return (
    <div className={cx(fr.cx('fr-container'), className)} {...props}>
      <Section>
        <header>
          <ComparateurPublicodesTitle />
          <ToggleSwitch
            label="Mode&nbsp;avancé"
            labelPosition="left"
            inputTitle="Mode Pro"
            showCheckedHint={false}
            checked={false}
            disabled
            className={fr.cx('fr-mt-0')}
            onChange={() => {
              // Nothing to do as it's for loading state only
            }}
          />
        </header>
        <DescriptionModal />
        <Simulator $loading={true}>
          <Box display="flex" gap="16px" flexDirection="column">
            {simulatorTabs.map((tab) => (
              <Accordion key={tab.tabId} bordered label={tab.label}>
                Chargement...
              </Accordion>
            ))}
          </Box>
          <Results>
            <ResultsNotAvailable />
          </Results>
        </Simulator>
      </Section>
    </div>
  );
};

export default ComparateurPublicodesPlaceholder;
