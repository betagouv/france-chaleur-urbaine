import { trackEvent, trackPostHogEvent } from '@/modules/analytics/client';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { TypeCommune } from '@/server/services/communeAPotentiel';

// `ign_communes` columns are nullable in the DB types even though a found commune always has them
type CommuneSansReseau = {
  insee_com: string | null;
  nom: string | null;
  type: TypeCommune;
};

/**
 * Envoie la demande d'accompagnement d'une commune sans réseau (page + iframe potentiel de création de réseau).
 * Retourne le callback attendu par `<Newsletter onSignUp>`.
 */
export const useSubmitDemandeCommuneSansReseau = (commune: CommuneSansReseau | null) => {
  const { mutateAsync: createDemande } = trpc.communesSansReseau.createDemande.useMutation();

  return async (email: string) => {
    if (!commune?.insee_com) {
      alert('Aucune commune n’a été sélectionnée');
      return;
    }
    trackEvent(`Villes Potentiel - Demandes|${commune.type}`, commune.nom ?? '');
    trackPostHogEvent('potentiel-creation-reseau:contact_form_submit', {
      commune: commune.nom ?? '',
      email,
      potentiel: commune.type,
    });
    await createDemande({ codeInsee: commune.insee_com, email });
    notify('success', 'Merci pour votre demande, nous vous recontacterons très rapidement');
  };
};
