export const ecoreseauLabels = ['ecoreseau 2025', 'ecoreseau + 2025'] as const;

export type EcoreseauLabel = (typeof ecoreseauLabels)[number];

/** A document published on a network page, as listed by `networkDocumentsJsonAgg`. */
export type NetworkDocumentSummary = { id: string; filename: string; size: number; type: string };

/** Shapes of the public network pages and list, inferred from the queries (type-only import of the server module). */
export type HeatNetwork = NonNullable<Awaited<ReturnType<typeof import('./server/service').getNetwork>>>;
export type ColdNetwork = NonNullable<Awaited<ReturnType<typeof import('./server/service').getColdNetwork>>>;
/** A network page: discriminated by `type`, cold networks carry fewer survey figures. */
export type Network = HeatNetwork | ColdNetwork;
export type NetworkToCompare = Awaited<ReturnType<typeof import('./server/service').listNetworks>>[number];
