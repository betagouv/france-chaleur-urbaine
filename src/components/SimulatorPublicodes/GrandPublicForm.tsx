import Accordion from '@codegouvfr/react-dsfr/Accordion';
import React from 'react';

import AddressAutocomplete from '@components/form/dsfr/AddressAutocompleteInput';
import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';
import Select from '@components/form/publicodes/Select';

import { type SimulatorEngine } from './useSimulatorEngine';

type GrandPublicFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const GrandPublicForm: React.FC<GrandPublicFormProps> = ({ children, className, engine, ...props }) => {
  const typeBatiment = engine.getField('type de bâtiment');

  return (
    <div {...props}>
      <h2>Paramètres techniques</h2>
      <Accordion label="Généraux">
        <AddressAutocomplete
          label="Adresse"
          onSelect={(address) => {
            // TODO engine.setField('commune', address.properties.postcode);

            engine.setStringField('code département', address.properties.context.split(', ')[0]);
          }}
        />
        <Input name="degré jours unifié spécifique chaud" label="degré jours unifié spécifique chaud" iconId="fr-icon-temp-cold-fill" />
        <Input name="degré jours unifié spécifique froid" label="degré jours unifié spécifique froid" iconId="fr-icon-temp-cold-fill" />
        <Input name="température de référence chaud" label="température de référence chaud" iconId="fr-icon-temp-cold-fill" />
        <Input name="augmenter la température de chauffe" label="augmenter la température de chauffe" iconId="fr-icon-temp-cold-fill" />
      </Accordion>
      <Accordion label="Réseaux de chaleur et de froid">
        <Select name="choix du réseau de chaleur" label="choix du réseau de chaleur" />
        <Select name="choix du réseau de froid" label="choix du réseau de froid" />
      </Accordion>
      <Accordion label="Besoins et choix du bâtiment">
        <Accordion label="Choix du bâtiment">
          <RadioInput name="type de bâtiment" small orientation="horizontal" />
          {typeBatiment === 'résidentiel' && (
            <Input
              name="nombre de logement dans l'immeuble concerné"
              label="nombre de logement dans l'immeuble concerné"
              nativeInputProps={{
                inputMode: 'numeric',
                maxLength: 5, // a l'air de ne pas fonctionner
                type: 'number',
              }}
            />
          )}
          <Input
            name="surface logement type tertiaire"
            label="surface logement type tertiaire"
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 6, // a l'air de ne pas fonctionner
              type: 'number',
            }}
          />
          {typeBatiment === 'résidentiel' && (
            <Input
              name="Nombre d'habitants moyen par appartement"
              label="Nombre d'habitants moyen par appartement"
              nativeInputProps={{
                inputMode: 'numeric',
                maxLength: 2, // a l'air de ne pas fonctionner
                type: 'number',
              }}
            />
          )}
          <RadioInput name="Production eau chaude sanitaire" label="Production eau chaude sanitaire" small orientation="horizontal" />
          <Select name="type de production ECS" label="type de production ECS" />
          <Input
            name="Part de la surface à climatiser"
            label="Part de la surface à climatiser"
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 3,
              type: 'number',
              min: 0,
              max: 100,
              step: 1,
            }}
          />
          <Select name="Température émetteurs" label="Température émetteurs" />
        </Accordion>
        <Accordion label="Besoins calculés">
          <Select
            name="méthode de calcul pour les besoins en chauffage et refroidissement"
            label="méthode de calcul pour les besoins en chauffage et refroidissement"
            hintText="ne fonctionne pas pour le moment"
          />
          {typeBatiment === 'résidentiel' && (
            <Select
              name="méthode résidentiel"
              label="méthode de calcul pour les besoins en chauffage et refroidissement"
              hintText="méthode résidentiel"
            />
          )}
          {typeBatiment === 'tertiaire' && (
            <Select
              name="méthode tertiaire"
              label="méthode de calcul pour les besoins en chauffage et refroidissement"
              hintText="méthode tertiaire"
            />
          )}
          {engine.getField('méthode de calcul pour les besoins en chauffage et refroidissement') === 'DPE' && (
            <Select name="DPE" label="DPE" />
          )}
          {engine.getField('méthode de calcul pour les besoins en chauffage et refroidissement') ===
            'Normes thermiques et âge du bâtiment' && (
            <Select name="normes thermiques et âge du bâtiment" label="normes thermiques et âge du bâtiment" />
          )}
          <Input name="consommation spécifique chauffage" label="consommation spécifique chauffage" />
          <Input name="besoins chauffage par appartement" label="besoins chauffage par appartement" />
          <Input name="consommation spécifique ECS" label="consommation spécifique ECS" />
          <Input name="besoins eau chaude sanitaire par appartement" label="besoins eau chaude sanitaire par appartement" />
          <Input name="consommation spécifique climatisation par habitant" label="consommation spécifique climatisation par habitant" />
          <Input name="besoins en climatisation par appartement" label="besoins en climatisation par appartement" />
        </Accordion>
      </Accordion>
      <Accordion label="Calcul puissance">
        <Input name="ratios . PUIS Température de non chauffage" label="Température de non chauffage" />
        <Input name="ratios . PUIS Facteur de surpuissance" label="Facteur de surpuissance" />
        <Input
          name="ratios . PUIS Nombre heure de fonctionnement non climatique ECS"
          label="Nombre heure de fonctionnement non climatique ECS"
        />
        <Input name="ratios . PUIS Coefficient de foisonnement ECS" label="Coefficient de foisonnement ECS" />
        <Input
          name="ratios . PUIS Coefficient de foisonnement chauffage collectif"
          label="Coefficient de foisonnement chauffage collectif"
        />
      </Accordion>
      <Accordion label="Réseaux">
        <Accordion label="RCU">
          <Input name="ratios . RCU Rendement sous station chauffage" label="RCU Rendement sous station chauffage" />
          <Input name="ratios . RCU Rendement sous station ECS" label="RCU Rendement sous station ECS" />
          <Input name="ratios . RCU Conso auxilliaire chauffage" label="RCU Conso auxilliaire chauffage" />
          <Input name="ratios . RCU Conso auxilliaire ECS" label="RCU Conso auxilliaire ECS" />
          <Input name="ratios . RCU Durée avant renouvellement" label="RCU Durée avant renouvellement" />
        </Accordion>
        <Accordion label="RFU">
          <Input name="ratios . RFU Rendement sous station" label="RFU Rendement sous station" />
          <Input name="ratios . RFU Conso auxiliaire" label="RFU Conso auxiliaire" />
          <Input name="ratios . RFU Durée de vie" label="RFU Durée de vie" />
        </Accordion>
      </Accordion>
      <Accordion label="Granulés">
        <Accordion label="Poêle à granulés indiv">
          <Input name="ratios . GRA POELE Rendement poêle chauffage" label="Rendement poêle chauffage" />
          <Input name="ratios . GRA POELE Conso combustible" label="Conso combustible" />
          <Input name="ratios . GRA POELE Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Chaudière à granulés coll">
          <Input name="ratios . GRA CHAUD Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . GRA CHAUD Conso combustible" label="Conso combustible" />
          <Input name="ratios . GRA CHAUD Conso auxilliaire" label="Conso auxilliaire" />
          <Input name="ratios . GRA CHAUD Durée de vie" label="Durée de vie" />
        </Accordion>
      </Accordion>
      <Accordion label="Gaz">
        <Accordion label="Gaz indiv avec cond">
          <Input name="ratios . GAZ IND COND Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . GAZ IND COND Rendement chaudière ECS" label="Rendement chaudière ECS" />
          <Input name="ratios . GAZ IND COND Conso combustible" label="Conso combustible" />
          <Input name="ratios . GAZ IND COND Conso auxilliaire chauffage" label="Conso auxilliaire chauffage" />
          <Input name="ratios . GAZ IND COND Conso auxilliaire ECS" label="Conso auxilliaire ECS" />
          <Input name="ratios . GAZ IND COND Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Gaz indiv sans cond">
          <Input name="ratios . GAZ IND SCOND Rendement chaudière" label="Rendement chaudière" />
          <Input name="ratios . GAZ IND SCOND Conso combustible" label="Conso combustible" />
          <Input name="ratios . GAZ IND SCOND Conso auxilliaire chauffage" label="Conso auxilliaire chauffage" />
          <Input name="ratios . GAZ IND SCOND Conso auxilliaire ECS" label="Conso auxilliaire ECS" />
          <Input name="ratios . GAZ IND SCOND Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Gaz coll avec cond">
          <Input name="ratios . GAZ COLL COND Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . GAZ COLL COND Rendement chaudière ECS" label="Rendement chaudière ECS" />
          <Input name="ratios . GAZ COLL COND Conso combustible" label="Conso combustible" />
          <Input name="ratios . GAZ COLL COND Conso auxilliaire chauffage" label="Conso auxilliaire chauffage" />
          <Input name="ratios . GAZ COLL COND Conso auxilliaire ECS" label="Conso auxilliaire ECS" />
          <Input name="ratios . GAZ COLL COND Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Gaz coll sans cond">
          <Input name="ratios . GAZ COLL SCOND Rendement chaudière" label="Rendement chaudière" />
          <Input name="ratios . GAZ COLL SCOND Conso combustible" label="Conso combustible" />
          <Input name="ratios . GAZ COLL SCOND Conso auxilliaire chauffage" label="Conso auxilliaire chauffage" />
          <Input name="ratios . GAZ COLL SCOND Conso auxilliaire ECS" label="Conso auxilliaire ECS" />
          <Input name="ratios . GAZ COLL SCOND Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Fioul">
          <Accordion label="Fioul indiv">
            <Input name="ratios . FIOUL IND Rendement chaudière" label="Rendement chaudière" />
            <Input name="ratios . FIOUL IND Conso combustible" label="Conso combustible" />
            <Input name="ratios . FIOUL IND Conso auxilliaire chauffage" label="Conso auxilliaire chauffage" />
            <Input name="ratios . FIOUL IND Conso auxilliaire ECS" label="Conso auxilliaire ECS" />
            <Input name="ratios . FIOUL IND Durée de vie" label="Durée de vie" />
          </Accordion>
          <Accordion label="Fioul coll">
            <Input name="ratios . FIOUL COLL Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
            <Input name="ratios . FIOUL COLL Rendement chaudière ECS" label="Rendement chaudière ECS" />
            <Input name="ratios . FIOUL COLL Conso combustible" label="Conso combustible" />
            <Input name="ratios . FIOUL COLL Conso auxilliaire chauffage" label="Conso auxilliaire chauffage" />
            <Input name="ratios . FIOUL COLL Conso auxilliaire ECS" label="Conso auxilliaire ECS" />
            <Input name="ratios . FIOUL COLL Durée de vie" label="Durée de vie" />
          </Accordion>
        </Accordion>
        <Accordion label="Pompe à chaleur">
          <Accordion label="PAC air/air réversible">
            <Input name="ratios . PAC AIR AIR SCOP indiv" label="SCOP indiv" />
            <Input name="ratios . PAC AIR AIR SCOP coll" label="SCOP coll" />
            <Input name="ratios . PAC AIR AIR SEER indiv" label="SEER indiv" />
            <Input name="ratios . PAC AIR AIR SEER coll" label="SEER coll" />
            <Input name="ratios . PAC AIR AIR Durée de vie indiv" label="Durée de vie indiv" />
            <Input name="ratios . PAC AIR AIR Durée de vie coll" label="Durée de vie coll" />
          </Accordion>
          <Accordion label="PAC eau/eau">
            <Input name="ratios . PAC EAU EAU SCOP indiv capteurs horizontaux" label="SCOP indiv capteurs horizontaux" />
            <Input name="ratios . PAC EAU EAU SCOP coll champ de sondes" label="SCOP coll champ de sondes" />
            <Input name="ratios . PAC EAU EAU Durée de vie" label="Durée de vie" />
            <Input name="ratios . PAC EAU EAU Durée de vie puits géothermiques" label="Durée de vie puits géothermiques" />
          </Accordion>
          <Accordion label="PAC air/eau réversible">
            <Input name="ratios . PAC AIR EAU SCOP indiv" label="SCOP indiv" />
            <Input name="ratios . PAC AIR EAU SCOP coll" label="SCOP coll" />
            <Input name="ratios . PAC AIR EAU SEER indiv" label="SEER indiv" />
            <Input name="ratios . PAC AIR EAU SEER coll" label="SEER coll" />
            <Input name="ratios . PAC AIR EAU Durée de vie indiv" label="Durée de vie indiv" />
            <Input name="ratios . PAC AIR EAU Durée de vie coll" label="Durée de vie coll" />
          </Accordion>
        </Accordion>
      </Accordion>
      <Accordion label="Radiateur électrique indiv">
        <Input name="ratios . RAD ELEC INDIV Rendement" label="Rendement" />
        <Input name="ratios . RAD ELEC INDIV Conso combustible" label="Conso combustible" />
        <Input name="ratios . RAD ELEC INDIV Durée de vie" label="Durée de vie" />
      </Accordion>
      <Accordion label="Calcul ECS">
        <Accordion label="Chauffe-eau éléctrique à accumulation">
          <Input name="ratios . CHAUF EAU ELEC Rendement stockage ballon" label="Rendement stockage ballon" />
          <Input name="ratios . CHAUF EAU ELEC Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Chauffe-eau solaire avec appoint éléctrique">
          <Input name="ratios . CHAUF EAU SOLAIRE Rendement stockage ballon" label="Rendement stockage ballon" />
          <Input name="ratios . CHAUF EAU SOLAIRE Durée de vie" label="Durée de vie" />
          <Input
            name="ratios . CHAUF EAU SOLAIRE Part du solaire dans la production d'ECS"
            label="Part du solaire dans la production d'ECS"
          />
        </Accordion>
      </Accordion>
    </div>
  );
};

export default GrandPublicForm;
