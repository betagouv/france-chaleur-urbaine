import { Highlight } from '@dataesr/react-dsfr';
import { BlueText, List, Source, Subtitle } from './Contents.styles';
import Simulator from './Simulator';

const Helps = () => {
  return (
    <>
      <Subtitle> De quoi parle-t-on ?</Subtitle>
      Ce « coup de pouce » est une{' '}
      <b>
        prime mise en place par l’État dans le cadre du dispositif des
        Certificats d’économies d’énergie (CEE)*
      </b>
      . Elle est versée par des entreprises signataires de la charte coup de
      pouce "Chauffage des bâtiments résidentiels collectifs et tertiaires ».
      <br />
      <br />
      <Highlight>
        <b>
          Objectif : accélérer le remplacement des équipements de chauffage ou
          de production d’eau chaude sanitaire polluants par un raccordement à
          un réseau de chaleur alimenté à plus de 50 % par des énergies
          renouvelables et de récupération, ou à défaut par d’autres moyens de
          chauffage performants.
        </b>
      </Highlight>
      *Le dispositif des Certificats d’économies d’énergie repose sur une
      obligation de réalisation d’économies d’énergie imposée par les pouvoirs
      publics aux fournisseurs d’énergie (les "obligés"). Pour obtenir des CEE,
      les obligés peuvent notamment financer un certain nombre d’opérations
      menées par les ménages, les collectivités territoriales ou les
      professionnels (telles que le raccordement aux réseaux de chaleur).
      <br />
      <br />
      <Subtitle>Qui peut en bénéficier ?</Subtitle>
      Cette offre s’adresse aux{' '}
      <b>
        propriétaires et gestionnaires de bâtiments résidentiels collectifs et
        tertiaires.
      </b>
      <br />
      Un autre dispositif est mobilisable par les propriétaires de maisons
      individuelles (coup de pouce « chauffage »), non présenté ici.
      <br />
      <br />
      <Subtitle>Quel est le montant de la prime ?</Subtitle>
      Les modalités de calcul des montants du « Coup de pouce chauffage des
      bâtiments résidentiels collectifs et tertiaires » prennent désormais en
      compte le fait que le raccordement des bâtiments de petite taille est
      confronté à des coûts fixes importants liés à des travaux de voirie (coûts
      indépendants du nombre de m2 ou du nombre de logements raccordés à un
      réseau de chaleur).
      <br />
      <br />
      Les montants exacts dépendent cependant des offres commerciales de chaque
      signataire de la charte.
      <br />
      <br />
      <Highlight>
        {/* id is put here because of the sticky header...*/}
        <b id="simulateur">
          Le bénéficiaire doit donc se rapprocher de chaque signataire de la
          charte proposant l’offre pour connaître le montant des primes.
        </b>
      </Highlight>
      <Source>
        <a
          href="https://www.ecologie.gouv.fr/sites/default/files/CdP%20Chauffage%20B%C3%A2timents%20r%C3%A9sidentiels%20collectifs%20et%20tertiaires%20-%20Les%20offres%20Coup%20de%20pouce.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Accéder à la liste des signataires de la charte
        </a>
      </Source>
      <Simulator />
      <Subtitle>Quelles sont les conditions d’attribution ?</Subtitle>
      <List>
        <li>
          Remplacement d’équipements de chauffage ou de production d’eau chaude
          sanitaire au charbon, au fioul ou au gaz au profit d’un raccordement à
          un réseau de chaleur alimenté majoritairement par des énergies
          renouvelables ou de récupération (ou, à défaut, en cas d’impossibilité
          technique ou économique du raccordement, de la mise en place
          d’équipements de chauffage ou de production d’eau chaude sanitaire ne
          consommant ni charbon ni fioul)
        </li>
        <li>
          Bâtiments résidentiels collectifs et du secteur tertiaire existant
          depuis plus de deux ans à la date d’engagement de l’opération.
        </li>
        <li>
          Opération valable pour une date d’engagement (signature du devis)
          comprise entre le 1er septembre 2022 et le 31 décembre 2025. Les
          travaux doivent être achevés au plus tard le 31 décembre 2026.
        </li>
        <li>
          Le bénéficiaire ne peut prétendre pour une même opération qu’à une
          seule prime versée dans le cadre du dispositif des certificats
          d’économies d’énergie.
        </li>
        <li>
          La facture devra expressément mentionner la dépose de l’équipement
          existant en indiquant l’énergie de chauffage (charbon, fioul ou gaz)
          et le type d’équipement déposé. 
        </li>
        <li>
          Le raccordement d’un bâtiment déraccordé existant est éligible si et
          seulement si le déraccordement a eu lieu au moins 5 ans auparavant et
          que celui-ci n’a pas fait l’objet d’une demande de certificats
          d’économie d’énergie.
        </li>
      </List>
      <br />
      <br />
      <Subtitle>Comment bénéficier de la prime ?</Subtitle>
      <BlueText>1.</BlueText> Vérifier que je remplis les conditions
      d’attribution
      <br />
      <br />
      <BlueText>2.</BlueText> Comparer les offres proposées par les signataires
      et choisir un signataire
      <br />
      <br />
      <BlueText>3.</BlueText> Accepter l'offre du signataire de la charte (ou un
      de ses partenaires) avant de signer le devis des travaux. Cette offre
      devra obligatoirement comporter un document décrivant la proposition
      <br />
      <br />
      <BlueText>4.</BlueText> Signer le devis proposé par un professionnel pour
      la réalisation des travaux
      <br />
      <br />
      <BlueText>5.</BlueText> Faire réaliser les travaux par le professionnel
      <br />
      <br />
      <BlueText>6.</BlueText> Retourner les documents (factures, attestations
      sur l’honneur, etc.) au signataire de la charte ou à son partenaire dans
      les délais prévus
      <br />
      <br />
      <br />
      <Subtitle>Sous quelle forme vais-je recevoir la prime ?</Subtitle>
      La prime peut :
      <List>
        <li>Être versée par virement ou par chèque.</li>
        <li>Être déduite de la facture.</li>
        <li>
          Prendre d’autres formes convenues avec le signataire de la charte lors
          de la contractualisation de son offre.
        </li>
      </List>
      <Source>
        Pour en savoir plus :{' '}
        <a
          href="https://www.ecologie.gouv.fr/coup-pouce-chauffage-des-batiments-residentiels-collectifs-et-tertiaires"
          target="_blank"
          rel="noreferrer"
        >
          https://www.ecologie.gouv.fr/coup-pouce-chauffage-des-batiments-residentiels-collectifs-et-tertiaires
        </a>
      </Source>
    </>
  );
};

export default Helps;
