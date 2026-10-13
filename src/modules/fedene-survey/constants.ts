import { z } from 'zod';

/** Fields of a network whose FCU correction can differ from the survey (keys of the `enquete` request payload). */
export const surveyDiscrepancyFields = ['nomReseau', 'gestionnaire', 'maitreOuvrage'] as const;
export type SurveyDiscrepancyField = (typeof surveyDiscrepancyFields)[number];

export const surveyDiscrepancyFieldLabels: Record<SurveyDiscrepancyField, string> = {
  gestionnaire: 'Gestionnaire',
  maitreOuvrage: "Maître d'ouvrage",
  nomReseau: 'Nom du réseau',
};

/** Column holding the FCU correction of each field. */
export const surveyDiscrepancyFcuColumns = {
  gestionnaire: 'gestionnaire_fcu',
  maitreOuvrage: 'mo_fcu',
  nomReseau: 'nom_reseau_fcu',
} as const satisfies Record<SurveyDiscrepancyField, string>;

/**
 * Decision on one field: keep the FCU correction (nothing changes on the network), or restore the survey value (the
 * correction is dropped, the survey value is displayed).
 */
export const surveyDiscrepancyDecisions = ['keep_fcu', 'restore_fedene'] as const;
export type SurveyDiscrepancyDecision = (typeof surveyDiscrepancyDecisions)[number];

export const surveyDiscrepancyDecisionLabels: Record<SurveyDiscrepancyDecision, string> = {
  keep_fcu: 'Conserver la correction FCU',
  restore_fedene: 'Restaurer la valeur FEDENE',
};

export const zImportFedeneInput = z.object({ fileId: z.uuid() });
export type ImportFedeneInput = z.infer<typeof zImportFedeneInput>;

export const zResolveSurveyDiscrepancyInput = z.object({
  decision: z.enum(surveyDiscrepancyDecisions),
  field: z.enum(surveyDiscrepancyFields),
  requestId: z.uuid(),
});
export type ResolveSurveyDiscrepancyInput = z.infer<typeof zResolveSurveyDiscrepancyInput>;
