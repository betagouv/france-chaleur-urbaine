import React from 'react';

import Input from '@/components/form/publicodes/Input';
import RadioInput from '@/components/form/publicodes/Radio';
import Select from '@/components/form/publicodes/Select';
import { UrlStateAccordion, UrlStateAccordion as Accordion } from '@/components/ui/Accordion';
import useArrayQueryState from '@/hooks/useArrayQueryState';

import { Title } from './ComparateurPublicodes.style';
import { type ModeDeChauffage } from './mappings';
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
  const utiliseReseauDeFroid =
    engine.getField('type de production de froid') === 'Réseau de froid' && engine.getField('Inclure la climatisation');

  return (
    <div {...props}>
      <p>Les valeurs proposées sont des valeurs par défaut. Vous pouvez les modifier ci-dessous.</p>
      <Title>Paramètres économiques</Title>
      <Accordion label="Investissement">
        <Input name="ratios économiques . Investissement x Pose et mise en place de l'installation" placeholderPrecision={0} />
        <Input name="ratios économiques . Investissement x TVA" />

        <Input name="ratios économiques . Chauffe-eau x électrique à accumulation x coût investissement" placeholderPrecision={0} />
        <Input name="ratios économiques . Chauffe-eau x solaire x coût investissement" />
        <Input name="ratios économiques . Chauffe-eau x panneaux solaire thermique x coût investissement" placeholderPrecision={0} />

        <Input name="ratios économiques . Amortissement x Taux actualisation" />
      </Accordion>

      <Accordion label="Combustibles (P1)">
        {hasModeDeChauffage('Réseau de chaleur') && (
          <Accordion label="Réseau de chaleur">
            <Input name="Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part abonnement" placeholderPrecision={3} />
            <Input name="Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part consommation" placeholderPrecision={3} />
            <Input name="Paramètres économiques . Réseaux chaleur . Coût" placeholderPrecision={3} />
            <Input name="Paramètres économiques . Réseaux chaleur . Part fixe" placeholderPrecision={2} />
            <Input name="Paramètres économiques . Réseaux chaleur . Part variable" disabled placeholderPrecision={2} />
          </Accordion>
        )}
        {hasGaz && (
          <Accordion label="Gaz">
            <Input name="Paramètres économiques . Gaz x Puissance souscrite pour calcul installation collective ou tertiaire" />
            <Input name="Paramètres économiques . Gaz x Abonnement x Part Fixe TTC collectif ou tertiaire" placeholderPrecision={0} />
            <Input name="Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel" placeholderPrecision={0} />
            <Input
              name="Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel x Coût distribution HT"
              placeholderPrecision={0}
            />
            <Input
              name="Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel x Coût commerciaux hors CEE HT"
              placeholderPrecision={0}
            />
            <Input name="Paramètres économiques . Gaz x Consommation x Part Variable TTC" placeholderPrecision={3} />
            <Input name="Paramètres économiques . Gaz x Coût de la molécule HT" placeholderPrecision={3} />
            <Input name="Paramètres économiques . Gaz x Coût de transport HT" placeholderPrecision={3} />
            <Input name="Paramètres économiques . Gaz x Coût distribution HT" placeholderPrecision={3} />
            <Input name="Paramètres économiques . Gaz x Coût des CEE HT" placeholderPrecision={3} />
            <Input
              name="Paramètres économiques . Gaz x Taxe x Part fixe x Contribution tarifaire d'acheminement CTA"
              placeholderPrecision={0}
            />
            <Input name="Paramètres économiques . Gaz x Taxe x Part fixe x TVA" />
            <Input
              name="Paramètres économiques . Gaz x Taxe x Part variable x Taxe intérieure de consommation sur le gaz naturel TICGN"
              placeholderPrecision={3}
            />
            <Input name="Paramètres économiques . Gaz x Taxe x Part variable x TVA" />
          </Accordion>
        )}
        <Accordion label="Électricité">
          <Select name="Paramètres économiques . Electricité x Option tarifaire" />
          <Input name="Paramètres économiques . Electricité x Puissance souscrite indiv" />
          <Input name="Paramètres économiques . Electricité x Puissance souscrite coll" />
          <Input name="Paramètres économiques . Electricité x Abonnement Part Fixe indiv" placeholderPrecision={0} />
          <Input name="Paramètres économiques . Electricité x Abonnement Part Fixe coll" placeholderPrecision={0} />
          <Input name="Paramètres économiques . Electricité x Consommation Part variable en heure pleine" placeholderPrecision={3} />
          <Input name="Paramètres économiques . Electricité x Consommation Part variable en heure creuse" placeholderPrecision={3} />
          <Input name="ratios économiques . Coût des combustibles x Electricité . Heure pleine x Heure creuse . Part de la consommation en HP" />
          <Input
            name="ratios économiques . Coût des combustibles x Electricité . Heure pleine x Heure creuse . Part de la consommation en HC"
            disabled
          />
          <Input name="Paramètres économiques . Electricité x Taxe . Part Fixe x TVA" />
          <Input
            name="Paramètres économiques . Electricité x Taxe . Part Variable x Accise sur l'électricité ex TIPCSE CSPE"
            placeholderPrecision={3}
          />
          <Input name="Paramètres économiques . Electricité x Taxe . Part Variable x TVA" />
        </Accordion>
        {hasGranules && (
          <Accordion label="Granulés">
            <Select name="Paramètres économiques . Granulés . Type de conditionnement" />
            <Input name="Paramètres économiques . Granulés . Prix pour les granulés" />
            <Input name="Paramètres économiques . Granulés . TVA" />
          </Accordion>
        )}
        {hasFioul && (
          <Accordion label="Fioul">
            <Input name="Paramètres économiques . Fioul . Prix livraison incluse" placeholderPrecision={3} />
            <Input name="Paramètres économiques . Fioul . TVA" />
            <Input name="Paramètres économiques . Fioul . TICPE" placeholderPrecision={3} />
          </Accordion>
        )}
        {utiliseReseauDeFroid && (
          <Accordion label="Réseau de froid">
            <Input name="Paramètres économiques . Réseaux froid . Coût" />
            <Input name="Paramètres économiques . Réseaux froid . Part fixe" />
            <Input name="Paramètres économiques . Réseaux froid . Part variable" disabled />
          </Accordion>
        )}
      </Accordion>

      <Accordion label="Petit entretien (P2)">
        <Input name="Paramètres économiques . Petit entretien P2 . TVA" />
        <Input name="Paramètres économiques . Petit entretien P2 . RCU" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Petit entretien P2 . RFU" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Petit entretien P2 . Poêle à granulés indiv" placeholderPrecision={1} />
        <Input name="Paramètres économiques . Petit entretien P2 . Chaudière à granulés coll" placeholderPrecision={1} />
        <Input name="Paramètres économiques . Petit entretien P2 . Gaz indiv avec cond" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Petit entretien P2 . Gaz indiv sans cond" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Petit entretien P2 . Gaz coll avec cond" />
        <Input name="Paramètres économiques . Petit entretien P2 . Gaz coll sans cond" />
        <Input name="Paramètres économiques . Petit entretien P2 . Fioul indiv" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Petit entretien P2 . Fioul coll" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Petit entretien P2 . PAC air-air" />
        <Input name="Paramètres économiques . Petit entretien P2 . PAC eau-eau" />
        <Input name="Paramètres économiques . Petit entretien P2 . PAC air-eau" placeholderPrecision={0} />
        <Input name="Paramètres économiques . Petit entretien P2 . Radiateur électrique" />
        <Input name="Paramètres économiques . Petit entretien P2 . Chauffe-eau électrique à accumulation" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Petit entretien P2 . Chauffe-eau solaire" placeholderPrecision={3} />
      </Accordion>

      <Accordion label="Gros entretien (P3)">
        <Input name="Paramètres économiques . Gros entretien P3 . TVA" />
        <Input name="Paramètres économiques . Gros entretien P3 . RCU" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . RFU" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Poêle à granulés indiv" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Chaudière à granulés coll" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Gaz indiv avec cond" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Gaz indiv sans cond" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Gaz coll avec cond" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Gaz coll sans cond" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Fioul indiv" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Fioul coll" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . PAC air-air" placeholderPrecision={0} />
        <Input name="Paramètres économiques . Gros entretien P3 . PAC eau-eau" placeholderPrecision={0} />
        <Input name="Paramètres économiques . Gros entretien P3 . PAC air-eau" placeholderPrecision={0} />
        <Input name="Paramètres économiques . Gros entretien P3 . Radiateur électrique" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Chauffe-eau électrique à accumulation" placeholderPrecision={3} />
        <Input name="Paramètres économiques . Gros entretien P3 . Chauffe-eau solaire" placeholderPrecision={3} />
      </Accordion>

      <Accordion label="Amortissement (P4)">
        <Input name="ratios économiques . Amortissement x Taux actualisation" />
      </Accordion>

      <Accordion label="Aides">
        <RadioInput name="Paramètres économiques . Aides . Éligibilité x Prise en compte des aides" small orientation="horizontal" />
        <RadioInput
          name="Paramètres économiques . Aides . Éligibilité x Je suis un particulier"
          small
          orientation="horizontal"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Select
          name="Paramètres économiques . Aides . Éligibilité x Ressources du ménage"
          withDefaultOption={false}
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <RadioInput
          name="Paramètres économiques . Aides . Éligibilité x Je dispose actuellement d'une chaudière gaz ou fioul"
          small
          orientation="horizontal"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Select
          name="Paramètres économiques . Aides . Aides x Éligible Ma prime renov'"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Select
          name="Paramètres économiques . Aides . Aides x Éligible Coup de pouce chauffage"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Select
          name="Paramètres économiques . Aides . Aides x Éligible CEE"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
        <Input
          name="Paramètres économiques . Aides . Valeur CEE"
          disabled={!engine.getField('Paramètres économiques . Aides . Éligibilité x Prise en compte des aides')}
        />
      </Accordion>

      <Title mt="4w">Paramètres techniques par mode de chauffage et de refroidissement</Title>

      {hasModeDeChauffage('Réseau de chaleur') && (
        <UrlStateAccordion label="Réseau de chaleur">
          <Input name="ratios . RCU Rendement sous station chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . RCU Rendement sous station ECS" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . RCU Conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="ratios . RCU Conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="ratios . RCU Durée avant renouvellement"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Réseaux de chaleur x Collectif . gamme de puissance existante" placeholderPrecision={2} />

          <Input name="Investissement x frais de raccordement au réseaux x RCU" />
        </UrlStateAccordion>
      )}
      {utiliseReseauDeFroid && (
        <UrlStateAccordion label="Réseau de froid">
          <Input name="ratios . RFU Rendement sous station" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . RFU Conso auxiliaire" help="Consommation des pompes de circulation." />
          <Input
            name="ratios . RFU Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Réseaux de froid x Collectif . gamme de puissance existante" placeholderPrecision={2} />

          <Input name="Investissement x frais de raccordement au réseaux x RFU" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Poêle à granulés individuel') && (
        <UrlStateAccordion label="Poêle à granulés individuel">
          <Input name="ratios . GRA POELE Rendement poêle chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . GRA POELE Conso combustible" placeholderPrecision={4} nativeInputProps={{ min: 0.1 }} />
          <Input
            name="ratios . GRA POELE Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Poêle à granulés indiv x Individuel . gamme de puissance existante" />

          <Input name="Investissement x Poêle à granulés indiv" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Chaudière à granulés collective') && (
        <UrlStateAccordion label="Chaudière à granulés collective">
          <Input name="ratios . GRA CHAUD Rendement chaudière chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . GRA CHAUD Conso combustible" placeholderPrecision={4} nativeInputProps={{ min: 0.1 }} />
          <Input name="ratios . GRA CHAUD Conso auxiliaire" help="Consommation des pompes de circulation." />
          <Input
            name="ratios . GRA CHAUD Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Chaudière à granulés coll x Collectif . gamme de puissance existante" />

          <Input name="Investissement x Chaudière à granulés coll" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Gaz à condensation individuel') && (
        <UrlStateAccordion label="Gaz à condensation individuel">
          <Input name="ratios . GAZ IND COND Rendement chaudière chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . GAZ IND COND Rendement chaudière ECS" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . GAZ IND COND Conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="ratios . GAZ IND COND Conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="ratios . GAZ IND COND Conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="ratios . GAZ IND COND Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Gaz indiv avec cond x Individuel . gamme de puissance existante" />

          <Input name="ratios économiques . Gaz x indiv avec cond" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Gaz sans condensation individuel') && (
        <UrlStateAccordion label="Gaz sans condensation individuel">
          <Input name="ratios . GAZ IND SCOND Rendement chaudière" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . GAZ IND SCOND Conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="ratios . GAZ IND SCOND Conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="ratios . GAZ IND SCOND Conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="ratios . GAZ IND SCOND Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Gaz indiv sans cond x Individuel . gamme de puissance existante" />

          <Input name="ratios économiques . Gaz x indiv sans cond" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Gaz à condensation collectif') && (
        <UrlStateAccordion label="Gaz à condensation collectif">
          <Input name="ratios . GAZ COLL COND Rendement chaudière chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . GAZ COLL COND Rendement chaudière ECS" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . GAZ COLL COND Conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="ratios . GAZ COLL COND Conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="ratios . GAZ COLL COND Conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="ratios . GAZ COLL COND Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Gaz coll avec cond x Collectif . gamme de puissance existante" />

          <Input name="ratios économiques . Gaz x coll avec cond" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Gaz sans condensation collectif') && (
        <UrlStateAccordion label="Gaz sans condensation collectif">
          <Input name="ratios . GAZ COLL SCOND Rendement chaudière" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . GAZ COLL SCOND Conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="ratios . GAZ COLL SCOND Conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="ratios . GAZ COLL SCOND Conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="ratios . GAZ COLL SCOND Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Gaz coll sans cond x Collectif . gamme de puissance existante" />

          <Input name="ratios économiques . Gaz x coll sans cond" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Fioul individuel') && (
        <UrlStateAccordion label="Fioul individuel">
          <Input name="ratios . FIOUL IND Rendement chaudière" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . FIOUL IND Conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="ratios . FIOUL IND Conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="ratios . FIOUL IND Conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="ratios . FIOUL IND Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Fioul indiv x Individuel . gamme de puissance existante" placeholderPrecision={4} />

          <Input name="ratios économiques . Fioul x indiv" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Fioul collectif') && (
        <UrlStateAccordion label="Fioul collectif">
          <Input name="ratios . FIOUL COLL Rendement chaudière chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . FIOUL COLL Rendement chaudière ECS" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . FIOUL COLL Conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="ratios . FIOUL COLL Conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="ratios . FIOUL COLL Conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="ratios . FIOUL COLL Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Fioul coll x Collectif . gamme de puissance existante" placeholderPrecision={4} />

          <Input name="ratios économiques . Fioul x collectif" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('PAC air/air individuelle') && (
        <UrlStateAccordion label="PAC air/air individuelle">
          <Input
            name="ratios . PAC AIR AIR SCOP indiv"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
          />
          <Input
            name="ratios . PAC AIR AIR SEER indiv"
            nativeInputProps={{ min: 0.1 }}
            help="SEER : coefficient de performance pour la production de froid. Un SEER de 4 signifie que pour 1 kWh d'électricité consommée, 4 kWh de froid sont produits."
          />
          <Input
            name="ratios . PAC AIR AIR Durée de vie indiv"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x PAC air-air x Individuel . gamme de puissance existante" />

          <Input name="ratios économiques . PAC x air-air réversible x Individuel" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('PAC air/air collective') && (
        <UrlStateAccordion label="PAC air/air collective">
          <Input
            name="ratios . PAC AIR AIR SCOP coll"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
          />
          <Input
            name="ratios . PAC AIR AIR SEER coll"
            nativeInputProps={{ min: 0.1 }}
            help="SEER : coefficient de performance pour la production de froid. Un SEER de 4 signifie que pour 1 kWh d'électricité consommée, 4 kWh de froid sont produits."
          />
          <Input
            name="ratios . PAC AIR AIR Durée de vie coll"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x PAC air-air x Collectif . gamme de puissance existante" />

          <Input name="ratios économiques . PAC x air-air réversible x Collectif" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('PAC eau/eau individuelle') && (
        <UrlStateAccordion label="PAC eau/eau individuelle">
          <Input
            name="ratios . PAC EAU EAU SCOP indiv capteurs horizontaux"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
          />
          <Input
            name="ratios . PAC EAU EAU Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x PAC eau-eau x Individuel . gamme de puissance existante" />

          <Input name="ratios économiques . PAC x eau-eau non réversible x Individuel" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('PAC eau/eau collective') && (
        <UrlStateAccordion label="PAC eau/eau collective">
          <Input
            name="ratios . PAC EAU EAU SCOP coll champ de sondes"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
          />
          <Input
            name="ratios . PAC EAU EAU Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />
          {/* TODO vérifier si même durée de vie que PAC eau/eau indiv */}
          {/* <Input name="ratios . PAC EAU EAU Durée de vie puits géothermiques" label="Durée de vie puits géothermiques" /> */}

          <Input name="Installation x PAC eau-eau x Collectif . gamme de puissance existante" />

          <Input name="ratios économiques . PAC x eau-eau non réversible x Collectif" />
          <Input name="ratios économiques . PAC x eau-eau non réversible . Coûts hors captage sous-sol" />
          <Input name="ratios économiques . PAC x eau-eau non réversible . Coûts captage sous-sol champs sur sonde" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('PAC air/eau individuelle') && (
        <UrlStateAccordion label="PAC air/eau individuelle">
          <Input
            name="ratios . PAC AIR EAU SCOP indiv"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
            placeholderPrecision={2}
          />
          <Input
            name="ratios . PAC AIR EAU SEER indiv"
            nativeInputProps={{ min: 0.1 }}
            help="SEER : coefficient de performance pour la production de froid. Un SEER de 4 signifie que pour 1 kWh d'électricité consommée, 4 kWh de froid sont produits."
          />
          <Input
            name="ratios . PAC AIR EAU Durée de vie indiv"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x PAC air-eau x Individuel . gamme de puissance existante" />

          <Input name="ratios économiques . PAC x air-eau réversible x Individuel" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('PAC air/eau collective') && (
        <UrlStateAccordion label="PAC air/eau collective">
          <Input
            name="ratios . PAC AIR EAU SCOP coll"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
            placeholderPrecision={2}
          />
          <Input
            name="ratios . PAC AIR EAU SEER coll"
            nativeInputProps={{ min: 0.1 }}
            help="SEER : coefficient de performance pour la production de froid. Un SEER de 4 signifie que pour 1 kWh d'électricité consommée, 4 kWh de froid sont produits."
          />
          <Input
            name="ratios . PAC AIR EAU Durée de vie coll"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x PAC air-eau x Collectif . gamme de puissance existante" />

          <Input name="ratios économiques . PAC x air-eau réversible x Collectif" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Radiateur électrique individuel') && (
        <UrlStateAccordion label="Radiateur électrique individuel">
          <Input name="ratios . RAD ELEC INDIV Rendement" nativeInputProps={{ min: 0.001 }} />
          <Input name="ratios . RAD ELEC INDIV Conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input
            name="ratios . RAD ELEC INDIV Durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="Installation x Radiateur électrique x Individuel . gamme de puissance existante" />

          <Input name="ratios économiques . Radiateur électrique x Individuel x investissement total" />
        </UrlStateAccordion>
      )}
    </div>
  );
};

export default ParametresDesModesDeChauffageForm;
