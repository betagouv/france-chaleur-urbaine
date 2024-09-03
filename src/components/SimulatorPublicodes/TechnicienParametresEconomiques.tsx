import React from 'react';

import Input from '@components/form/publicodes/Input';

import CheckableAccordion from './CheckableAccordion';
import { type SimulatorEngine } from './useSimulatorEngine';

type TechnicienBatimentFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const TechnicienBatimentForm: React.FC<TechnicienBatimentFormProps> = ({ children, className, engine, ...props }) => {
  return (
    <div {...props}>
      <CheckableAccordion label="Réseaux de chaleur">
        <Input name="ratios . RCU Rendement sous station chauffage" label="Rendement sous-station chauffage" />
        <Input name="ratios . RCU Rendement sous station ECS" label="Rendement sous station ECS" />
        <Input name="ratios . RCU Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
        <Input name="ratios . RCU Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
        <Input name="ratios . RCU Durée avant renouvellement" label="Durée avant renouvellement" />

        <Input
          name="Installation x Réseaux de chaleur x Collectif . gamme de puissance existante"
          label="Gamme de puissance"
          placeholderPrecision={2}
        />

        <Input name="Investissement x frais de raccordement au réseaux x RCU" label="Frais de raccordement au réseaux" />
      </CheckableAccordion>
      <CheckableAccordion label="Réseaux de froid">
        <Input name="ratios . RFU Rendement sous station" label="Rendement sous station" />
        <Input name="ratios . RFU Conso auxiliaire" label="Consommation auxiliaire" />
        <Input name="ratios . RFU Durée de vie" label="Durée de vie" />

        <Input
          name="Installation x Réseaux de froid x Collectif . gamme de puissance existante"
          label="Gamme de puissance"
          placeholderPrecision={2}
        />

        <Input name="Investissement x frais de raccordement au réseaux x RFU" label="Frais de raccordement au réseaux" />
      </CheckableAccordion>

      <CheckableAccordion label="Poêle à granulés individuel">
        <Input name="ratios . GRA POELE Rendement poêle chauffage" label="Rendement poêle chauffage" />
        <Input name="ratios . GRA POELE Conso combustible" label="Consommation combustible" placeholderPrecision={4} />
        <Input name="ratios . GRA POELE Durée de vie" label="Durée de vie" />

        <Input name="Installation x Poêle à granulés indiv x Individuel . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="Investissement x Poêle à granulés indiv" label="Coût investissement" />
      </CheckableAccordion>
      <CheckableAccordion label="Chaudière à granulés collective">
        <Input name="ratios . GRA CHAUD Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
        <Input name="ratios . GRA CHAUD Conso combustible" label="Consommation combustible" placeholderPrecision={4} />
        <Input name="ratios . GRA CHAUD Conso auxiliaire" label="Consommation auxiliaire" />
        <Input name="ratios . GRA CHAUD Durée de vie" label="Durée de vie" />

        <Input name="Installation x Chaudière à granulés coll x Collectif . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="Investissement x Chaudière à granulés coll" label="Coût investissement" />
      </CheckableAccordion>

      <CheckableAccordion label="Gaz individuel avec condensation">
        <Input name="ratios . GAZ IND COND Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
        <Input name="ratios . GAZ IND COND Rendement chaudière ECS" label="Rendement chaudière ECS" />
        <Input name="ratios . GAZ IND COND Conso combustible" label="Consommation combustible" />
        <Input name="ratios . GAZ IND COND Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
        <Input name="ratios . GAZ IND COND Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
        <Input name="ratios . GAZ IND COND Durée de vie" label="Durée de vie" />

        <Input name="Installation x Gaz indiv avec cond x Individuel . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . Gaz x indiv avec cond" label="Coût investissement" />
      </CheckableAccordion>
      <CheckableAccordion label="Gaz individuel sans condensation">
        <Input name="ratios . GAZ IND SCOND Rendement chaudière" label="Rendement chaudière" />
        <Input name="ratios . GAZ IND SCOND Conso combustible" label="Consommation combustible" />
        <Input name="ratios . GAZ IND SCOND Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
        <Input name="ratios . GAZ IND SCOND Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
        <Input name="ratios . GAZ IND SCOND Durée de vie" label="Durée de vie" />

        <Input name="Installation x Gaz indiv sans cond x Individuel . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . Gaz x indiv sans cond" label="Coût investissement" />
      </CheckableAccordion>
      <CheckableAccordion label="Gaz collectif avec condensation">
        <Input name="ratios . GAZ COLL COND Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
        <Input name="ratios . GAZ COLL COND Rendement chaudière ECS" label="Rendement chaudière ECS" />
        <Input name="ratios . GAZ COLL COND Conso combustible" label="Consommation combustible" />
        <Input name="ratios . GAZ COLL COND Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
        <Input name="ratios . GAZ COLL COND Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
        <Input name="ratios . GAZ COLL COND Durée de vie" label="Durée de vie" />

        <Input name="Installation x Gaz coll avec cond x Collectif . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . Gaz x coll avec cond" label="Coût investissement" />
      </CheckableAccordion>
      <CheckableAccordion label="Gaz collectif sans condensation">
        <Input name="ratios . GAZ COLL SCOND Rendement chaudière" label="Rendement chaudière" />
        <Input name="ratios . GAZ COLL SCOND Conso combustible" label="Consommation combustible" />
        <Input name="ratios . GAZ COLL SCOND Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
        <Input name="ratios . GAZ COLL SCOND Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
        <Input name="ratios . GAZ COLL SCOND Durée de vie" label="Durée de vie" />

        <Input name="Installation x Gaz coll sans cond x Collectif . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . Gaz x coll sans cond" label="Coût investissement" />
      </CheckableAccordion>

      <CheckableAccordion label="Fioul individuel">
        <Input name="ratios . FIOUL IND Rendement chaudière" label="Rendement chaudière" />
        <Input name="ratios . FIOUL IND Conso combustible" label="Consommation combustible" />
        <Input name="ratios . FIOUL IND Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
        <Input name="ratios . FIOUL IND Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
        <Input name="ratios . FIOUL IND Durée de vie" label="Durée de vie" />

        <Input
          name="Installation x Fioul indiv x Individuel . gamme de puissance existante"
          label="Puissance totale"
          placeholderPrecision={4}
        />

        <Input name="ratios économiques . Fioul x indiv" label="Coût investissement" />
      </CheckableAccordion>
      <CheckableAccordion label="Fioul collectif">
        <Input name="ratios . FIOUL COLL Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
        <Input name="ratios . FIOUL COLL Rendement chaudière ECS" label="Rendement chaudière ECS" />
        <Input name="ratios . FIOUL COLL Conso combustible" label="Consommation combustible" />
        <Input name="ratios . FIOUL COLL Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
        <Input name="ratios . FIOUL COLL Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
        <Input name="ratios . FIOUL COLL Durée de vie" label="Durée de vie" />

        <Input
          name="Installation x Fioul coll x Collectif . gamme de puissance existante"
          label="Puissance totale"
          placeholderPrecision={4}
        />

        <Input name="ratios économiques . Fioul x collectif" label="Coût investissement" />
      </CheckableAccordion>

      <CheckableAccordion label="PAC air/air individuelle">
        <Input name="ratios . PAC AIR AIR SCOP indiv" label="SCOP" />
        <Input name="ratios . PAC AIR AIR SEER indiv" label="SEER" />
        <Input name="ratios . PAC AIR AIR Durée de vie indiv" label="Durée de vie" />

        <Input name="Installation x PAC air-air x Individuel . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . PAC x air-air réversible x Individuel" label="Coût investissement" />
      </CheckableAccordion>
      <CheckableAccordion label="PAC air/air collective">
        <Input name="ratios . PAC AIR AIR SCOP coll" label="SCOP" />
        <Input name="ratios . PAC AIR AIR SEER coll" label="SEER" />
        <Input name="ratios . PAC AIR AIR Durée de vie coll" label="Durée de vie" />

        <Input name="Installation x PAC air-air x Collectif . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . PAC x air-air réversible x Collectif" label="Coût investissement" />
      </CheckableAccordion>

      <CheckableAccordion label="PAC eau/eau individuelle">
        <Input name="ratios . PAC EAU EAU SCOP indiv capteurs horizontaux" label="SCOP" />
        <Input name="ratios . PAC EAU EAU Durée de vie" label="Durée de vie" />

        <Input name="Installation x PAC eau-eau x Individuel . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . PAC x eau-eau non réversible x Individuel" label="Coût investissement" />
      </CheckableAccordion>
      <CheckableAccordion label="PAC eau/eau collective">
        <Input name="ratios . PAC EAU EAU SCOP coll champ de sondes" label="SCOP" />
        <Input name="ratios . PAC EAU EAU Durée de vie" label="Durée de vie" />
        {/* FIXME vérifier si même durée de vie que PAC eau/eau indiv */}
        {/* <Input name="ratios . PAC EAU EAU Durée de vie puits géothermiques" label="Durée de vie puits géothermiques" /> */}

        <Input name="Installation x PAC eau-eau x Collectif . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . PAC x eau-eau non réversible x Collectif" label="Coût investissement" />
        <Input name="ratios économiques . PAC x eau-eau non réversible . Coûts hors captage sous-sol" label="Coûts hors captage sous-sol" />
        <Input
          name="ratios économiques . PAC x eau-eau non réversible . Coûts captage sous-sol champs sur sonde"
          label="Coûts captage sous-sol champs sur sonde"
        />
      </CheckableAccordion>

      <CheckableAccordion label="PAC air/eau réversible individuelle">
        <Input name="ratios . PAC AIR EAU SCOP indiv" label="SCOP" />
        <Input name="ratios . PAC AIR EAU SEER indiv" label="SEER" />
        <Input name="ratios . PAC AIR EAU Durée de vie indiv" label="Durée de vie" />

        <Input name="Installation x PAC air-eau x Individuel . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . PAC x air-eau réversible x Individuel" label="Coût investissement" />
      </CheckableAccordion>
      <CheckableAccordion label="PAC air/eau réversible collective">
        <Input name="ratios . PAC AIR EAU SCOP coll" label="SCOP" />
        <Input name="ratios . PAC AIR EAU SEER coll" label="SEER" />
        <Input name="ratios . PAC AIR EAU Durée de vie coll" label="Durée de vie" />

        <Input name="Installation x PAC air-eau x Collectif . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . PAC x air-eau réversible x Collectif" label="Coût investissement" />
      </CheckableAccordion>

      <CheckableAccordion label="Radiateur électrique individuel">
        <Input name="ratios . RAD ELEC INDIV Rendement" label="Rendement" />
        <Input name="ratios . RAD ELEC INDIV Conso combustible" label="Consommation combustible" />
        <Input name="ratios . RAD ELEC INDIV Durée de vie" label="Durée de vie" />

        <Input name="Installation x Radiateur électrique x Individuel . gamme de puissance existante" label="Gamme de puissance" />

        <Input name="ratios économiques . Radiateur électrique x Individuel" label="Coût investissement" />
      </CheckableAccordion>
    </div>
  );
};

export default TechnicienBatimentForm;
