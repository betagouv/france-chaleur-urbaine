import { createSerializer, parseAsStringLiteral } from 'nuqs';
import { z } from 'zod';

import type { AvailableHeating } from '@/modules/app/types';
import type { BANAddressFeature } from '@/modules/ban/types';
import { choixChauffageQueryParsers } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import {
  ESPACE_EXTERIEUR_VALUES,
  type EspaceExterieur,
  TYPE_LOGEMENT_VALUES,
  TYPE_RADIATEUR_VALUES,
  type TypeLogement,
  type TypeRadiateur,
} from '@/modules/chaleur-renouvelable/constants';

import { HOME_FORM_MODES, type HomeFormMode } from '../constants';

/** `?mode=` URL parameter, single source of truth of the selected branch (radio, CTA, deep link). */
export const homeFormModeParser = parseAsStringLiteral(HOME_FORM_MODES)
  .withDefault('raccordement')
  .withOptions({ clearOnDefault: true, history: 'replace', scroll: false });

/** Heat network eligibility test: an address picked from the BAN and a housing type. */
export const zHomeEligibilityForm = z.object({
  geoAddress: z.custom<BANAddressFeature>((value) => !!value, "N'oubliez pas de sélectionner votre adresse dans la liste."),
  typeLogement: z.enum(TYPE_LOGEMENT_VALUES, { error: "N'oubliez pas d'indiquer votre type de bâtiment." }),
});

/** Renewable heating comparator: the eligibility fields plus the radiator type and the outdoor spaces. */
export const zHomeComparatorForm = zHomeEligibilityForm.extend({
  espaceExterieur: z.enum(ESPACE_EXTERIEUR_VALUES),
  geoAddress: zHomeEligibilityForm.shape.geoAddress.refine((address) => address.properties.type === 'housenumber', {
    message: 'Une adresse précise est nécessaire pour identifier votre bâtiment et proposer des solutions pertinentes',
  }),
  typeRadiateur: z.enum(TYPE_RADIATEUR_VALUES, { error: "N'oubliez pas d'indiquer votre type de radiateurs." }),
});

export type HomeComparatorFormData = z.infer<typeof zHomeComparatorForm>;

/** Flat superset of both branches: the form store keeps every field whatever the selected mode. */
export type HomeFormValues = {
  espaceExterieur: EspaceExterieur;
  geoAddress: BANAddressFeature | undefined;
  typeLogement: TypeLogement | '';
  typeRadiateur: TypeRadiateur | '';
};

// both branch schemas validate the same flat runtime values; unify their type for TanStack
export const getHomeFormSchema = (mode: HomeFormMode) =>
  (mode === 'comparateur' ? zHomeComparatorForm : zHomeEligibilityForm) as unknown as z.ZodType<HomeFormValues, HomeFormValues>;

/** `?heating=` URL parameter of the partner iframes: anything else than the two known values is ignored. */
export const parseHeatingParam = (value: string | null): NonNullable<AvailableHeating> | undefined =>
  value === 'collectif' || value === 'individuel' ? value : undefined;

/** Legacy `heating` value (URL param of the partner iframes, `user-info` local storage) to the comparator housing type. */
export const heatingTypeToTypeLogement = (heatingType: AvailableHeating): TypeLogement | '' =>
  heatingType === 'collectif' ? 'immeuble_chauffage_collectif' : heatingType === 'individuel' ? 'immeuble_chauffage_individuel' : '';

/** Housing type to the heating type expected by the eligibility test and the demand form; a house counts as individual heating. */
export const typeLogementToHeatingType = (typeLogement: TypeLogement): NonNullable<AvailableHeating> =>
  typeLogement === 'immeuble_chauffage_collectif' ? 'collectif' : 'individuel';

const serializeComparatorParams = createSerializer(choixChauffageQueryParsers);

export const buildComparatorResultUrl = (data: HomeComparatorFormData) =>
  serializeComparatorParams('/chaleur-renouvelable/resultat', {
    adresse: data.geoAddress.properties.label,
    espaceExterieur: data.espaceExterieur,
    typeLogement: data.typeLogement,
    typeRadiateur: data.typeRadiateur,
  });
