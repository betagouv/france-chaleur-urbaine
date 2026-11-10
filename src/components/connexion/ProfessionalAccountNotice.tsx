import Link from '@/components/ui/Link';
import { DEMAND_TRACKING_PAGE_PATH } from '@/modules/demand-tracking/constants';

/**
 * Notice shown above the login and registration forms: what a professional account is for,
 * and a reminder that demands are now tracked by email without an account.
 */
export function ProfessionalAccountNotice() {
  return (
    <div className="my-5 text-sm">
      <strong>Compte professionnel sur France Chaleur Urbaine</strong>
      <br />
      Le compte professionnel permet d'accéder aux outils avancés de France Chaleur Urbaine. Les professionnels habilités peuvent également
      y traiter les demandes de raccordement au réseau de chaleur ou d'accompagnement multi-ENR :
      <ul className="list-disc pl-4 my-2">
        <li>Calculateur du potentiel de raccordement pour des listes d'adresses</li>
        <li>Comparateur avancé des coûts et émissions de CO2 des différentes solutions de chauffage</li>
        <li>[Gestionnaires de réseaux] Traitement des demandes de raccordement</li>
        <li>[Collectivités] Suivi des demandes de raccordement</li>
        <li>[Conseillers ENR] Traitement des demandes d'accompagnement multi-ENR</li>
      </ul>
      ⚠️ Vous avez déposé une demande de raccordement ou d'accompagnement ? Plus besoin de compte pour la suivre :{' '}
      <Link href={DEMAND_TRACKING_PAGE_PATH}>Suivre ma demande</Link>.
    </div>
  );
}
