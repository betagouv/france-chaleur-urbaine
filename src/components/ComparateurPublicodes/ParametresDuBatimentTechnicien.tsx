import type React from 'react';

import Input from '@/components/form/publicodes/Input';
import RadioInput from '@/components/form/publicodes/Radio';
import Select from '@/components/form/publicodes/Select';
import { UrlStateAccordion as Accordion } from '@/components/ui/Accordion';
import Link from '@/components/ui/Link';

import { Title } from './ComparateurPublicodes.style';
import SelectClimatisation from './SelectClimatisation';
import SelectProductionECS from './SelectProductionECS';
import type { SimulatorEngine } from './useSimulatorEngine';

type ParametresDuBatimentTechnicienFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const ParametresDuBatimentTechnicienForm: React.FC<ParametresDuBatimentTechnicienFormProps> = ({
  children,
  className,
  engine,
  ...props
}) => {
  const typeBatiment = engine.getField('bâtiment . type');
  const productionECS = engine.getField('ecs . production');
  const typeDeProductionECS = engine.getField('ecs . type de production');
  const inclureLaClimatisation = engine.getField('climatisation . incluse');

  return (
    <div {...props}>
      <SelectProductionECS />
      <SelectClimatisation />

      <Accordion label="Informations générales">
        <Input name="climat . degré jours chaud" iconId="fr-icon-temp-cold-fill" />
        <Input name="climat . degré jours froid" iconId="fr-icon-temp-cold-fill" />
        <Input name="climat . température de référence chaud" iconId="fr-icon-temp-cold-fill" />
        <Input
          name="bâtiment . augmenter la température de chauffe"
          iconId="fr-icon-temp-cold-fill"
          help={'Augmentation en degré de la consigne de température intérieure, par rapport à 20°.'}
        />

        <Select name="climat . zone" />
        <Select name="climat . sous zone" />
      </Accordion>

      <Accordion
        label="Choix du bâtiment"
        help="Les caractéristiques du bâtiment et ses usages sont centraux pour les estimations de consommation énergétique."
      >
        <RadioInput name="bâtiment . type" small orientation="horizontal" />
        {typeBatiment === 'résidentiel' && (
          <>
            <Select
              name="bâtiment . méthode résidentiel"
              help="Les normes thermiques permettent une estimation des besoins de chaleur plus précise que les DPE. Elles peuvent être estimées par l'année de construction ou de rénovation du logement."
            />
            {engine.getField('bâtiment . méthode résidentiel') === 'DPE' && <Select name="bâtiment . DPE" />}
            {engine.getField('bâtiment . méthode résidentiel') === 'Normes thermiques et âge du bâtiment' && (
              <Select name="bâtiment . normes thermiques et âge" />
            )}
          </>
        )}
        {typeBatiment === 'tertiaire' && (
          <>
            <Select name="bâtiment . méthode tertiaire" />
            <Select name="bâtiment . normes thermiques tertiaire" />
          </>
        )}
        <Input
          name="bâtiment . surface tertiaire"
          nativeInputProps={{
            inputMode: 'numeric',
            maxLength: 6,
            type: 'number',
          }}
        />
        {typeBatiment === 'résidentiel' && (
          <>
            <Input
              name="bâtiment . habitants par logement"
              hideUnit
              help="Le nombre d'habitants permet d'estimer la consommation d'eau chaude sanitaire du logement."
              nativeInputProps={{
                inputMode: 'numeric',
                maxLength: 2,
                type: 'number',
              }}
            />
            <Input
              name="bâtiment . nombre de logements"
              hideUnit
              help="Par simplification, tous les logements d'un même immeuble sont considérés identiques."
              nativeInputProps={{
                inputMode: 'numeric',
                maxLength: 5,
                min: 1,
                type: 'number',
              }}
            />
          </>
        )}

        <Input
          name="bâtiment . part de la surface à climatiser"
          help="% de la surface du logement climatisé, par exemple lorsqu'uniquement le salon d'un logement est refroidi."
          nativeInputProps={{
            inputMode: 'numeric',
            max: 100,
            maxLength: 3,
            min: 1,
            step: 1,
            type: 'number',
          }}
        />
        <Select
          name="bâtiment . température émetteurs"
          help="Les émetteurs sont les équipements diffusant la chaleur dans une pièce, par exemple les radiateurs. La température des émetteurs influence la performance des pompes à chaleur : plus la température des émetteurs est basse, plus les performances sont élevées."
        />
      </Accordion>

      <Accordion label="Besoins calculés">
        <Input name="besoins . consommation spécifique chauffage" />
        {productionECS && <Input name="besoins . consommation spécifique ECS" />}
        {inclureLaClimatisation && <Input name="besoins . consommation spécifique climatisation" />}
        <Input
          name="besoins . chauffage par logement"
          placeholderPrecision={0}
          help={
            <>
              Si connue, l'utilisateur peut rentrer ici la consommation énergétique de son logement. La valeur doit être renseignée en
              énergie utile, c'est-à-dire l'énergie réellement nécessaire pour chauffer le logement, par opposition à l'énergie finale qui
              est l'énergie facturée et prend en compte les pertes des équipements de production.{' '}
              <Link
                isExternal
                href="https://reseaux-chaleur.cerema.fr/espace-documentaire/stades-lenergie-primaire-secondaire-finale-utile"
              >
                Source
              </Link>
            </>
          }
        />
        {productionECS && (
          <Input
            name="besoins . ECS par logement"
            placeholderPrecision={0}
            help={"Si connue, l'utilisateur peut rentrer ici la consommation d'eau chaude sanitaire de son logement (énergie utile)."}
          />
        )}
        {inclureLaClimatisation && (
          <Input
            name="besoins . climatisation par logement"
            placeholderPrecision={0}
            help="Les besoins en climatisation sont rarement connus et difficiles à estimer, ils sont très variables en fonction de l'usage et des caractéristiques d'implantation du logement (comme l'exposition par exemple)."
          />
        )}
      </Accordion>

      <Accordion label="Calcul puissance" help="Le calcul de la puissance permet de dimensionner les installations nécessaires.">
        <Input
          name="dimensionnement . ratios . température de non chauffage"
          help="Température en dessous de laquelle le chauffage est déclenché. Elle influence uniquement les puissances de dimensionnement et non les besoins."
        />
        <Input
          name="dimensionnement . ratios . facteur de surpuissance"
          help="% de surpuissance appliqué en sécurité. Influence uniquement les puissances de dimensionnement."
        />
        <Input
          name="dimensionnement . ratios . heures de fonctionnement non climatique ECS"
          help="Nombre d'heures pendant lequel l'eau chaude sanitaire est produite. Influence uniquement la puissance de dimensionnement de l'ECS."
        />
        <Input name="dimensionnement . ratios . coefficient de foisonnement ECS" />
        <Input
          name="dimensionnement . ratios . coefficient de foisonnement chauffage collectif"
          help="Coefficient permettant d'intégrer les décalages temporels de consommation entre les utilisateurs. Influence uniquement la puissance de dimensionnement."
        />
      </Accordion>

      {productionECS && (
        <Accordion label="Calcul ECS">
          <Title>Chauffe-eau électrique à accumulation</Title>
          <Input
            name="ecs additionnelle . rendement stockage ballon électrique"
            help="Une partie de l'énergie stockée dans les ballons est perdue."
          />
          <Input
            name="ecs additionnelle . durée de vie chauffe-eau électrique"
            help="Durée de vie estimée des équipements de production de chaleur."
          />
          {typeDeProductionECS === 'Solaire thermique' && (
            <>
              <Title>Chauffe-eau solaire avec appoint électrique</Title>
              <Input
                name="ecs additionnelle . rendement stockage ballon solaire"
                help="Une partie de l'énergie stockée dans les ballons est perdue."
              />
              <Input
                name="ecs additionnelle . durée de vie chauffe-eau solaire"
                help="Durée de vie estimée des équipements de production de chaleur."
              />
              <Input name="ecs additionnelle . part du solaire dans la production" />
            </>
          )}
        </Accordion>
      )}

      {productionECS && (
        <Accordion label="Puissance totale des installations">
          <Input name="ecs additionnelle . capacité du ballon électrique" />
          {typeDeProductionECS === 'Solaire thermique' && <Input name="ecs additionnelle . surface de panneaux" />}
        </Accordion>
      )}
    </div>
  );
};

export default ParametresDuBatimentTechnicienForm;
