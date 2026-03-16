import { createParser } from 'nuqs';

/**
 * Parse une chaîne "longitude,latitude" en tuple [number, number].
 * Retourne null si le format est invalide ou si l'un des nombres est NaN.
 *
 * @example ?center=4.717692,49.767402 → [4.717692, 49.767402]
 */
export const parseAsLngLat = createParser<[number, number]>({
  parse: (v) => {
    const parts = v.split(',');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const lng = Number(parts[0]);
    const lat = Number(parts[1]);
    if (Number.isNaN(lng) || Number.isNaN(lat)) return null;
    return [lng, lat];
  },
  serialize: ([lng, lat]) => `${lng},${lat}`,
});

/**
 * Crée un parser nuqs pour une clé d'un Record donné.
 * Retourne null si la valeur n'est pas une clé valide du record.
 *
 * @example
 * const parseAsLogoKey = createParserForRecordKey(iframeLogoRegistry);
 * // résultat typé : 'dalkia' | 'engie' | ... | null
 */
export function createParserForRecordKey<T extends Record<string, unknown>>(record: T) {
  return createParser<keyof T & string>({
    parse: (v) => (Object.hasOwn(record, v) ? (v as keyof T & string) : null),
    serialize: (v) => v,
  });
}

/**
 * Crée un parser nuqs pour un tableau de valeurs d'un Record,
 * à partir d'une liste de clés séparées par virgule.
 * Les clés inconnues sont silencieusement ignorées.
 *
 * @example
 * const parseAsLegendFeatures = createParserForRecordValues(legendURLKeyToLegendFeature);
 * // ?displayLegend=reseau_chaleur,futur_reseau → ['reseauxDeChaleur', 'reseauxEnConstruction']
 */
export function createParserForRecordValues<V>(record: Record<string, V>) {
  return createParser<V[]>({
    parse: (v) =>
      v
        .split(',')
        .map((k) => (Object.hasOwn(record, k.trim()) ? record[k.trim()] : null))
        .filter((f): f is V => f !== null),
    serialize: (v) => v.map(String).join(','),
  }).withDefault([]);
}
