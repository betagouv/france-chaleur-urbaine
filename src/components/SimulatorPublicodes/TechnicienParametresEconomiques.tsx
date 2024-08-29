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
  return (
    <div {...props}>
      <Select name="zone climatique" label="Zone climatique" />
      <Select name="sous zone climatique" label="Sous-zone climatique" />

      <Accordion label="Puissance totale des installations">
        <Input
          name="Installation x Réseaux de chaleur x Collectif . gamme de puissance existante"
          label="Réseaux de chaleur"
          placeholderPrecision={2}
        />
        <Input
          name="Installation x Réseaux de froid x Collectif . gamme de puissance existante"
          label="Réseaux de froid"
          placeholderPrecision={2}
        />
        <Input name="Installation x Poêle à granulés indiv x Individuel . gamme de puissance existante" label="Poêle à granulés indiv" />
        <Input
          name="Installation x Chaudière à granulés coll x Collectif . gamme de puissance existante"
          label="Chaudière à granulés coll"
        />
        <Input name="Installation x Gaz indiv avec cond x Individuel . gamme de puissance existante" label="Gaz indiv avec cond" />
        <Input name="Installation x Gaz indiv sans cond x Individuel . gamme de puissance existante" label="Gaz indiv sans cond" />
        <Input name="Installation x Gaz coll avec cond x Collectif . gamme de puissance existante" label="Gaz coll avec cond" />
        <Input name="Installation x Gaz coll sans cond x Collectif . gamme de puissance existante" label="Gaz coll sans cond" />
        <Input name="Installation x Fioul indiv x Individuel . gamme de puissance existante" label="Fioul indiv" placeholderPrecision={4} />
        <Input name="Installation x Fioul coll x Collectif . gamme de puissance existante" label="Fioul coll" placeholderPrecision={4} />
        <Input name="Installation x PAC air-air x Individuel . gamme de puissance existante" label="PAC air-air" />
        <Input name="Installation x PAC eau-eau x Collectif . gamme de puissance existante" label="PAC eau-eau" />
        <Input name="Installation x PAC air-eau x Collectif . gamme de puissance existante" label="PAC air-eau" />
        <Input name="Installation x Radiateur électrique x Individuel . gamme de puissance existante" label="Radiateur électrique" />
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
        <Input name="Investissement x frais de raccordement au réseaux x RCU" label="frais de raccordement au réseaux x RCU" />
        <Input name="Investissement x frais de raccordement au réseaux x RFU" label="frais de raccordement au réseaux x RFU" />
        <Input name="Investissement x Poêle à granulés indiv" label="Poêle à granulés indiv" />
        <Input name="Investissement x Chaudière à granulés coll" label="Chaudière à granulés coll" />
        <Input name="ratios économiques . Gaz x indiv avec cond" label="Gaz x indiv avec cond" />
        <Input name="ratios économiques . Gaz x indiv sans cond" label="Gaz x indiv sans cond" />
        <Input name="ratios économiques . Gaz x coll avec cond" label="Gaz x coll avec cond" />
        <Input name="ratios économiques . Gaz x coll sans cond" label="Gaz x coll sans cond" />
        <Input name="ratios économiques . Fioul x indiv" label="Fioul x indiv" />
        <Input name="ratios économiques . Fioul x collectif" label="Fioul x collectif" />
        <Input name="ratios économiques . PAC x air-air réversible x Individuel" label="PAC x air-air réversible x Individuel" />
        <Input name="ratios économiques . PAC x eau-eau non réversible x Individuel" label="PAC x eau-eau non réversible x Individuel" />
        <Input name="ratios économiques . PAC x air-eau réversible x Individuel" label="PAC x air-eau réversible x Individuel" />
        <Input name="ratios économiques . PAC x air-air réversible x Collectif" label="PAC x air-air réversible x Collectif" />
        <Input name="ratios économiques . PAC x eau-eau non réversible x Collectif" label="PAC x eau-eau non réversible x Collectif" />
        <Input name="ratios économiques . PAC x eau-eau non réversible . Coûts hors captage sous-sol" label="Coûts hors captage sous-sol" />
        <Input
          name="ratios économiques . PAC x eau-eau non réversible . Coûts captage sous-sol champs sur sonde"
          label="Coûts captage sous-sol champs sur sonde"
        />
        <Input name="ratios économiques . PAC x air-eau réversible x Collectif" label="PAC x air-eau réversible x Collectif" />
        <Input name="ratios économiques . Radiateur électrique x Individuel" label="Radiateur électrique x Individuel" />
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
        <Select name="Paramètres économiques . Aides . Éligibilité x Ressources du ménage" label="Ressources du ménage" />
        <RadioInput
          name="Paramètres économiques . Aides . Éligibilité x Je dispose actuellement d'une chaudière gaz ou fioul"
          label="Je dispose actuellement d'une chaudière gaz ou fioul"
          small
          orientation="horizontal"
        />
        <Input name="Paramètres économiques . Aides . Aides x Éligible Ma prime renov'" label="Éligible Ma prime renov'" />
        <Input name="Paramètres économiques . Aides . Aides x Éligible Coup de pouce chauffage" label="Éligible Coup de pouce chauffage" />
        <Input name="Paramètres économiques . Aides . Aides x Éligible CEE" label="Éligible CEE" />
        <Input name="Paramètres économiques . Aides . Valeur CEE" label="Valeur CEE" />
      </Accordion>
    </div>
  );
};

export default TechnicienBatimentForm;
