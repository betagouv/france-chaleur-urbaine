import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import React from 'react';

import AddressAutocomplete from '@components/form/dsfr/AddressAutocompleteInput';
import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';
import Select from '@components/form/publicodes/Select';
import { UrlStateAccordion as Accordion } from '@components/ui/Accordion';
import { postFetchJSON } from '@utils/network';
import { ObjectEntries } from '@utils/typescript';

import { type SimulatorEngine } from './useSimulatorEngine';

const addresseToPublicodesRules = {
  'caractéristique réseau de chaleur . contenu CO2': (infos) => infos.nearestReseauDeChaleur['contenu CO2'],
  'caractéristique réseau de chaleur . contenu CO2 ACV': (infos) => infos.nearestReseauDeChaleur['contenu CO2 ACV'],
  'caractéristique réseau de chaleur . coût résidentiel': (infos) => infos.nearestReseauDeChaleur['PM_L'],
  'caractéristique réseau de chaleur . coût tertiaire': (infos) => infos.nearestReseauDeChaleur['PM_T'],
  'caractéristique réseau de chaleur . livraisons totales': (infos) => infos.nearestReseauDeChaleur['livraisons_totale_MWh'],
  'caractéristique réseau de chaleur . part fixe': (infos) => infos.nearestReseauDeChaleur['PF%'],
  'caractéristique réseau de chaleur . part variable': (infos) => infos.nearestReseauDeChaleur['PV%'],
  'caractéristique réseau de chaleur . prix moyen': (infos) => infos.nearestReseauDeChaleur['PM'],
  'caractéristique réseau de chaleur . production totale': (infos) => infos.nearestReseauDeChaleur['production_totale_MWh'],
  'caractéristique réseau de chaleur . taux EnRR': (infos) => infos.nearestReseauDeChaleur['Taux EnR&R'],

  'caractéristique réseau de froid . contenu CO2': (infos) => infos.nearestReseauDeFroid['contenu CO2'],
  'caractéristique réseau de froid . contenu CO2 ACV': (infos) => infos.nearestReseauDeFroid['contenu CO2 ACV'],
  'caractéristique réseau de froid . livraisons totales': (infos) => infos.nearestReseauDeFroid['livraisons_totale_MWh'],
  'caractéristique réseau de froid . production totale': (infos) => infos.nearestReseauDeFroid['production_totale_MWh'],

  'code département': (infos) => `'${infos.infosVilles.departement_id}'`,
  'température de référence chaud': (infos) => +infos.infosVilles.temperature_ref_altitude_moyenne,
} as const satisfies Partial<Record<DottedName, (infos: any) => any>>;

type TechnicienBatimentFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const TechnicienBatimentForm: React.FC<TechnicienBatimentFormProps> = ({ children, className, engine, ...props }) => {
  const typeBatiment = engine.getField('type de bâtiment');
  return (
    <div {...props}>
      <Accordion label="Généraux">
        <AddressAutocomplete
          label="Adresse"
          onSelect={async (address) => {
            const infos = await postFetchJSON('/api/location-infos', {
              lon: address.geometry.coordinates[0],
              lat: address.geometry.coordinates[1],
              city: address.properties.city,
              cityCode: address.properties.citycode,
            });

            console.debug('locations-infos', infos);

            engine.setSituation(
              ObjectEntries(addresseToPublicodesRules).reduce(
                (acc, [key, infoGetter]) => ({
                  ...acc,
                  [key]: infoGetter(infos),
                }),
                {}
              )
            );
          }}
        />
        <Input name="degré jours unifié spécifique chaud" label="degré jours unifié spécifique chaud" iconId="fr-icon-temp-cold-fill" />
        <Input name="degré jours unifié spécifique froid" label="degré jours unifié spécifique froid" iconId="fr-icon-temp-cold-fill" />
        <Input name="température de référence chaud" label="température de référence chaud" iconId="fr-icon-temp-cold-fill" />
        <Input name="augmenter la température de chauffe" label="augmenter la température de chauffe" iconId="fr-icon-temp-cold-fill" />
      </Accordion>
      {/* Pas besoin car seront définis via l'adresse en externe */}
      {/* <Accordion label="Réseaux de chaleur et de froid">
        <Select name="choix du réseau de chaleur" label="choix du réseau de chaleur" />
        <Select name="choix du réseau de froid" label="choix du réseau de froid" />
      </Accordion> */}
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
          {typeBatiment === 'résidentiel' && (
            <>
              <Select
                name="méthode résidentiel"
                label="méthode de calcul pour les besoins en chauffage et refroidissement"
                hintText="méthode résidentiel"
              />
              {engine.getField('méthode résidentiel') === 'DPE' && <Select name="DPE" label="DPE" />}
              {engine.getField('méthode résidentiel') === 'Normes thermiques et âge du bâtiment' && (
                <Select name="normes thermiques et âge du bâtiment" label="normes thermiques et âge du bâtiment" />
              )}
            </>
          )}
          {typeBatiment === 'tertiaire' && (
            <>
              <Select
                name="méthode tertiaire"
                label="méthode de calcul pour les besoins en chauffage et refroidissement"
                hintText="méthode tertiaire"
              />
              <Select name="normes thermiques tertiaire" label="normes thermiques tertiaire" />
            </>
          )}
          <Input name="consommation spécifique chauffage" label="consommation spécifique chauffage" />
          <Input name="besoins chauffage par appartement" label="besoins chauffage par appartement" placeholderPrecision={2} />
          <Input name="consommation spécifique ECS" label="consommation spécifique ECS" />
          <Input name="besoins eau chaude sanitaire par appartement" label="besoins eau chaude sanitaire par appartement" />
          <Input name="consommation spécifique climatisation" label="consommation spécifique climatisation par habitant" />
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
          <Input name="ratios . RCU Conso auxiliaire chauffage" label="RCU Conso auxiliaire chauffage" />
          <Input name="ratios . RCU Conso auxiliaire ECS" label="RCU Conso auxiliaire ECS" />
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
          <Input name="ratios . GRA POELE Conso combustible" label="Conso combustible" placeholderPrecision={4} />
          <Input name="ratios . GRA POELE Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Chaudière à granulés coll">
          <Input name="ratios . GRA CHAUD Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . GRA CHAUD Conso combustible" label="Conso combustible" placeholderPrecision={4} />
          <Input name="ratios . GRA CHAUD Conso auxiliaire" label="Conso auxiliaire" />
          <Input name="ratios . GRA CHAUD Durée de vie" label="Durée de vie" />
        </Accordion>
      </Accordion>
      <Accordion label="Gaz">
        <Accordion label="Gaz indiv avec cond">
          <Input name="ratios . GAZ IND COND Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . GAZ IND COND Rendement chaudière ECS" label="Rendement chaudière ECS" />
          <Input name="ratios . GAZ IND COND Conso combustible" label="Conso combustible" />
          <Input name="ratios . GAZ IND COND Conso auxiliaire chauffage" label="Conso auxiliaire chauffage" />
          <Input name="ratios . GAZ IND COND Conso auxiliaire ECS" label="Conso auxiliaire ECS" />
          <Input name="ratios . GAZ IND COND Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Gaz indiv sans cond">
          <Input name="ratios . GAZ IND SCOND Rendement chaudière" label="Rendement chaudière" />
          <Input name="ratios . GAZ IND SCOND Conso combustible" label="Conso combustible" />
          <Input name="ratios . GAZ IND SCOND Conso auxiliaire chauffage" label="Conso auxiliaire chauffage" />
          <Input name="ratios . GAZ IND SCOND Conso auxiliaire ECS" label="Conso auxiliaire ECS" />
          <Input name="ratios . GAZ IND SCOND Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Gaz coll avec cond">
          <Input name="ratios . GAZ COLL COND Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . GAZ COLL COND Rendement chaudière ECS" label="Rendement chaudière ECS" />
          <Input name="ratios . GAZ COLL COND Conso combustible" label="Conso combustible" />
          <Input name="ratios . GAZ COLL COND Conso auxiliaire chauffage" label="Conso auxiliaire chauffage" />
          <Input name="ratios . GAZ COLL COND Conso auxiliaire ECS" label="Conso auxiliaire ECS" />
          <Input name="ratios . GAZ COLL COND Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Gaz coll sans cond">
          <Input name="ratios . GAZ COLL SCOND Rendement chaudière" label="Rendement chaudière" />
          <Input name="ratios . GAZ COLL SCOND Conso combustible" label="Conso combustible" />
          <Input name="ratios . GAZ COLL SCOND Conso auxiliaire chauffage" label="Conso auxiliaire chauffage" />
          <Input name="ratios . GAZ COLL SCOND Conso auxiliaire ECS" label="Conso auxiliaire ECS" />
          <Input name="ratios . GAZ COLL SCOND Durée de vie" label="Durée de vie" />
        </Accordion>
      </Accordion>
      <Accordion label="Fioul">
        <Accordion label="Fioul indiv">
          <Input name="ratios . FIOUL IND Rendement chaudière" label="Rendement chaudière" />
          <Input name="ratios . FIOUL IND Conso combustible" label="Conso combustible" />
          <Input name="ratios . FIOUL IND Conso auxiliaire chauffage" label="Conso auxiliaire chauffage" />
          <Input name="ratios . FIOUL IND Conso auxiliaire ECS" label="Conso auxiliaire ECS" />
          <Input name="ratios . FIOUL IND Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Fioul coll">
          <Input name="ratios . FIOUL COLL Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . FIOUL COLL Rendement chaudière ECS" label="Rendement chaudière ECS" />
          <Input name="ratios . FIOUL COLL Conso combustible" label="Conso combustible" />
          <Input name="ratios . FIOUL COLL Conso auxiliaire chauffage" label="Conso auxiliaire chauffage" />
          <Input name="ratios . FIOUL COLL Conso auxiliaire ECS" label="Conso auxiliaire ECS" />
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

export default TechnicienBatimentForm;
