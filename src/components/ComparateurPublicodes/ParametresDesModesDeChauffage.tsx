import React from 'react';

import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';
import Select from '@components/form/publicodes/Select';
import { UrlStateAccordion as Accordion, UrlStateAccordion } from '@components/ui/Accordion';
import useArrayQueryState from '@hooks/useArrayQueryState';

import { Title } from './ComparateurPublicodes.style';
import { ModeDeChauffage } from './modes-de-chauffage';
import { type SimulatorEngine } from './useSimulatorEngine';

type ParametresDesModesDeChauffageFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const ParametresDesModesDeChauffageForm: React.FC<ParametresDesModesDeChauffageFormProps> = ({ children, className, engine, ...props }) => {
  const { has: hasModeDeChauffage } = useArrayQueryState<ModeDeChauffage>('modes-de-chauffage');

  const hasGaz =
    hasModeDeChauffage('Gaz à condensation individuel') ||
    hasModeDeChauffage('Gaz à condensation collectif') ||
    hasModeDeChauffage('Gaz sans condensation individuel') ||
    hasModeDeChauffage('Gaz sans condensation collectif');
  const hasFioul = hasModeDeChauffage('Fioul individuel') || hasModeDeChauffage('Fioul collectif');
  const hasGranules = hasModeDeChauffage('Chaudière à granulés collective') || hasModeDeChauffage('Poêle à granulés individuel');

  return (
    <div {...props}>
      <p>Les valeurs proposées sont des valeurs par défaut. Vous pouvez les modifier ci-dessous.</p>
      <Title>Paramètres économiques</Title>
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
        {hasModeDeChauffage('Réseaux de chaleur') && (
          <Accordion label="Réseaux de chaleur">
            <Input name="Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part abonnement" label="Tarification R2 (Part fixe)" />
            <Input
              name="Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part consommation"
              label="Tarification R1 (Part variable)"
            />
            <Input name="Paramètres économiques . Réseaux chaleur . Coût" label="Coût" />
            <Input name="Paramètres économiques . Réseaux chaleur . Part fixe" label="Part fixe" />
            <Input name="Paramètres économiques . Réseaux chaleur . Part variable" label="Part variable" disabled />
          </Accordion>
        )}
        {hasGaz && (
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
        )}
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
          <Input name="Paramètres économiques . Electricité x Taxe . Part Fixe x TVA" label="Part Fixe x TVA" />
          <Input
            name="Paramètres économiques . Electricité x Taxe . Part Variable x Accise sur l'électricité ex TIPCSE CSPE"
            label="Part Variable x Accise sur l'électricité ex TIPCSE CSPE"
          />
          <Input name="Paramètres économiques . Electricité x Taxe . Part Variable x TVA" label="Part variable - TVA" />
        </Accordion>
        {hasGranules && (
          <Accordion label="Granulés">
            <Select name="Paramètres économiques . Granulés . Type de conditionnement" label="Type de conditionnement" />
            <Input name="Paramètres économiques . Granulés . Prix pour les granulés" label="Prix pour les granulés" />
            <Input name="Paramètres économiques . Granulés . TVA" label="TVA" />
          </Accordion>
        )}
        {hasFioul && (
          <Accordion label="Fioul">
            <Input name="Paramètres économiques . Fioul . Prix livraison incluse" label="Prix livraison incluse" />
            <Input name="Paramètres économiques . Fioul . TVA" label="TVA" />
            <Input name="Paramètres économiques . Fioul . TICPE" label="TICPE" />
          </Accordion>
        )}
        {hasModeDeChauffage('Réseaux de froid') && (
          <Accordion label="Réseaux de froid">
            <Input name="Paramètres économiques . Réseaux froid . Coût" label="Coût" />
            <Input name="Paramètres économiques . Réseaux froid . Part fixe" label="Part fixe" />
            <Input name="Paramètres économiques . Réseaux froid . Part variable" label="Part variable" disabled />
          </Accordion>
        )}
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
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Select
          name="Paramètres économiques . Aides . Éligibilité x Ressources du ménage"
          label="Ressources du ménage"
          withDefaultOption={false}
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <RadioInput
          name="Paramètres économiques . Aides . Éligibilité x Je dispose actuellement d'une chaudière gaz ou fioul"
          label="Je dispose actuellement d'une chaudière gaz ou fioul"
          small
          orientation="horizontal"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Select
          name="Paramètres économiques . Aides . Aides x Éligible Ma prime renov'"
          label="Éligible Ma prime renov'"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Select
          name="Paramètres économiques . Aides . Aides x Éligible Coup de pouce chauffage"
          label="Éligible Coup de pouce chauffage"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Select
          name="Paramètres économiques . Aides . Aides x Éligible CEE"
          label="Éligible CEE"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Input
          name="Paramètres économiques . Aides . Valeur CEE"
          label="Valeur CEE"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
      </Accordion>

      <Title mt="4w">Paramètres techniques par mode de chauffage et de refroidissement</Title>

      {hasModeDeChauffage('Réseaux de chaleur') && (
        <UrlStateAccordion label="Réseaux de chaleur">
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
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Réseaux de froid') && (
        <UrlStateAccordion label="Réseaux de froid">
          <Input name="ratios . RFU Rendement sous station" label="Rendement sous station" />
          <Input name="ratios . RFU Conso auxiliaire" label="Consommation auxiliaire" />
          <Input name="ratios . RFU Durée de vie" label="Durée de vie" />

          <Input
            name="Installation x Réseaux de froid x Collectif . gamme de puissance existante"
            label="Gamme de puissance"
            placeholderPrecision={2}
          />

          <Input name="Investissement x frais de raccordement au réseaux x RFU" label="Frais de raccordement au réseaux" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Poêle à granulés individuel') && (
        <UrlStateAccordion label="Poêle à granulés individuel">
          <Input name="ratios . GRA POELE Rendement poêle chauffage" label="Rendement poêle chauffage" />
          <Input name="ratios . GRA POELE Conso combustible" label="Consommation combustible" placeholderPrecision={4} />
          <Input name="ratios . GRA POELE Durée de vie" label="Durée de vie" />

          <Input name="Installation x Poêle à granulés indiv x Individuel . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="Investissement x Poêle à granulés indiv" label="Coût investissement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Chaudière à granulés collective') && (
        <UrlStateAccordion label="Chaudière à granulés collective">
          <Input name="ratios . GRA CHAUD Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . GRA CHAUD Conso combustible" label="Consommation combustible" placeholderPrecision={4} />
          <Input name="ratios . GRA CHAUD Conso auxiliaire" label="Consommation auxiliaire" />
          <Input name="ratios . GRA CHAUD Durée de vie" label="Durée de vie" />

          <Input name="Installation x Chaudière à granulés coll x Collectif . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="Investissement x Chaudière à granulés coll" label="Coût investissement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Gaz à condensation individuel') && (
        <UrlStateAccordion label="Gaz à condensation individuel">
          <Input name="ratios . GAZ IND COND Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . GAZ IND COND Rendement chaudière ECS" label="Rendement chaudière ECS" />
          <Input name="ratios . GAZ IND COND Conso combustible" label="Consommation combustible" />
          <Input name="ratios . GAZ IND COND Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
          <Input name="ratios . GAZ IND COND Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
          <Input name="ratios . GAZ IND COND Durée de vie" label="Durée de vie" />

          <Input name="Installation x Gaz indiv avec cond x Individuel . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . Gaz x indiv avec cond" label="Coût investissement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Gaz sans condensation individuel') && (
        <UrlStateAccordion label="Gaz sans condensation individuel">
          <Input name="ratios . GAZ IND SCOND Rendement chaudière" label="Rendement chaudière" />
          <Input name="ratios . GAZ IND SCOND Conso combustible" label="Consommation combustible" />
          <Input name="ratios . GAZ IND SCOND Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
          <Input name="ratios . GAZ IND SCOND Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
          <Input name="ratios . GAZ IND SCOND Durée de vie" label="Durée de vie" />

          <Input name="Installation x Gaz indiv sans cond x Individuel . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . Gaz x indiv sans cond" label="Coût investissement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Gaz à condensation collectif') && (
        <UrlStateAccordion label="Gaz à condensation collectif">
          <Input name="ratios . GAZ COLL COND Rendement chaudière chauffage" label="Rendement chaudière chauffage" />
          <Input name="ratios . GAZ COLL COND Rendement chaudière ECS" label="Rendement chaudière ECS" />
          <Input name="ratios . GAZ COLL COND Conso combustible" label="Consommation combustible" />
          <Input name="ratios . GAZ COLL COND Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
          <Input name="ratios . GAZ COLL COND Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
          <Input name="ratios . GAZ COLL COND Durée de vie" label="Durée de vie" />

          <Input name="Installation x Gaz coll avec cond x Collectif . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . Gaz x coll avec cond" label="Coût investissement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Gaz sans condensation collectif') && (
        <UrlStateAccordion label="Gaz sans condensation collectif">
          <Input name="ratios . GAZ COLL SCOND Rendement chaudière" label="Rendement chaudière" />
          <Input name="ratios . GAZ COLL SCOND Conso combustible" label="Consommation combustible" />
          <Input name="ratios . GAZ COLL SCOND Conso auxiliaire chauffage" label="Consommation auxiliaire chauffage" />
          <Input name="ratios . GAZ COLL SCOND Conso auxiliaire ECS" label="Consommation auxiliaire ECS" />
          <Input name="ratios . GAZ COLL SCOND Durée de vie" label="Durée de vie" />

          <Input name="Installation x Gaz coll sans cond x Collectif . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . Gaz x coll sans cond" label="Coût investissement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Fioul individuel') && (
        <UrlStateAccordion label="Fioul individuel">
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
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Fioul collectif') && (
        <UrlStateAccordion label="Fioul collectif">
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
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('PAC air/air individuelle') && (
        <UrlStateAccordion label="PAC air/air individuelle">
          <Input name="ratios . PAC AIR AIR SCOP indiv" label="SCOP" />
          <Input name="ratios . PAC AIR AIR SEER indiv" label="SEER" />
          <Input name="ratios . PAC AIR AIR Durée de vie indiv" label="Durée de vie" />

          <Input name="Installation x PAC air-air x Individuel . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . PAC x air-air réversible x Individuel" label="Coût investissement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('PAC air/air collective') && (
        <UrlStateAccordion label="PAC air/air collective">
          <Input name="ratios . PAC AIR AIR SCOP coll" label="SCOP" />
          <Input name="ratios . PAC AIR AIR SEER coll" label="SEER" />
          <Input name="ratios . PAC AIR AIR Durée de vie coll" label="Durée de vie" />

          <Input name="Installation x PAC air-air x Collectif . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . PAC x air-air réversible x Collectif" label="Coût investissement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('PAC eau/eau individuelle') && (
        <UrlStateAccordion label="PAC eau/eau individuelle">
          <Input name="ratios . PAC EAU EAU SCOP indiv capteurs horizontaux" label="SCOP" />
          <Input name="ratios . PAC EAU EAU Durée de vie" label="Durée de vie" />

          <Input name="Installation x PAC eau-eau x Individuel . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . PAC x eau-eau non réversible x Individuel" label="Coût investissement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('PAC eau/eau collective') && (
        <UrlStateAccordion label="PAC eau/eau collective">
          <Input name="ratios . PAC EAU EAU SCOP coll champ de sondes" label="SCOP" />
          <Input name="ratios . PAC EAU EAU Durée de vie" label="Durée de vie" />
          {/* FIXME vérifier si même durée de vie que PAC eau/eau indiv */}
          {/* <Input name="ratios . PAC EAU EAU Durée de vie puits géothermiques" label="Durée de vie puits géothermiques" /> */}

          <Input name="Installation x PAC eau-eau x Collectif . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . PAC x eau-eau non réversible x Collectif" label="Coût investissement" />
          <Input
            name="ratios économiques . PAC x eau-eau non réversible . Coûts hors captage sous-sol"
            label="Coûts hors captage sous-sol"
          />
          <Input
            name="ratios économiques . PAC x eau-eau non réversible . Coûts captage sous-sol champs sur sonde"
            label="Coûts captage sous-sol champs sur sonde"
          />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('PAC air/eau individuelle') && (
        <UrlStateAccordion label="PAC air/eau individuelle">
          <Input name="ratios . PAC AIR EAU SCOP indiv" label="SCOP" />
          <Input name="ratios . PAC AIR EAU SEER indiv" label="SEER" />
          <Input name="ratios . PAC AIR EAU Durée de vie indiv" label="Durée de vie" />

          <Input name="Installation x PAC air-eau x Individuel . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . PAC x air-eau réversible x Individuel" label="Coût investissement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('PAC air/eau collective') && (
        <UrlStateAccordion label="PAC air/eau collective">
          <Input name="ratios . PAC AIR EAU SCOP coll" label="SCOP" />
          <Input name="ratios . PAC AIR EAU SEER coll" label="SEER" />
          <Input name="ratios . PAC AIR EAU Durée de vie coll" label="Durée de vie" />

          <Input name="Installation x PAC air-eau x Collectif . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . PAC x air-eau réversible x Collectif" label="Coût investissement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Radiateur électrique individuel') && (
        <UrlStateAccordion label="Radiateur électrique individuel">
          <Input name="ratios . RAD ELEC INDIV Rendement" label="Rendement" />
          <Input name="ratios . RAD ELEC INDIV Conso combustible" label="Consommation combustible" />
          <Input name="ratios . RAD ELEC INDIV Durée de vie" label="Durée de vie" />

          <Input name="Installation x Radiateur électrique x Individuel . gamme de puissance existante" label="Gamme de puissance" />

          <Input name="ratios économiques . Radiateur électrique x Individuel x investissement total" label="Coût investissement" />
        </UrlStateAccordion>
      )}
    </div>
  );
};

export default ParametresDesModesDeChauffageForm;
