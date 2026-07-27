import type React from 'react';

import Input from '@/components/form/publicodes/Input';
import RadioInput from '@/components/form/publicodes/Radio';
import Select from '@/components/form/publicodes/Select';
import { UrlStateAccordion as Accordion, UrlStateAccordion } from '@/components/ui/Accordion';
import useArrayQueryState from '@/hooks/useArrayQueryState';

import { Title } from './ComparateurPublicodes.style';
import type { ModeDeChauffage } from './mappings';
import type { SimulatorEngine } from './useSimulatorEngine';

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
    engine.getField('climatisation . type de production') === 'Réseau de froid' && engine.getField('climatisation . incluse');

  return (
    <div {...props}>
      <p>Les valeurs proposées sont des valeurs par défaut. Vous pouvez les modifier ci-dessous.</p>
      <Title>Paramètres économiques</Title>
      <Accordion label="Investissement">
        <Input name="investissement . pose et mise en place" placeholderPrecision={0} />
        <Input name="investissement . TVA" />

        <Input name="ecs additionnelle . coût du chauffe-eau électrique" placeholderPrecision={0} />
        <Input name="ecs additionnelle . coût du chauffe-eau solaire" />
        <Input name="ecs additionnelle . coût des panneaux solaires" placeholderPrecision={0} />

        <Input name="amortissement . taux actualisation" />
      </Accordion>

      <Accordion label="Combustibles (P1)">
        {hasModeDeChauffage('Réseau de chaleur') && (
          <Accordion label="Réseau de chaleur">
            <Input name="combustibles . réseau de chaleur . abonnement" placeholderPrecision={3} />
            <Input name="combustibles . réseau de chaleur . consommation" placeholderPrecision={3} />
            <Input name="combustibles . réseau de chaleur . coût" placeholderPrecision={3} />
            <Input name="combustibles . réseau de chaleur . part fixe" placeholderPrecision={2} />
            <Input name="combustibles . réseau de chaleur . part variable" disabled placeholderPrecision={2} />
          </Accordion>
        )}
        {hasGaz && (
          <Accordion label="Gaz">
            <Input name="combustibles . gaz . puissance souscrite collectif ou tertiaire" />
            <Input name="combustibles . gaz . abonnement part fixe collectif ou tertiaire" placeholderPrecision={0} />
            <Input name="combustibles . gaz . abonnement part fixe individuel" placeholderPrecision={0} />
            <Input name="combustibles . gaz . abonnement part fixe individuel . coût distribution HT" placeholderPrecision={0} />
            <Input name="combustibles . gaz . abonnement part fixe individuel . coûts commerciaux hors CEE HT" placeholderPrecision={0} />
            <Input name="combustibles . gaz . consommation part variable TTC" placeholderPrecision={3} />
            <Input name="combustibles . gaz . coût de la molécule HT" placeholderPrecision={3} />
            <Input name="combustibles . gaz . coût de transport HT" placeholderPrecision={3} />
            <Input name="combustibles . gaz . coût distribution HT" placeholderPrecision={3} />
            <Input name="combustibles . gaz . coût des CEE HT" placeholderPrecision={3} />
            <Input name="combustibles . gaz . taxes . CTA" placeholderPrecision={0} />
            <Input name="combustibles . gaz . taxes . TVA part fixe" />
            <Input name="combustibles . gaz . taxes . TICGN" placeholderPrecision={3} />
            <Input name="combustibles . gaz . taxes . TVA part variable" />
          </Accordion>
        )}
        <Accordion label="Électricité">
          <Select name="combustibles . électricité . option tarifaire" />
          <Input name="combustibles . électricité . puissance souscrite individuel" />
          <Input name="combustibles . électricité . puissance souscrite collectif" />
          <Input name="combustibles . électricité . abonnement part fixe individuel" placeholderPrecision={0} />
          <Input name="combustibles . électricité . abonnement part fixe collectif" placeholderPrecision={0} />
          <Input name="combustibles . électricité . part variable heure pleine" placeholderPrecision={3} />
          <Input name="combustibles . électricité . part variable heure creuse" placeholderPrecision={3} />
          <Input name="combustibles . électricité . tarifs . option heures creuses . part de la consommation en HP" />
          <Input name="combustibles . électricité . tarifs . option heures creuses . part de la consommation en HC" disabled />
          <Input name="combustibles . électricité . taxes . Part Fixe x TVA" />
          <Input
            name="combustibles . électricité . taxes . Part Variable x Accise sur l'électricité ex TIPCSE CSPE"
            placeholderPrecision={3}
          />
          <Input name="combustibles . électricité . taxes . Part Variable x TVA" />
        </Accordion>
        {hasGranules && (
          <Accordion label="Granulés">
            <Select name="combustibles . granulés . type de conditionnement" />
            <Input name="combustibles . granulés . prix pour les granulés" placeholderPrecision={1} />
            <Input name="combustibles . granulés . TVA" />
          </Accordion>
        )}
        {hasFioul && (
          <Accordion label="Fioul">
            <Input name="combustibles . fioul . prix livraison incluse" placeholderPrecision={3} />
            <Input name="combustibles . fioul . TVA" />
            <Input name="combustibles . fioul . TICPE" placeholderPrecision={3} />
          </Accordion>
        )}
        {utiliseReseauDeFroid && (
          <Accordion label="Réseau de froid">
            <Input name="combustibles . réseau de froid . coût" />
            <Input name="combustibles . réseau de froid . part fixe" />
            <Input name="combustibles . réseau de froid . part variable" disabled />
          </Accordion>
        )}
      </Accordion>

      <Accordion label="Petit entretien (P2)">
        <Input name="investissement . TVA petit entretien P2" />
        <Input name="réseau de chaleur . ratios . petit entretien P2" placeholderPrecision={3} />
        <Input name="réseau de froid . ratios . petit entretien P2" placeholderPrecision={3} />
        <Input name="poêle à granulés . ratios . petit entretien P2" placeholderPrecision={1} />
        <Input name="chaudière à granulés . ratios . petit entretien P2" placeholderPrecision={1} />
        <Input name="gaz indiv avec cond . ratios . petit entretien P2" placeholderPrecision={3} />
        <Input name="gaz indiv sans cond . ratios . petit entretien P2" placeholderPrecision={3} />
        <Input name="gaz coll avec cond . ratios . petit entretien P2" />
        <Input name="gaz coll sans cond . ratios . petit entretien P2" />
        <Input name="fioul indiv . ratios . petit entretien P2" placeholderPrecision={3} />
        <Input name="fioul coll . ratios . petit entretien P2" placeholderPrecision={3} />
        <Input name="PAC air-air coll . ratios . petit entretien P2" placeholderPrecision={0} />
        <Input name="PAC air-air indiv . ratios . petit entretien P2" placeholderPrecision={0} />
        <Input name="PAC eau-eau coll . ratios . petit entretien P2" placeholderPrecision={0} />
        <Input name="PAC eau-eau indiv . ratios . petit entretien P2" placeholderPrecision={0} />
        <Input name="PAC air-eau coll . ratios . petit entretien P2" placeholderPrecision={0} />
        <Input name="PAC air-eau indiv . ratios . petit entretien P2" placeholderPrecision={0} />
        <Input name="radiateur électrique . ratios . petit entretien P2" />
        <Input name="ecs additionnelle . petit entretien P2 chauffe-eau électrique" placeholderPrecision={3} />
        <Input name="ecs additionnelle . petit entretien P2 chauffe-eau solaire" placeholderPrecision={3} />
      </Accordion>

      <Accordion label="Gros entretien (P3)">
        <Input name="investissement . TVA gros entretien P3" />
        <Input name="réseau de chaleur . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="réseau de froid . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="poêle à granulés . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="chaudière à granulés . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="gaz indiv avec cond . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="gaz indiv sans cond . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="gaz coll avec cond . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="gaz coll sans cond . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="fioul indiv . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="fioul coll . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="PAC air-air coll . ratios . gros entretien P3" placeholderPrecision={0} />
        <Input name="PAC air-air indiv . ratios . gros entretien P3" placeholderPrecision={0} />
        <Input name="PAC eau-eau coll . ratios . gros entretien P3" placeholderPrecision={0} />
        <Input name="PAC eau-eau indiv . ratios . gros entretien P3" placeholderPrecision={0} />
        <Input name="PAC air-eau coll . ratios . gros entretien P3" placeholderPrecision={0} />
        <Input name="PAC air-eau indiv . ratios . gros entretien P3" placeholderPrecision={0} />
        <Input name="radiateur électrique . ratios . gros entretien P3" placeholderPrecision={3} />
        <Input name="ecs additionnelle . gros entretien P3 chauffe-eau électrique" placeholderPrecision={3} />
        <Input name="ecs additionnelle . gros entretien P3 chauffe-eau solaire" placeholderPrecision={3} />
      </Accordion>

      <Accordion label="Amortissement (P4)">
        <Input name="amortissement . taux actualisation" />
      </Accordion>

      <Accordion label="Aides">
        <RadioInput name="aides . éligibilité . prise en compte des aides" small orientation="horizontal" />
        <RadioInput
          name="aides . éligibilité . particulier"
          small
          orientation="horizontal"
          disabled={!engine.getField('aides . éligibilité . prise en compte des aides')}
        />
        <Select
          name="aides . éligibilité . ressources du ménage"
          withDefaultOption={false}
          disabled={!engine.getField('aides . éligibilité . prise en compte des aides')}
        />
        <RadioInput
          name="aides . éligibilité . chaudière gaz ou fioul actuelle"
          small
          orientation="horizontal"
          disabled={!engine.getField('aides . éligibilité . prise en compte des aides')}
        />
        <Select
          name="aides . éligibilité . éligible ma prime rénov"
          disabled={!engine.getField('aides . éligibilité . prise en compte des aides')}
        />
        <Select
          name="aides . éligibilité . éligible coup de pouce"
          disabled={!engine.getField('aides . éligibilité . prise en compte des aides')}
        />
        <Select name="aides . éligibilité . éligible CEE" disabled={!engine.getField('aides . éligibilité . prise en compte des aides')} />
        <Input name="aides . valeur CEE" disabled={!engine.getField('aides . éligibilité . prise en compte des aides')} />
      </Accordion>

      <Title mt="4w">Paramètres techniques par mode de chauffage et de refroidissement</Title>

      {hasModeDeChauffage('Réseau de chaleur') && (
        <UrlStateAccordion label="Réseau de chaleur">
          <Input name="réseau de chaleur . ratios . rendement sous station chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="réseau de chaleur . ratios . rendement sous station ECS" nativeInputProps={{ min: 0.001 }} />
          <Input name="réseau de chaleur . ratios . conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="réseau de chaleur . ratios . conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="réseau de chaleur . ratios . durée avant renouvellement"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="réseau de chaleur . installation . puissance retenue" placeholderPrecision={2} />

          <Input name="réseau de chaleur . ratios . frais de raccordement" />
        </UrlStateAccordion>
      )}
      {utiliseReseauDeFroid && (
        <UrlStateAccordion label="Réseau de froid">
          <Input name="réseau de froid . ratios . rendement sous station" nativeInputProps={{ min: 0.001 }} />
          <Input name="réseau de froid . ratios . conso auxiliaire" help="Consommation des pompes de circulation." />
          <Input
            name="réseau de froid . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="réseau de froid . installation . puissance retenue" placeholderPrecision={2} />

          <Input name="réseau de froid . ratios . frais de raccordement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Poêle à granulés individuel') && (
        <UrlStateAccordion label="Poêle à granulés individuel">
          <Input name="poêle à granulés . ratios . rendement poêle chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="poêle à granulés . ratios . conso combustible" placeholderPrecision={4} nativeInputProps={{ min: 0.1 }} />
          <Input
            name="poêle à granulés . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="poêle à granulés . installation . puissance retenue" />

          <Input name="poêle à granulés . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Chaudière à granulés collective') && (
        <UrlStateAccordion label="Chaudière à granulés collective">
          <Input name="chaudière à granulés . ratios . rendement chaudière chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="chaudière à granulés . ratios . conso combustible" placeholderPrecision={4} nativeInputProps={{ min: 0.1 }} />
          <Input name="chaudière à granulés . ratios . conso auxiliaire" help="Consommation des pompes de circulation." />
          <Input
            name="chaudière à granulés . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="chaudière à granulés . installation . puissance retenue" />

          <Input name="chaudière à granulés . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Gaz à condensation individuel') && (
        <UrlStateAccordion label="Gaz à condensation individuel">
          <Input name="gaz indiv avec cond . ratios . rendement chaudière chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="gaz indiv avec cond . ratios . rendement chaudière ECS" nativeInputProps={{ min: 0.001 }} />
          <Input name="gaz indiv avec cond . ratios . conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="gaz indiv avec cond . ratios . conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="gaz indiv avec cond . ratios . conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="gaz indiv avec cond . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="gaz indiv avec cond . installation . puissance retenue" />

          <Input name="gaz indiv avec cond . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Gaz sans condensation individuel') && (
        <UrlStateAccordion label="Gaz sans condensation individuel">
          <Input name="gaz indiv sans cond . ratios . rendement chaudière" nativeInputProps={{ min: 0.001 }} />
          <Input name="gaz indiv sans cond . ratios . conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="gaz indiv sans cond . ratios . conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="gaz indiv sans cond . ratios . conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="gaz indiv sans cond . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="gaz indiv sans cond . installation . puissance retenue" />

          <Input name="gaz indiv sans cond . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Gaz à condensation collectif') && (
        <UrlStateAccordion label="Gaz à condensation collectif">
          <Input name="gaz coll avec cond . ratios . rendement chaudière chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="gaz coll avec cond . ratios . rendement chaudière ECS" nativeInputProps={{ min: 0.001 }} />
          <Input name="gaz coll avec cond . ratios . conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="gaz coll avec cond . ratios . conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="gaz coll avec cond . ratios . conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="gaz coll avec cond . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="gaz coll avec cond . installation . puissance retenue" />

          <Input name="gaz coll avec cond . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Gaz sans condensation collectif') && (
        <UrlStateAccordion label="Gaz sans condensation collectif">
          <Input name="gaz coll sans cond . ratios . rendement chaudière" nativeInputProps={{ min: 0.001 }} />
          <Input name="gaz coll sans cond . ratios . conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="gaz coll sans cond . ratios . conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="gaz coll sans cond . ratios . conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="gaz coll sans cond . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="gaz coll sans cond . installation . puissance retenue" />

          <Input name="gaz coll sans cond . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Fioul individuel') && (
        <UrlStateAccordion label="Fioul individuel">
          <Input name="fioul indiv . ratios . rendement chaudière" nativeInputProps={{ min: 0.001 }} />
          <Input name="fioul indiv . ratios . conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="fioul indiv . ratios . conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="fioul indiv . ratios . conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="fioul indiv . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="fioul indiv . installation . puissance retenue" placeholderPrecision={4} />

          <Input name="fioul indiv . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('Fioul collectif') && (
        <UrlStateAccordion label="Fioul collectif">
          <Input name="fioul coll . ratios . rendement chaudière chauffage" nativeInputProps={{ min: 0.001 }} />
          <Input name="fioul coll . ratios . rendement chaudière ECS" nativeInputProps={{ min: 0.001 }} />
          <Input name="fioul coll . ratios . conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input name="fioul coll . ratios . conso auxiliaire chauffage" help="Consommation des pompes de circulation." />
          <Input name="fioul coll . ratios . conso auxiliaire ECS" help="Consommation des pompes de circulation." />
          <Input
            name="fioul coll . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="fioul coll . installation . puissance retenue" placeholderPrecision={4} />

          <Input name="fioul coll . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('PAC air/air individuelle') && (
        <UrlStateAccordion label="PAC air/air individuelle">
          <Input
            name="PAC air-air indiv . ratios . SCOP"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
          />
          <Input
            name="PAC air-air indiv . ratios . SEER"
            nativeInputProps={{ min: 0.1 }}
            help="SEER : coefficient de performance pour la production de froid. Un SEER de 4 signifie que pour 1 kWh d'électricité consommée, 4 kWh de froid sont produits."
          />
          <Input
            name="PAC air-air indiv . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="PAC air-air indiv . installation . puissance retenue" />

          <Input name="PAC air-air indiv . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('PAC air/air collective') && (
        <UrlStateAccordion label="PAC air/air collective">
          <Input
            name="PAC air-air coll . ratios . SCOP"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
          />
          <Input
            name="PAC air-air coll . ratios . SEER"
            nativeInputProps={{ min: 0.1 }}
            help="SEER : coefficient de performance pour la production de froid. Un SEER de 4 signifie que pour 1 kWh d'électricité consommée, 4 kWh de froid sont produits."
          />
          <Input
            name="PAC air-air coll . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="PAC air-air coll . installation . puissance retenue" />

          <Input name="PAC air-air coll . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('PAC eau/eau individuelle') && (
        <UrlStateAccordion label="PAC eau/eau individuelle">
          <Input
            name="PAC eau-eau indiv . ratios . SCOP capteurs horizontaux"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
          />
          <Input
            name="PAC eau-eau indiv . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="PAC eau-eau indiv . installation . puissance retenue" />

          <Input name="PAC eau-eau indiv . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('PAC eau/eau collective') && (
        <UrlStateAccordion label="PAC eau/eau collective">
          <Input
            name="PAC eau-eau coll . ratios . SCOP champ de sondes"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
          />
          <Input
            name="PAC eau-eau indiv . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />
          {/* TODO vérifier si même durée de vie que PAC eau/eau indiv */}
          {/* <Input name="PAC eau-eau coll . ratios . durée de vie puits géothermiques" label="Durée de vie puits géothermiques" /> */}

          <Input name="PAC eau-eau coll . installation . puissance retenue" />

          <Input name="PAC eau-eau coll . ratios . investissement équipement" />
          <Input name="PAC eau-eau coll . ratios . investissement hors captage" />
          <Input name="PAC eau-eau coll . ratios . investissement captage champ de sondes" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('PAC air/eau individuelle') && (
        <UrlStateAccordion label="PAC air/eau individuelle">
          <Input
            name="PAC air-eau indiv . ratios . SCOP"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
            placeholderPrecision={2}
          />
          <Input
            name="PAC air-eau indiv . ratios . SEER"
            nativeInputProps={{ min: 0.1 }}
            help="SEER : coefficient de performance pour la production de froid. Un SEER de 4 signifie que pour 1 kWh d'électricité consommée, 4 kWh de froid sont produits."
          />
          <Input
            name="PAC air-eau indiv . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="PAC air-eau indiv . installation . puissance retenue" />

          <Input name="PAC air-eau indiv . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}
      {hasModeDeChauffage('PAC air/eau collective') && (
        <UrlStateAccordion label="PAC air/eau collective">
          <Input
            name="PAC air-eau coll . ratios . SCOP"
            nativeInputProps={{ min: 0.1 }}
            help="SCOP : coefficient de performance pour la production de chaleur. Un SCOP de 3 signifie que pour 1 kWh d'électricité consommée, 3 kWh de chaleur sont produits."
            placeholderPrecision={2}
          />
          <Input
            name="PAC air-eau coll . ratios . SEER"
            nativeInputProps={{ min: 0.1 }}
            help="SEER : coefficient de performance pour la production de froid. Un SEER de 4 signifie que pour 1 kWh d'électricité consommée, 4 kWh de froid sont produits."
          />
          <Input
            name="PAC air-eau coll . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="PAC air-eau coll . installation . puissance retenue" />

          <Input name="PAC air-eau coll . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}

      {hasModeDeChauffage('Radiateur électrique individuel') && (
        <UrlStateAccordion label="Radiateur électrique individuel">
          <Input name="radiateur électrique . ratios . rendement" nativeInputProps={{ min: 0.001 }} />
          <Input name="radiateur électrique . ratios . conso combustible" nativeInputProps={{ min: 0.1 }} />
          <Input
            name="radiateur électrique . ratios . durée de vie"
            nativeInputProps={{ min: 1 }}
            help="Durée de vie estimée des équipements de production de chaleur."
          />

          <Input name="radiateur électrique . installation . puissance retenue" />

          <Input name="radiateur électrique . ratios . investissement équipement" />
        </UrlStateAccordion>
      )}
    </div>
  );
};

export default ParametresDesModesDeChauffageForm;
