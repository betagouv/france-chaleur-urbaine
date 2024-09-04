import React from 'react';

import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';
import Select from '@components/form/publicodes/Select';
import { UrlStateAccordion as Accordion } from '@components/ui/Accordion';

import { type SimulatorEngine } from './useSimulatorEngine';

type TechnicienBatimentFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const TechnicienBatimentForm: React.FC<TechnicienBatimentFormProps> = ({ children, className, engine, ...props }) => {
  const typeBatiment = engine.getField('type de bâtiment');
  const productionECS = engine.getField('Production eau chaude sanitaire');

  return (
    <div {...props}>
      <Accordion label="Informations générales">
        <Input name="degré jours unifié spécifique chaud" label="degré jours unifié spécifique chaud" iconId="fr-icon-temp-cold-fill" />
        <Input name="degré jours unifié spécifique froid" label="degré jours unifié spécifique froid" iconId="fr-icon-temp-cold-fill" />
        <Input name="température de référence chaud" label="température de référence chaud" iconId="fr-icon-temp-cold-fill" />
        <Input name="augmenter la température de chauffe" label="augmenter la température de chauffe" iconId="fr-icon-temp-cold-fill" />

        <Select name="zone climatique" label="Zone climatique" />
        <Select name="sous zone climatique" label="Sous-zone climatique" />
      </Accordion>

      <Accordion label="Choix du bâtiment">
        <RadioInput name="type de bâtiment" small orientation="horizontal" />
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
            <Input
              name="nombre de logement dans l'immeuble concerné"
              label="nombre de logement dans l'immeuble concerné"
              nativeInputProps={{
                inputMode: 'numeric',
                maxLength: 5,
                type: 'number',
              }}
            />
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
          <Input
            name="Nombre d'habitants moyen par appartement"
            label="Nombre d'habitants moyen par appartement"
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 2,
              type: 'number',
            }}
          />
        )}
        <RadioInput name="Production eau chaude sanitaire" label="Production eau chaude sanitaire" small orientation="horizontal" />

        {productionECS && <Select name="type de production ECS" label="type de production ECS" />}
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
        <Input name="consommation spécifique chauffage" label="consommation spécifique chauffage" />
        <Input name="consommation spécifique ECS" label="consommation spécifique ECS" />
        <Input name="consommation spécifique climatisation" label="consommation spécifique climatisation par habitant" />
        <Input name="besoins chauffage par appartement" label="besoins chauffage par appartement" placeholderPrecision={2} />
        <Input name="besoins eau chaude sanitaire par appartement" label="besoins eau chaude sanitaire par appartement" />
        <Input name="besoins en climatisation par appartement" label="besoins en climatisation par appartement" />
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

      <Accordion label="Calcul ECS">
        <Accordion label="Chauffe-eau électrique à accumulation">
          <Input name="ratios . CHAUF EAU ELEC Rendement stockage ballon" label="Rendement stockage ballon" />
          <Input name="ratios . CHAUF EAU ELEC Durée de vie" label="Durée de vie" />
        </Accordion>
        <Accordion label="Chauffe-eau solaire avec appoint électrique">
          <Input name="ratios . CHAUF EAU SOLAIRE Rendement stockage ballon" label="Rendement stockage ballon" />
          <Input name="ratios . CHAUF EAU SOLAIRE Durée de vie" label="Durée de vie" />
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

      <Accordion label="Investissement">
        <Input
          name="ratios économiques . Investissement x Pose et mise en place de l'installation"
          label="Pose et mise en place de l'installation"
        />
        <Input name="ratios économiques . Investissement x TVA" label="TVA" />

        <Input name="ratios économiques . Chauffe-eau x électrique à accumulation" label="Chauffe-eau x électrique à accumulation" />
        <Input name="ratios économiques . Chauffe-eau x solaire" label="Chauffe-eau x solaire" />
        <Input name="ratios économiques . Chauffe-eau x solaire prix panneaux" label="Chauffe-eau x solaire prix panneaux" />

        <Input name="ratios économiques . Amortissement x Taux actualisation" label="Taux actualisation" />
      </Accordion>

      <Accordion label="Combustibles (P1)">
        <Accordion label="Gaz">
          <Input
            name="Paramètres économiques . Gaz x Puissance souscrite pour calcul installation collective ou tertiaire"
            label="Puissance souscrite pour calcul installation collective ou tertiaire"
          />
          <Input
            name="Paramètres économiques . Gaz x Abonnement x Part Fixe TTC collectif ou tertiaire"
            label="Abonnement x Part Fixe TTC collectif ou tertiaire"
          />
          <Input
            name="Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel"
            label="Abonnement x Part Fixe TTC individuel"
          />
          <Input
            name="Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel x Coût distribution HT"
            label="Abonnement x Part Fixe TTC individuel x Coût distribution HT"
          />
          <Input
            name="Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel x Coût commerciaux hors CEE HT"
            label="Abonnement x Part Fixe TTC individuel x Coût commerciaux hors CEE HT"
          />
          <Input name="Paramètres économiques . Gaz x Consommation x Part Variable TTC" label="Consommation x Part Variable TTC" />
          <Input name="Paramètres économiques . Gaz x Coût de la molécule HT" label="Coût de la molécule HT" />
          <Input name="Paramètres économiques . Gaz x Coût de transport HT" label="Coût de transport HT" />
          <Input name="Paramètres économiques . Gaz x Coût distribution HT" label="Coût distribution HT" />
          <Input name="Paramètres économiques . Gaz x Coût des CEE HT" label="Coût des CEE HT" />
          <Input
            name="Paramètres économiques . Gaz x Taxe x Part fixe x Contribution tarifaire d'acheminement CTA"
            label="Taxe x Part fixe x Contribution tarifaire d'acheminement CTA"
          />
          <Input name="Paramètres économiques . Gaz x Taxe x Part fixe x TVA" label="Taxe x Part fixe x TVA" />
          <Input
            name="Paramètres économiques . Gaz x Taxe x Part variable x Taxe intérieure de consommation sur le gaz naturel TICGN"
            label="Taxe x Part variable x Taxe intérieure de consommation sur le gaz naturel TICGN"
          />
          <Input name="Paramètres économiques . Gaz x Taxe x Part variable x TVA" label="Taxe x Part variable x TVA" />
        </Accordion>
        <Accordion label="Électricité">
          <Select name="Paramètres économiques . Electricité x Option tarifaire" label="Option tarifaire" />
          <Input name="Paramètres économiques . Electricité x Puissance souscrite indiv" label="Puissance souscrite indiv" />
          <Input name="Paramètres économiques . Electricité x Puissance souscrite coll" label="Puissance souscrite coll" />
          <Input name="Paramètres économiques . Electricité x Abonnement Part Fixe indiv" label="Abonnement Part Fixe indiv" />
          <Input name="Paramètres économiques . Electricité x Abonnement Part Fixe coll" label="Abonnement Part Fixe coll" />
          <Input
            name="Paramètres économiques . Electricité x Consommation Part variable en heure pleine"
            label="Consommation Part variable en heure pleine"
          />
          <Input
            name="Paramètres économiques . Electricité x Consommation Part variable en heure creuse"
            label="Consommation Part variable en heure creuse"
          />
          <Input
            name="ratios économiques . Coût des combustibles x Electricité . Heure pleine x Heure creuse . Part de la consommation en HP"
            label="Part de la consommation en HP"
          />
          <Input
            name="ratios économiques . Coût des combustibles x Electricité . Heure pleine x Heure creuse . Part de la consommation en HC"
            label="Part de la consommation en HC"
            disabled
          />
          <Input name="Paramètres économiques . Electricité x Taxe . Part Fixe x CTA" label="Part Fixe x CTA" />
          <Input name="Paramètres économiques . Electricité x Taxe . Part Fixe x TVA" label="Part Fixe x TVA" />
          <Input
            name="Paramètres économiques . Electricité x Taxe . Part Variable x Accise sur l'électricité ex TIPCSE CSPE"
            label="Part Variable x Accise sur l'électricité ex TIPCSE CSPE"
          />
          <Input name="Paramètres économiques . Electricité x Taxe . Part Variable x TVA" label="Part variable - TVA" />
        </Accordion>
        <Accordion label="Granulés">
          <Select name="Paramètres économiques . Granulés . Type de conditionnement" label="Type de conditionnement" />
          <Input name="Paramètres économiques . Granulés . Prix pour les granulés" label="Prix pour les granulés" />
          <Input name="Paramètres économiques . Granulés . TVA" label="TVA" />
        </Accordion>
        <Accordion label="Fioul">
          <Input name="Paramètres économiques . Fioul . Prix livraison incluse" label="Prix livraison incluse" />
          <Input name="Paramètres économiques . Fioul . TVA" label="TVA" />
          <Input name="Paramètres économiques . Fioul . TICPE" label="TICPE" />
        </Accordion>
        <Accordion label="Réseaux de chaleur RCU">
          <Input name="Paramètres économiques . Réseaux chaleur . Coût" label="Coût" />
          <Input name="Paramètres économiques . Réseaux chaleur . Part fixe" label="Part fixe" />
          <Input name="Paramètres économiques . Réseaux chaleur . Part variable" label="Part variable" disabled />
        </Accordion>
        <Accordion label="Réseaux de froid RFU">
          <Input name="Paramètres économiques . Réseaux froid . Coût" label="Coût" />
          <Input name="Paramètres économiques . Réseaux froid . Part fixe" label="Part fixe" />
          <Input name="Paramètres économiques . Réseaux froid . Part variable" label="Part variable" disabled />
        </Accordion>
      </Accordion>

      <Accordion label="Petit entretien (P2)">
        <Input name="Paramètres économiques . Petit entretien P2 . TVA" label="TVA" />
        <Input name="Paramètres économiques . Petit entretien P2 . RCU" label="RCU" />
        <Input name="Paramètres économiques . Petit entretien P2 . RFU" label="RFU" />
        <Input name="Paramètres économiques . Petit entretien P2 . Poêle à granulés indiv" label="Poêle à granulés indiv" />
        <Input name="Paramètres économiques . Petit entretien P2 . Chaudière à granulés coll" label="Chaudière à granulés coll" />
        <Input name="Paramètres économiques . Petit entretien P2 . Gaz indiv avec cond" label="Gaz indiv avec cond" />
        <Input name="Paramètres économiques . Petit entretien P2 . Gaz indiv sans cond" label="Gaz indiv sans cond" />
        <Input name="Paramètres économiques . Petit entretien P2 . Gaz coll avec cond" label="Gaz coll avec cond" />
        <Input name="Paramètres économiques . Petit entretien P2 . Gaz coll sans cond" label="Gaz coll sans cond" />
        <Input name="Paramètres économiques . Petit entretien P2 . Fioul indiv" label="Fioul indiv" />
        <Input name="Paramètres économiques . Petit entretien P2 . Fioul coll" label="Fioul coll" />
        <Input name="Paramètres économiques . Petit entretien P2 . PAC air-air" label="PAC air-air" />
        <Input name="Paramètres économiques . Petit entretien P2 . PAC eau-eau" label="PAC eau-eau" />
        <Input name="Paramètres économiques . Petit entretien P2 . PAC air-eau" label="PAC air-eau" />
        <Input name="Paramètres économiques . Petit entretien P2 . Radiateur électrique" label="Radiateur électrique" />
        <Input
          name="Paramètres économiques . Petit entretien P2 . Chauffe-eau électrique à accumulation"
          label="Chauffe-eau électrique à accumulation"
        />
        <Input name="Paramètres économiques . Petit entretien P2 . Chauffe-eau solaire" label="Chauffe-eau solaire" />
      </Accordion>

      <Accordion label="Gros entretien (P3)">
        <Input name="Paramètres économiques . Gros entretien P3 . TVA" label="TVA" />
        <Input name="Paramètres économiques . Gros entretien P3 . RCU" label="RCU" />
        <Input name="Paramètres économiques . Gros entretien P3 . RFU" label="RFU" />
        <Input name="Paramètres économiques . Gros entretien P3 . Poêle à granulés indiv" label="Poêle à granulés indiv" />
        <Input name="Paramètres économiques . Gros entretien P3 . Chaudière à granulés coll" label="Chaudière à granulés coll" />
        <Input name="Paramètres économiques . Gros entretien P3 . Gaz indiv avec cond" label="Gaz indiv avec cond" />
        <Input name="Paramètres économiques . Gros entretien P3 . Gaz indiv sans cond" label="Gaz indiv sans cond" />
        <Input name="Paramètres économiques . Gros entretien P3 . Gaz coll avec cond" label="Gaz coll avec cond" />
        <Input name="Paramètres économiques . Gros entretien P3 . Gaz coll sans cond" label="Gaz coll sans cond" />
        <Input name="Paramètres économiques . Gros entretien P3 . Fioul indiv" label="Fioul indiv" />
        <Input name="Paramètres économiques . Gros entretien P3 . Fioul coll" label="Fioul coll" />
        <Input name="Paramètres économiques . Gros entretien P3 . PAC air-air" label="PAC air-air" />
        <Input name="Paramètres économiques . Gros entretien P3 . PAC eau-eau" label="PAC eau-eau" />
        <Input name="Paramètres économiques . Gros entretien P3 . PAC air-eau" label="PAC air-eau" />
        <Input name="Paramètres économiques . Gros entretien P3 . Radiateur électrique" label="Radiateur électrique" />
        <Input
          name="Paramètres économiques . Gros entretien P3 . Chauffe-eau électrique à accumulation"
          label="Chauffe-eau électrique à accumulation"
        />
        <Input name="Paramètres économiques . Gros entretien P3 . Chauffe-eau solaire" label="Chauffe-eau solaire" />
      </Accordion>

      <Accordion label="Amortissement (P4)">
        <Input name="ratios économiques . Amortissement x Taux actualisation" label="Taux actualisation" />
      </Accordion>

      <Accordion label="Aides">
        <RadioInput
          name="Paramètres économiques . Aides . Éligibilité x Prise en compte des aides"
          label="Prise en compte des aides"
          small
          orientation="horizontal"
        />
        <RadioInput
          name="Paramètres économiques . Aides . Éligibilité x Je suis un particulier"
          label="Je suis un particulier"
          small
          orientation="horizontal"
        />
        <Select
          name="Paramètres économiques . Aides . Éligibilité x Ressources du ménage"
          label="Ressources du ménage"
          withDefaultOption={false}
        />
        <RadioInput
          name="Paramètres économiques . Aides . Éligibilité x Je dispose actuellement d'une chaudière gaz ou fioul"
          label="Je dispose actuellement d'une chaudière gaz ou fioul"
          small
          orientation="horizontal"
        />
        <Select name="Paramètres économiques . Aides . Aides x Éligible Ma prime renov'" label="Éligible Ma prime renov'" />
        <Select name="Paramètres économiques . Aides . Aides x Éligible Coup de pouce chauffage" label="Éligible Coup de pouce chauffage" />
        <Select name="Paramètres économiques . Aides . Aides x Éligible CEE" label="Éligible CEE" />
        <Input name="Paramètres économiques . Aides . Valeur CEE" label="Valeur CEE" />
      </Accordion>
    </div>
  );
};

export default TechnicienBatimentForm;
