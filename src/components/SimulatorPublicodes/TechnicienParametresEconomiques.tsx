import Accordion from '@codegouvfr/react-dsfr/Accordion';
import React from 'react';

import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';
import Select from '@components/form/publicodes/Select';

import { type SimulatorEngine } from './useSimulatorEngine';

type TechnicienBatimentFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const TechnicienBatimentForm: React.FC<TechnicienBatimentFormProps> = ({ children, className, engine, ...props }) => {
  return (
    <div {...props}>
      <Input name="zone climatique" label="Zone climatique" />
      <Input name="sous zone climatique" label="Sous-zone climatique" />

      <Accordion label="Puissance totale des installations">
        <Input name="Installation x Réseaux de chaleur x Collectif . gamme de puissance existante" label="Réseaux de chaleur" />
        <Input name="Installation x Réseaux de froid x Collectif . gamme de puissance existante" label="Réseaux de froid" />
        <Input name="Installation x Poêle à granulés indiv x Individuel . gamme de puissance existante" label="Poêle à granulés indiv" />
        <Input
          name="Installation x Chaudière à granulés coll x Collectif . gamme de puissance existante"
          label="Chaudière à granulés coll"
        />
        <Input name="Installation x Gaz indiv avec cond x Individuel . gamme de puissance existante" label="Gaz indiv avec cond" />
        <Input name="Installation x Gaz indiv sans cond x Individuel . gamme de puissance existante" label="Gaz indiv sans cond" />
        <Input name="Installation x Gaz coll avec cond x Collectif . gamme de puissance existante" label="Gaz coll avec cond" />
        <Input name="Installation x Gaz coll sans cond x Collectif . gamme de puissance existante" label="Gaz coll sans cond" />
        <Input name="Installation x Fioul indiv x Individuel . gamme de puissance existante" label="Fioul indiv" />
        <Input name="Installation x Fioul coll x Collectif . gamme de puissance existante" label="Fioul coll" />
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
        <Input name="ratios économiques . Amortissement x Taux actualisation" label="Taux actualisation" />
        {/* TODO compléter */}
      </Accordion>

      <Accordion label="Combustibles (P1)">
        {/* TODO compléter */}
        <Accordion label="Réseaux de chaleur RCU">
          <Input name="Paramètres économiques . Réseaux chaleur . Coût" label="Coût" />
          <Input name="Paramètres économiques . Réseaux chaleur . Part fixe" label="Part fixe" />
          <Input name="Paramètres économiques . Réseaux chaleur . Part variable" label="Part variable" />
        </Accordion>
        <Accordion label="Réseaux de froid RFU">
          <Input name="Paramètres économiques . Réseaux froid . Coût" label="Coût" />
          <Input name="Paramètres économiques . Réseaux froid . Part fixe" label="Part fixe" />
          <Input name="Paramètres économiques . Réseaux froid . Part variable" label="Part variable" />
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
