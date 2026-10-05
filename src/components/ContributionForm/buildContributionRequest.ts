import type { UploadedFile } from '@/modules/files/constants';
import { type CreateNetworkChangeRequestInput, NETWORK_LABEL_MAX_LENGTH } from '@/modules/network-change-requests/constants';

import type { ContributionNetworkSearchResult } from './ContributionNetworkSncuField';
import type { ContributionFormData } from './schema';

type UploadedFiles = { pdp: UploadedFile[]; trace: UploadedFile[] };

const NO_NETWORK_LABEL = 'Non précisé';

/** Maps the validated contribution form values (and the uploaded files) to a change request creation input. */
export const buildContributionRequest = (
  value: ContributionFormData,
  uploaded: UploadedFiles,
  selectedNetwork: ContributionNetworkSearchResult | null
): CreateNetworkChangeRequestInput => {
  const contact = {
    email: value.email,
    firstName: value.prenom,
    lastName: value.nom,
    type: value.typeUtilisateur,
    typeOther: value.typeUtilisateur === 'autre' ? value.typeUtilisateurAutre : undefined,
  };
  const network = selectedNetwork ? { id: selectedNetwork.id_fcu, type: 'reseau_de_chaleur' as const } : null;
  // the form keeps the fields of every branch: only the ones of the chosen kind describe the target
  const typedLabel = value.typeDemande === 'autre' ? undefined : value.nomReseau || value.localisation;
  const networkLabel = (
    selectedNetwork
      ? [selectedNetwork.identifiant_reseau, selectedNetwork.nom_reseau].filter(Boolean).join(' - ')
      : typedLabel || NO_NETWORK_LABEL
  ).slice(0, NETWORK_LABEL_MAX_LENGTH);
  const files: CreateNetworkChangeRequestInput['files'] = [
    ...uploaded.trace.map((file) => ({ id: file.id, role: 'trace' as const })),
    ...uploaded.pdp.map((file) => ({ id: file.id, role: 'pdp' as const })),
  ];

  switch (value.typeDemande) {
    case 'trace_existant':
    case 'trace_construction': {
      const payload = {
        commentaire: value.commentaire,
        dansCadreDemandeADEME: value.dansCadreDemandeADEME,
        emailReferentCommercial: value.emailReferentCommercial || undefined,
        gestionnaire: value.gestionnaire,
        localisation: value.localisation,
        maitreOuvrage: value.maitreOuvrage,
        ouvertAuxRaccordements: value.ouvertAuxRaccordements,
        // a declassed network is explicitly not classed; otherwise the status of the selected network, unknown without one
        reseauClasse: value.reseauDeclasse ? false : (selectedNetwork?.is_classe ?? null),
      };
      return value.typeDemande === 'trace_existant'
        ? { contact, files, kind: 'trace_existant', network, networkLabel, payload }
        : {
            contact,
            files,
            kind: 'trace_construction',
            network,
            networkLabel,
            payload: {
              ...payload,
              dateMiseEnServicePrevisionnelle: value.dateMiseEnServicePrevisionnelle,
              puissanceTotalePrevisionnelleMW: value.puissanceTotalePrevisionnelleMW,
            },
          };
    }
    case 'pdp':
      return {
        contact,
        // the perimeter files are uploaded through the generic field: they play the « pdp » role
        files: uploaded.trace.map((file) => ({ id: file.id, role: 'pdp' as const })),
        kind: 'pdp',
        network,
        networkLabel,
        payload: { dansCadreDemandeADEME: value.dansCadreDemandeADEME, localisation: value.localisation },
      };
    case 'autre':
      return {
        contact,
        files: [],
        kind: 'autre',
        network: null,
        networkLabel: NO_NETWORK_LABEL,
        payload: { dansCadreDemandeADEME: value.dansCadreDemandeADEME, precisions: value.precisions },
      };
  }
};
