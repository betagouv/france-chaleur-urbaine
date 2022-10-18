import { Checkbox, SearchableSelect, TextInput } from '@dataesr/react-dsfr';
import { submitToAirtable } from '@helpers/airtable';
import { useState } from 'react';
import {
  Hint,
  Section,
  SectionDescription,
  SectionTitle,
  SubmitButton,
  SubSectionTitle,
} from './Form.styles';
import { networkOptions } from './networks';

type Coordinates = {
  name: string;
  firstName: string;
  email: string;
  structure: string;
  function: string;
  information: boolean;
  alert: boolean;
};

type Indicators = {
  averagePrice: string;
  individualHome: string;
  coprop30: string;
  coprop100: string;
  tertiaire: string;
  consoShare: string;
  subscriptionShare: string;
};

const Form = ({ afterSubmit }: { afterSubmit: () => void }) => {
  const [sending, setSending] = useState(false);
  const [network, setNetwork] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates>({
    name: '',
    firstName: '',
    email: '',
    structure: '',
    function: '',
    information: false,
    alert: false,
  });

  const [indicators, setIndicators] = useState<Indicators>({
    averagePrice: '',
    individualHome: '',
    coprop30: '',
    coprop100: '',
    tertiaire: '',
    consoShare: '',
    subscriptionShare: '',
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSending(true);
        await submitToAirtable(
          {
            Réseau: network,
            Nom: coordinates.name,
            Prénom: coordinates.firstName,
            Email: coordinates.email,
            Structure: coordinates.structure,
            Fonction: coordinates.function,
            Informations: coordinates.information,
            Alertes: coordinates.alert,
            'Prix moyen': parseFloat(indicators.averagePrice),
            'Prix maison': parseFloat(indicators.individualHome),
            'Prix copro 30': parseFloat(indicators.coprop30),
            'Prix copro 100': parseFloat(indicators.coprop100),
            'Prix tertiaire': parseFloat(indicators.tertiaire),
            'Part conso': parseFloat(indicators.consoShare) / 100,
            'Part abo': parseFloat(indicators.subscriptionShare) / 100,
          },
          'FCU - Indicateurs'
        );
        afterSubmit();
        setSending(false);
      }}
    >
      <Section>
        <SectionTitle>Identification du réseau :</SectionTitle>
        <Hint className="fr-hint-text">
          La liste des réseaux concernés est définie par{' '}
          <a
            href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000045667492"
            target="_blank"
            rel="noopener noreferrer"
          >
            l'arrêté du 26 avril 2022
          </a>{' '}
          relatif au classement des réseaux de chaleur et de froid. Vous
          souhaitez renseigner des indicateurs pour un réseau qui n'apparaît pas
          dans la liste ? Contactez-nous :{' '}
          <a href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr">
            france-chaleur-urbaine@developpement-durable.gouv.fr
          </a>
          .
        </Hint>
        <SearchableSelect
          required
          placeholder="Ville concernée - Identifiant - Nom du réseau"
          selected={network}
          onChange={setNetwork}
          options={networkOptions}
        />
      </Section>
      <Section>
        <div>
          <SectionTitle>Vos coordonnées :</SectionTitle>
          <SectionDescription>
            Ces informations nous permettront de vous recontacter en cas de
            difficultés techniques.
          </SectionDescription>
        </div>
        <TextInput
          required
          label="Nom :"
          value={coordinates.name}
          onChange={(e) =>
            setCoordinates({ ...coordinates, name: e.target.value })
          }
        />
        <TextInput
          required
          label="Prénom :"
          value={coordinates.firstName}
          onChange={(e) =>
            setCoordinates({ ...coordinates, firstName: e.target.value })
          }
        />
        <TextInput
          required
          type="email"
          label="Email :"
          value={coordinates.email}
          onChange={(e) =>
            setCoordinates({ ...coordinates, email: e.target.value })
          }
        />
        <TextInput
          label="Structure :"
          value={coordinates.structure}
          onChange={(e) =>
            setCoordinates({ ...coordinates, structure: e.target.value })
          }
        />
        <TextInput
          label="Fonction :"
          value={coordinates.function}
          onChange={(e) =>
            setCoordinates({ ...coordinates, function: e.target.value })
          }
        />
        <Checkbox
          onClick={(e) =>
            setCoordinates({ ...coordinates, information: e.target.checked })
          }
          label="Je souhaite être informé de la mise en ligne des indicateurs sur France Chaleur Urbaine."
        />
        <Checkbox
          onClick={(e) =>
            setCoordinates({ ...coordinates, information: e.target.checked })
          }
          label="Je souhaite recevoir une alerte lors de l’ouverture de la prochaine période de dépôt."
        />
      </Section>
      <Section>
        <SectionTitle>
          Indicateurs relatifs aux performances économiques :
        </SectionTitle>
        <TextInput
          required
          type="number"
          step="any"
          min={0}
          label="Prix moyen du MWh (€ TTC / MWh) :"
          hint={
            <>
              Recettes d'énergie thermique totales (€TTC) / Quantité d'énergie
              thermique livrée (MWh).
              <br />
              Les recettes d'énergie thermique totales TTC correspondent au
              chiffre d’affaires TTC sans prendre en compte la revente de
              l'électricité cogénérée en cas d'une cogénération.
              <br />
              Mode de calcul : Le calcul de ces recettes correspond à la somme
              des factures payées par les abonnés.
            </>
          }
          value={indicators.averagePrice}
          onChange={(e) =>
            setIndicators({ ...indicators, averagePrice: e.target.value })
          }
        />
        <SubSectionTitle>
          Prix moyen du MWh par catégorie d’abonnés :
        </SubSectionTitle>
        <TextInput
          required
          type="number"
          step="any"
          min={0}
          label="Ménage en maison individuelle ayant une consommation annuelle de 20 MWh/an (€ TTC / MWh) :"
          value={indicators.individualHome}
          onChange={(e) =>
            setIndicators({ ...indicators, individualHome: e.target.value })
          }
        />
        <TextInput
          required
          type="number"
          step="any"
          min={0}
          label="Copropriété de 30 lots, ayant une consommation annuelle de 300 MWh/an (€ TTC / MWh) :"
          value={indicators.coprop30}
          onChange={(e) =>
            setIndicators({ ...indicators, coprop30: e.target.value })
          }
        />
        <TextInput
          required
          type="number"
          step="any"
          min={0}
          label="Copropriété de 100 lots, ayant une consommation annuelle de 1000 MWh/an (€ TTC / MWh) :"
          value={indicators.coprop100}
          onChange={(e) =>
            setIndicators({ ...indicators, coprop100: e.target.value })
          }
        />
        <TextInput
          required
          type="number"
          step="any"
          min={0}
          label="Surface tertiaire de 1000 m2 ayant une consommation annuelle de 1500 MWh/an (€ TTC / MWh) :"
          value={indicators.tertiaire}
          onChange={(e) =>
            setIndicators({ ...indicators, tertiaire: e.target.value })
          }
        />
        <SubSectionTitle>
          Poids de la part proportionnelle aux consommations et de la part
          forfaitaire dans la facturation :
        </SubSectionTitle>
        <TextInput
          required
          type="number"
          step="any"
          label="Part proportionnelle à la consommation (%) :"
          hint={
            <>
              Recettes totales R1 (€ TTC) / Recettes d'énergie thermique totales
              (€ TTC)
              <br />
              R1 en € TTC = la part de la facture proportionnelle à la
              consommation.
              <br />
              Mode de calcul : Sommer la part R1 de toutes les factures
              adressées aux abonnés.
            </>
          }
          min={0}
          max={100}
          value={indicators.consoShare}
          onChange={(e) =>
            setIndicators({ ...indicators, consoShare: e.target.value })
          }
        />
        <TextInput
          required
          type="number"
          step="any"
          label="Part forfaitaire de l'abonnement (%) :"
          hint={
            <>
              Recettes totales R2 (€ TTC)/Recettes d'énergie thermique totales
              (€ TTC)
              <br />
              La part fixe des recettes tarifaires est calculée en diminuant le
              Chiffre d'Affaires TTC du réseau des ventes d'énergie (R1 TTC). Il
              s'agit de regrouper tout ce qui ne concerne pas l'énergie vendue.
              <br />
              R2 en € TTC = la part forfaitaire de l'abonnement.
              <br />
              Mode de calcul : sommer la part R2 de toutes les factures
              adressées aux abonnés.
            </>
          }
          min={0}
          max={100}
          value={indicators.subscriptionShare}
          onChange={(e) =>
            setIndicators({
              ...indicators,
              subscriptionShare: e.target.value,
            })
          }
        />
      </Section>
      <SubmitButton submit disabled={sending}>
        Soumettre
      </SubmitButton>
    </form>
  );
};

export default Form;
