import { Highlight } from '@codegouvfr/react-dsfr/Highlight';
import dynamic from 'next/dynamic';

import { ArrowItem } from '@/components/MarkdownWrapper/MarkdownWrapper.style';
import Link from '@/components/ui/Link';

const Simulator = dynamic(() => import('@/modules/simulator/client/Simulator'), {
  ssr: false,
});

const Helps = () => {
  return (
    <>
      <h2>De quoi parle-t-on ?</h2>
      <p>
        Ce « coup de pouce » est une{' '}
        <strong>prime mise en place par l’État dans le cadre du dispositif des Certificats d’économies d’énergie (CEE)*</strong>. Elle est
        versée par des entreprises signataires de la charte coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires ».
      </p>
      <Highlight>
        <strong>
          Objectif : accélérer le remplacement des équipements de chauffage ou de production d’eau chaude sanitaire polluants par un
          raccordement à un réseau de chaleur alimenté à plus de 50 % par des énergies renouvelables et de récupération, ou à défaut par
          d’autres moyens de chauffage performants.
        </strong>
      </Highlight>
      <p>
        *Le dispositif; des; Certificats; d; ’économies d’énergie repose sur une obligation de réalisation d’économies d’énergie imposée par
        les pouvoirs publics aux fournisseurs d’énergie (les "obligés"). Pour obtenir des CEE, les obligés peuvent notamment financer un
        certain nombre d’opérations menées par les ménages, les collectivités territoriales ou les professionnels (telles que le
        raccordement aux réseaux de chaleur).
      </p>
      <h2>Qui peut en bénéficier ?</h2>
      <p>
        Cette offre s’adresse aux <strong>propriétaires et gestionnaires de bâtiments résidentiels collectifs et tertiaires.</strong>
      </p>
      <p>
        Un autre dispositif est mobilisable par les propriétaires de maisons individuelles (coup de pouce « chauffage »), non présenté ici.
      </p>
      <h2>Quel est le montant de la prime ?</h2>
      <p>
        Les modalités de calcul des montants du « Coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires » prennent
        désormais en compte le fait que le raccordement des bâtiments de petite taille est confronté à des coûts fixes importants liés à des
        travaux de voirie (coûts indépendants du nombre de m2 ou du nombre de logements raccordés à un réseau de chaleur).
      </p>
      <p>Les montants exacts dépendent cependant des offres commerciales de chaque signataire de la charte.</p>
      <Highlight>
        <strong id="simulateur">
          Le bénéficiaire doit donc se rapprocher de chaque signataire de la charte proposant l’offre pour connaître le montant des primes.
          Les montants pouvant varier significativement d'un signataire à l'autre, il est important de comparer les offres proposées.
        </strong>
      </Highlight>
      <p>
        <a
          href="https://www.ecologie.gouv.fr/sites/default/files/CdP%20Chauffage%20B%C3%A2timents%20r%C3%A9sidentiels%20collectifs%20et%20tertiaires%20-%20Les%20offres%20Coup%20de%20pouce.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Accéder à la liste des signataires de la charte
        </a>
      </p>
      <Simulator withTitle />
      <h2>Quelles sont les conditions d’attribution ?</h2>
      <ConditionsAttributionCee />
      <h2>Comment bénéficier de la prime ?</h2>
      <ol>
        <li>Vérifier que je remplis les conditions d’attribution</li>
        <li>Comparer les offres proposées par les signataires et choisir un signataire</li>
        <li>
          Accepter l'offre du signataire de la charte (ou un de ses partenaires) avant de signer le devis des travaux. Cette offre devra
          obligatoirement comporter un document décrivant la proposition
        </li>
        <li>Signer le devis proposé par un professionnel pour la réalisation des travaux</li>
        <li>Faire réaliser les travaux par le professionnel</li>
        <li>
          Retourner les documents (factures, attestations sur l’honneur, etc.) au signataire de la charte ou à son partenaire dans les
          délais prévus
        </li>
      </ol>
      <h2>Sous quelle forme vais-je recevoir la prime ?</h2>
      <p>La prime peut :</p>
      <ul>
        <ArrowItem>Être versée par virement ou par chèque.</ArrowItem>
        <ArrowItem>Être déduite de la facture.</ArrowItem>
        <ArrowItem>Prendre d’autres formes convenues avec le signataire de la charte lors de la contractualisation de son offre.</ArrowItem>
      </ul>
      <p>
        Pour en savoir plus :{' '}
        <Link href="https://www.ecologie.gouv.fr/coup-pouce-chauffage-des-batiments-residentiels-collectifs-et-tertiaires" isExternal>
          https://www.ecologie.gouv.fr/coup-pouce-chauffage-des-batiments-residentiels-collectifs-et-tertiaires
        </Link>
      </p>
    </>
  );
};

export const ConditionsAttributionCee = () => {
  return (
    <ul>
      <ArrowItem>
        Remplacement d’équipements de chauffage ou de production d’eau chaude sanitaire au charbon, au fioul ou au gaz au profit d’un
        raccordement à un réseau de chaleur alimenté majoritairement par des énergies renouvelables ou de récupération (ou, à défaut, en cas
        d’impossibilité technique ou économique du raccordement, de la mise en place d’équipements de chauffage ou de production d’eau
        chaude sanitaire ne consommant ni charbon ni fioul)
      </ArrowItem>
      <ArrowItem>
        Bâtiments résidentiels collectifs et du secteur tertiaire existant depuis plus de deux ans à la date d’engagement de l’opération.
      </ArrowItem>
      <ArrowItem>
        Opération valable pour une date d’engagement (signature du devis) comprise entre le 1er janvier 2026 et le 31 décembre 2030. Les
        travaux doivent être achevés au plus tard le 31 décembre 2027.
      </ArrowItem>
      <ArrowItem>
        Le bénéficiaire ne peut prétendre pour une même opération qu’à une seule prime versée dans le cadre du dispositif des certificats
        d’économies d’énergie.
      </ArrowItem>
      <ArrowItem>
        La facture devra expressément mentionner la dépose de l’équipement existant en indiquant l’énergie de chauffage (charbon, fioul ou
        gaz) et le type d’équipement déposé. 
      </ArrowItem>
      <ArrowItem>
        Le raccordement d’un bâtiment déraccordé existant est éligible si et seulement si le déraccordement a eu lieu au moins 5 ans
        auparavant et que celui-ci n’a pas fait l’objet d’une demande de certificats d’économie d’énergie.
      </ArrowItem>
    </ul>
  );
};

export default Helps;
