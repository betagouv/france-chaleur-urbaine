import React from 'react';

import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';
import Select from '@components/form/publicodes/Select';
import { UrlStateAccordion as Accordion } from '@components/ui/Accordion';
import Link from '@components/ui/Link';

import SelectClimatisation from './SelectClimatisation';
import SelectProductionECS from './SelectProductionECS';
import { type SimulatorEngine } from './useSimulatorEngine';

type ParametresDuBatimentTechnicienFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const ParametresDuBatimentTechnicienForm: React.FC<ParametresDuBatimentTechnicienFormProps> = ({
  children,
  className,
  engine,
  ...props
}) => {
  const typeBatiment = engine.getField('type de bâtiment');

  return (
    <div {...props}>
      <SelectProductionECS />
      <SelectClimatisation />

      <Accordion label="Informations générales">
        <Input name="degré jours unifié spécifique chaud" label="degré jours unifié spécifique chaud" iconId="fr-icon-temp-cold-fill" />
        <Input name="degré jours unifié spécifique froid" label="degré jours unifié spécifique froid" iconId="fr-icon-temp-cold-fill" />
        <Input name="température de référence chaud" label="température de référence chaud" iconId="fr-icon-temp-cold-fill" />
        <Input
          name="augmenter la température de chauffe"
          label="augmenter la température de chauffe"
          iconId="fr-icon-temp-cold-fill"
          help={'Augmentation en degré de la consigne de température intérieure, par rapport à 20°.'}
        />

        <Select name="zone climatique" label="Zone climatique" />
        <Select name="sous zone climatique" label="Sous-zone climatique" />
      </Accordion>

      <Accordion
        label="Choix du bâtiment"
        help="Les caractéristiques du bâtiment et ses usages sont centraux pour les estimations de consommation énergétique."
      >
        <RadioInput name="type de bâtiment" small orientation="horizontal" />
        {typeBatiment === 'résidentiel' && (
          <>
            <Select
              name="méthode résidentiel"
              label="Méthode de calcul pour les besoins en chauffage et refroidissement"
              help="Les normes thermiques permettent une estimation des besoins de chaleur plus précise que les DPE. Elles peuvent être estimées par l'année de construction ou de rénovation du logement."
            />
            {engine.getField('méthode résidentiel') === 'DPE' && <Select name="DPE" label="DPE" />}
            {engine.getField('méthode résidentiel') === 'Normes thermiques et âge du bâtiment' && (
              <Select name="normes thermiques et âge du bâtiment" label="Normes thermiques et âge du bâtiment" />
            )}
          </>
        )}
        {typeBatiment === 'tertiaire' && (
          <>
            <Select name="méthode tertiaire" label="Méthode de calcul pour les besoins en chauffage et refroidissement" />
            <Select name="normes thermiques tertiaire" label="Normes thermiques tertiaire" />
          </>
        )}
        <Input
          name="surface logement type tertiaire"
          label="Surface"
          nativeInputProps={{
            inputMode: 'numeric',
            maxLength: 6,
            type: 'number',
          }}
        />
        {typeBatiment === 'résidentiel' && (
          <>
            <Input
              name="Nombre d'habitants moyen par appartement"
              label="Nombre d'habitants moyen par appartement"
              hideUnit
              help="Le nombre d'habitants permet d'estimer la consommation d'eau chaude sanitaire du logement."
              nativeInputProps={{
                inputMode: 'numeric',
                maxLength: 2,
                type: 'number',
              }}
            />
            <Input
              name="nombre de logements dans l'immeuble concerné"
              label="Nombre de logements dans l'immeuble concerné"
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
          name="Part de la surface à climatiser"
          label="Part de la surface à climatiser"
          help="% de la surface du logement climatisé, par exemple lorsqu'uniquement le salon d'un logement est refroidi."
          nativeInputProps={{
            inputMode: 'numeric',
            maxLength: 3,
            type: 'number',
            min: 1,
            max: 100,
            step: 1,
          }}
        />
        <Select
          name="Température émetteurs"
          label="Température émetteurs"
          help="Les émetteurs sont les équipements diffusant la chaleur dans une pièce, par exemple les radiateurs. La température des émetteurs influence la performance des pompes à chaleur : plus la température des émetteurs est basse, plus les performances sont élevées."
        />
      </Accordion>

      <Accordion label="Besoins calculés">
        <Input name="consommation spécifique chauffage" label="consommation spécifique chauffage" />
        <Input name="consommation spécifique ECS" label="consommation spécifique ECS" />
        <Input name="consommation spécifique climatisation" label="consommation spécifique climatisation par habitant" />
        <Input
          name="besoins chauffage par appartement"
          label="besoins chauffage par appartement"
          placeholderPrecision={0}
          help={
            <>
              Si connue, l'utilisateur peut rentrer ici la consommation énergétique de son logement. La valeur doit être renseignée en
              énergie utile, c’est-à-dire l'énergie réellement nécessaire pour chauffer le logement, par opposition à l'énergie finale qui
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
        <Input
          name="besoins eau chaude sanitaire par appartement"
          label="besoins eau chaude sanitaire par appartement"
          placeholderPrecision={0}
          help={"Si connue, l'utilisateur peut rentrer ici la consommation d'eau chaude sanitaire de son logement (énergie utile)."}
        />
        <Input
          name="besoins en climatisation par appartement"
          label="besoins en climatisation par appartement"
          placeholderPrecision={0}
          help="Les besoins en climatisation sont rarement connus et difficiles à estimer, ils sont très variables en fonction de l'usage et des caractéristiques d'implantation du logement (comme l'exposition par exemple)."
        />
      </Accordion>

      <Accordion label="Calcul puissance" help="Le calcul de la puissance permet de dimensionner les installations nécessaires.">
        <Input
          name="ratios . PUIS Température de non chauffage"
          label="Température de non chauffage"
          help="Température en dessous de laquelle le chauffage est déclenché. Elle influence uniquement les puissances de dimensionnement et non les besoins."
        />
        <Input
          name="ratios . PUIS Facteur de surpuissance"
          label="Facteur de surpuissance"
          help="% de surpuissance appliqué en sécurité. Influence uniquement les puissances de dimensionnement."
        />
        <Input
          name="ratios . PUIS Nombre heure de fonctionnement non climatique ECS"
          label="Nombre heure de fonctionnement non climatique ECS"
          help="Nombre d'heures pendant lequel l'eau chaude sanitaire est produite. Influence uniquement la puissance de dimensionnement de l'ECS."
        />
        <Input name="ratios . PUIS Coefficient de foisonnement ECS" label="Coefficient de foisonnement ECS" />
        <Input
          name="ratios . PUIS Coefficient de foisonnement chauffage collectif"
          label="Coefficient de foisonnement chauffage collectif"
          help="Coefficient permettant d'intégrer les décalages temporels de consommation entre les utilisateurs. Influence uniquement la puissance de dimensionnement."
        />
      </Accordion>

      <Accordion label="Calcul ECS">
        <Accordion label="Chauffe-eau électrique à accumulation">
          <Input
            name="ratios . CHAUF EAU ELEC Rendement stockage ballon"
            label="Rendement stockage ballon"
            help="Une partie de l'énergie stockée dans les ballons est perdue."
          />
          <Input
            name="ratios . CHAUF EAU ELEC Durée de vie"
            label="Durée de vie"
            help="Durée de vie estimée des équipements de production de chaleur."
          />
        </Accordion>
        <Accordion label="Chauffe-eau solaire avec appoint électrique">
          <Input
            name="ratios . CHAUF EAU SOLAIRE Rendement stockage ballon"
            label="Rendement stockage ballon"
            help="Une partie de l'énergie stockée dans les ballons est perdue."
          />
          <Input
            name="ratios . CHAUF EAU SOLAIRE Durée de vie"
            label="Durée de vie"
            help="Durée de vie estimée des équipements de production de chaleur."
          />
          <Input
            name="ratios . CHAUF EAU SOLAIRE Part du solaire dans la production d'ECS"
            label="Part du solaire dans la production d'ECS"
          />
        </Accordion>
      </Accordion>

      <Accordion label="Puissance totale des installations">
        <Input
          name="Puissance installation x Capacité chauffe eau électrique à accumulation"
          label="Capacité chauffe eau électrique à accumulation"
        />
        <Input name="Puissance installation x Capacité chauffe eau solaire" label="Capacité chauffe eau solaire" />
        <Input name="surface de panneau nécessaire" label="Surface de panneau nécessaire" />
      </Accordion>
    </div>
  );
};

export default ParametresDuBatimentTechnicienForm;
