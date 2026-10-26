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

/** `?mode=` URL parameter: lets a CTA or a deep link preselect the comparator branch of the form. */
export const homeFormModeParser = parseAsStringLiteral(HOME_FORM_MODES)
  .withDefault('raccordement')
  .withOptions({ clearOnDefault: true, history: 'replace', scroll: false });

const zHomeFormBase = z.object({
  geoAddress: z.custom<BANAddressFeature>((value) => !!value, "N'oubliez pas de sélectionner votre adresse dans la liste."),
  typeLogement: z.enum(TYPE_LOGEMENT_VALUES, { error: "N'oubliez pas d'indiquer votre type de bâtiment." }),
});

/**
 * Home address test: a heat network eligibility test, or the renewable heating comparator
 * which additionally needs the radiator type and the available outdoor spaces.
 */
export const zHomeForm = z.discriminatedUnion('mode', [
  zHomeFormBase.extend({ mode: z.literal('raccordement') }),
  zHomeFormBase.extend({
    espaceExterieur: z.enum(ESPACE_EXTERIEUR_VALUES),
    mode: z.literal('comparateur'),
    typeRadiateur: z.enum(TYPE_RADIATEUR_VALUES, { error: "N'oubliez pas d'indiquer votre type de radiateurs." }),
  }),
]);

export type HomeFormData = z.infer<typeof zHomeForm>;
export type HomeComparatorFormData = Extract<HomeFormData, { mode: 'comparateur' }>;

/** Flat superset of both branches: the form store keeps every field whatever the selected mode. */
export type HomeFormValues = {
  espaceExterieur: EspaceExterieur;
  geoAddress: BANAddressFeature | undefined;
  mode: HomeFormMode;
  typeLogement: TypeLogement | '';
  typeRadiateur: TypeRadiateur | '';
};

// the union validates the flat runtime values of the selected branch; unify its type for TanStack
export const zHomeFormValues = zHomeForm as unknown as z.ZodType<HomeFormValues, HomeFormValues>;

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
