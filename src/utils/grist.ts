export type GristCellValue = boolean | null | number | string | [string, ...unknown[]];
export type GristRecord = Record<string, GristCellValue | undefined>;

type GristDocOptions = {
  apiKey?: string;
  chunkSize?: number;
  docIdOrUrl?: string;
  server?: string;
};

type GristTableApiResponse = {
  id?: string;
  tableId?: string;
  name?: string;
};

type GristTableData = Record<string, GristCellValue[]>;

export const FCU_PROD_GRIST_TABLES = [
  'FCU_Gestionnaires',
  'FCU_Comptes_pro',
  'BDD_Reseaux',
  'FCU_Formulaire_de_contact',
  'FCU_Contribution',
  'FCU_Newsletter',
  'FCU_Connexion_espace_gestionnaire',
  'INT_Deploiement',
  'INT_Liste_reseaux_France',
  'INT_Prospects_Lyon_Metropole',
  'COMM_Media',
  'CP_Regions_France_Attribution_referents',
  'Journalistes',
  'FCU_Reseaux_de_chaleur',
  'FCU_Reseaux_de_froid',
  'FCU_Futurs_reseaux_de_chaleur',
  'Utilisations_donnees_iframe',
  'FCU_Modifications_reseau',
  'FCU_test_en_masse',
  'FCU_Formulaire_communes_sans_reseau',
  'FCU_Contact_Chaleur_Renouvelable',
  'FCU_Contact_Entretien_Utilisateur',
];

export type FcuProdGristTableName = (typeof FCU_PROD_GRIST_TABLES)[number];

const [
  FCU_GESTIONNAIRES_TABLE,
  FCU_COMPTES_PRO_TABLE,
  BDD_RESEAUX_TABLE,
  FCU_FORMULAIRE_DE_CONTACT_TABLE,
  FCU_CONTRIBUTION_TABLE,
  FCU_NEWSLETTER_TABLE,
  FCU_CONNEXION_ESPACE_GESTIONNAIRE_TABLE,
  INT_DEPLOIEMENT_TABLE,
  INT_LISTE_RESEAUX_FRANCE_TABLE,
  INT_PROSPECTS_LYON_METROPOLE_TABLE,
  COMM_MEDIA_TABLE,
  CP_REGIONS_FRANCE_ATTRIBUTION_REFERENTS_TABLE,
  JOURNALISTES_TABLE,
  FCU_RESEAUX_DE_CHALEUR_TABLE,
  FCU_RESEAUX_DE_FROID_TABLE,
  FCU_FUTURS_RESEAUX_DE_CHALEUR_TABLE,
  UTILISATIONS_DONNEES_IFRAME_TABLE,
  FCU_MODIFICATIONS_RESEAU_TABLE,
  FCU_TEST_EN_MASSE_TABLE,
  FCU_FORMULAIRE_COMMUNES_SANS_RESEAU_TABLE,
  FCU_CONTACT_CHALEUR_RENOUVELABLE_TABLE,
  FCU_CONTACT_ENTRETIEN_UTILISATEUR_TABLE,
] = FCU_PROD_GRIST_TABLES;

export const FCU_PROD_GRIST_TABLE = {
  BDD_RESEAUX: BDD_RESEAUX_TABLE,
  COMM_MEDIA: COMM_MEDIA_TABLE,
  CP_REGIONS_FRANCE_ATTRIBUTION_REFERENTS: CP_REGIONS_FRANCE_ATTRIBUTION_REFERENTS_TABLE,
  FCU_COMPTES_PRO: FCU_COMPTES_PRO_TABLE,
  FCU_CONNEXION_ESPACE_GESTIONNAIRE: FCU_CONNEXION_ESPACE_GESTIONNAIRE_TABLE,
  FCU_CONTACT_CHALEUR_RENOUVELABLE: FCU_CONTACT_CHALEUR_RENOUVELABLE_TABLE,
  FCU_CONTACT_ENTRETIEN_UTILISATEUR: FCU_CONTACT_ENTRETIEN_UTILISATEUR_TABLE,
  FCU_CONTRIBUTION: FCU_CONTRIBUTION_TABLE,
  FCU_FORMULAIRE_COMMUNES_SANS_RESEAU: FCU_FORMULAIRE_COMMUNES_SANS_RESEAU_TABLE,
  FCU_FORMULAIRE_DE_CONTACT: FCU_FORMULAIRE_DE_CONTACT_TABLE,
  FCU_FUTURS_RESEAUX_DE_CHALEUR: FCU_FUTURS_RESEAUX_DE_CHALEUR_TABLE,
  FCU_GESTIONNAIRES: FCU_GESTIONNAIRES_TABLE,
  FCU_MODIFICATIONS_RESEAU: FCU_MODIFICATIONS_RESEAU_TABLE,
  FCU_NEWSLETTER: FCU_NEWSLETTER_TABLE,
  FCU_RESEAUX_DE_CHALEUR: FCU_RESEAUX_DE_CHALEUR_TABLE,
  FCU_RESEAUX_DE_FROID: FCU_RESEAUX_DE_FROID_TABLE,
  FCU_TEST_EN_MASSE: FCU_TEST_EN_MASSE_TABLE,
  INT_DEPLOIEMENT: INT_DEPLOIEMENT_TABLE,
  INT_LISTE_RESEAUX_FRANCE: INT_LISTE_RESEAUX_FRANCE_TABLE,
  INT_PROSPECTS_LYON_METROPOLE: INT_PROSPECTS_LYON_METROPOLE_TABLE,
  JOURNALISTES: JOURNALISTES_TABLE,
  UTILISATIONS_DONNEES_IFRAME: UTILISATIONS_DONNEES_IFRAME_TABLE,
} as const satisfies Record<string, FcuProdGristTableName>;

const GRIST_DOC_URL_PATTERN = /^(https?:\/\/[^/]+(?:\/o\/[^/]+)?)\/(?:doc\/([^/?#]+)|([^/?#]{12,}))/;

const normalizeServer = (server: string) => server.replace(/\/$/, '');

export const resolveGristDoc = ({ docIdOrUrl }: Pick<GristDocOptions, 'docIdOrUrl' | 'server'>) => {
  if (!docIdOrUrl) {
    throw new Error('Missing GRIST_API_ENDPOINT');
  }

  const match = GRIST_DOC_URL_PATTERN.exec(docIdOrUrl);

  return {
    docId: match?.[2] ?? match?.[3],
    server: normalizeServer(match?.[1] || ''),
  };
};

export const createGristDocApi = ({ docIdOrUrl }: GristDocOptions) => {
  const resolvedDoc = resolveGristDoc({
    docIdOrUrl: docIdOrUrl ?? process.env.GRIST_API_ENDPOINT,
  });

  return {
    apiKey: process.env.GRIST_API_KEY,
    chunkSize: 500,
    docId: resolvedDoc.docId,
    server: resolvedDoc.server,
  };
};

const buildGristDocUrl = (server: string, docId: string, path: string) => {
  return `${server}/api/docs/${docId}/${path}`;
};

const chunkRecords = <TRecord>(records: TRecord[], chunkSize: number) => {
  const chunks: TRecord[][] = [];

  for (let index = 0; index < records.length; index += chunkSize) {
    chunks.push(records.slice(index, index + chunkSize));
  }

  return chunks;
};

const toGristTableData = (records: GristRecord[]): GristTableData => {
  const columnNames = Array.from(new Set(records.flatMap((record) => Object.keys(record))));

  return columnNames.reduce<GristTableData>((tableData, columnName) => {
    tableData[columnName] = records.map((record) => (record[columnName] ?? null) as GristCellValue);
    return tableData;
  }, {});
};

const fromGristTableData = <TRecord extends GristRecord>(tableData: Record<string, GristCellValue[]>): TRecord[] => {
  const rowIds = tableData.id;

  if (!Array.isArray(rowIds)) {
    throw new Error('Unexpected Grist table payload: missing "id" column.');
  }

  return rowIds.map((_, rowIndex) => {
    return Object.fromEntries(
      Object.entries(tableData).map(([columnName, columnValues]) => [columnName, columnValues[rowIndex] ?? null])
    ) as TRecord;
  });
};

export const getGristRows = async <TRecord extends GristRecord>({
  docIdOrUrl,
  filters,
  tableName,
}: GristDocOptions & {
  filters?: Record<string, GristCellValue[]>;
  tableName: string;
}): Promise<TRecord[]> => {
  const gristApi = createGristDocApi({
    docIdOrUrl,
  });
  const queryString = filters ? `?filter=${encodeURIComponent(JSON.stringify(filters))}` : '';
  const response = await fetch(
    buildGristDocUrl(gristApi.server, gristApi.docId || '', `tables/${encodeURIComponent(tableName)}/data${queryString}`),
    {
      headers: {
        Authorization: `Bearer ${gristApi.apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Grist rows from table ${tableName} (status ${response.status})`);
  }

  const payload = (await response.json()) as Record<string, GristCellValue[]>;
  return fromGristTableData<TRecord>(payload);
};

export const addGristRows = async <TRecord extends GristRecord>({
  docIdOrUrl,
  records,
  tableName,
}: GristDocOptions & {
  records: TRecord[];
  tableName: string;
}): Promise<number[]> => {
  const gristApi = createGristDocApi({
    docIdOrUrl,
  });

  if (records.length === 0) {
    return [];
  }

  const rowIds: number[] = [];

  for (const recordsChunk of chunkRecords(records, gristApi.chunkSize)) {
    const response = await fetch(buildGristDocUrl(gristApi.server, gristApi.docId || '', `tables/${encodeURIComponent(tableName)}/data`), {
      body: JSON.stringify(toGristTableData(recordsChunk)),
      headers: {
        Authorization: `Bearer ${process.env.GRIST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to add Grist rows to table ${tableName} (status ${response.status})`);
    }

    rowIds.push(...((await response.json()) as number[]));
  }

  return rowIds;
};
