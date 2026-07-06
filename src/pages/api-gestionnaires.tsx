import { Fragment } from 'react';
import { z } from 'zod';

import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import CallOut from '@/components/ui/CallOut';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import TableBasic from '@/components/ui/TableBasic';
import Text from '@/components/ui/Text';
import { type DemandDTO, demandeStatuts, zDemande } from '@/modules/partner-api/schema';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { type FlattenValues, hasProperty } from '@/utils/typescript';

// Le tableau des champs est DÉRIVÉ du contrat zod (`zDemande`) — même source que le DTO renvoyé et la spec OpenAPI.
// Aucune liste de champs maintenue à la main ⇒ pas de risque d'oubli entre doc / spec / réponse.
type FieldRow = { name: string; type: string; description: string };
type FieldGroup = { category: string; fields: FieldRow[] };

type JsonSchemaNode = {
  type?: string | string[];
  enum?: unknown[];
  description?: string;
  properties?: Record<string, JsonSchemaNode>;
  anyOf?: JsonSchemaNode[];
};

const demandeSchema = z.toJSONSchema(zDemande, { target: 'draft-2020-12' }) as JsonSchemaNode;

/** Objet sous-jacent d'un nœud (gère un objet nullable `anyOf: [object, null]`). */
const objectOf = (node: JsonSchemaNode): JsonSchemaNode | null => {
  if (node.type === 'object' && node.properties) return node;
  return node.anyOf?.find((b) => b.type === 'object' && b.properties) ?? null;
};

const typeLabel = (node: JsonSchemaNode): string => {
  if (node.anyOf) {
    const nonNull = node.anyOf.find((b) => b.type !== 'null');
    const base = nonNull ? typeLabel(nonNull) : 'object';
    return node.anyOf.some((b) => b.type === 'null') ? `${base} | null` : base;
  }
  if (node.enum) return 'string';
  const t = node.type;
  if (Array.isArray(t)) {
    const base = t.filter((x) => x !== 'null').join(' | ') || 'null';
    return t.includes('null') ? `${base} | null` : base;
  }
  return t === 'integer' ? 'number' : (t ?? 'unknown');
};

const demandFieldGroups: FieldGroup[] = (() => {
  const properties = demandeSchema.properties ?? {};
  const rootFields: FieldRow[] = [];
  const groups: FieldGroup[] = [];

  for (const [key, node] of Object.entries(properties)) {
    const obj = objectOf(node);
    if (obj?.properties) {
      const nullable = node.anyOf?.some((b) => b.type === 'null');
      groups.push({
        category: nullable ? `${key} (peut être null)` : key,
        fields: Object.entries(obj.properties).map(([fieldKey, fieldNode]) => ({
          description: fieldNode.description ?? '',
          name: `${key}.${fieldKey}`,
          type: typeLabel(fieldNode),
        })),
      });
    } else {
      rootFields.push({ description: node.description ?? '', name: key, type: typeLabel(node) });
    }
  }

  return [{ category: 'Champs racine', fields: rootFields }, ...groups];
})();

const SAMPLE_VALUES: FlattenValues<DemandDTO> = {
  'batiment.energie_chauffage': 'Gaz',
  'batiment.etablissement': null,
  'batiment.nombre_logements': 48,
  'batiment.surface_m2': 3200,
  'batiment.type_chauffage': 'Collectif',
  'batiment.type_structure': 'Copropriété',
  commentaire: 'RDV technique planifié le 12/06',
  'contact.email': 'c.martin@example.com',
  'contact.nom': 'Martin',
  'contact.prenom': 'Claire',
  'contact.telephone': '+33 6 12 34 56 78',
  date_creation: '2026-05-14T09:12:00.000Z',
  date_modification: '2026-06-02T15:30:00.000Z',
  'eligibilite.dans_pdp': true,
  'eligibilite.distance_reseau_m': 42,
  id: '3f9a2b7c-1d4e-4f8a-9c2b-7e5d6a1b0c3d',
  'localisation.adresse': '8 rue des Olivettes',
  'localisation.code_postal': '44000',
  'localisation.commune_code': '44109',
  'localisation.commune_label': 'Nantes',
  'localisation.departement_code': '44',
  'localisation.departement_label': 'Loire-Atlantique',
  'localisation.latitude': 47.2138,
  'localisation.longitude': -1.5561,
  'localisation.region_code': '52',
  'localisation.region_label': 'Pays de la Loire',
  'reseau.gestionnaire': 'Dalkia',
  'reseau.id_fcu': 480,
  'reseau.identifiant_sncu': '4401C',
  'reseau.maitre_ouvrage': 'Nantes Métropole',
  'reseau.nom': 'Réseau de Nantes',
  'reseau.type': 'reseau_de_chaleur',
  statut: DEMANDE_STATUS.RECONTACTED,
};

type ExampleLine = { id: string; text: string; comment: string };

/** Exemple de demande annoté : clés + descriptions dérivées de `zDemande`, valeurs issues de `SAMPLE_VALUES`. */
const demandExampleLines: ExampleLine[] = (() => {
  const properties = demandeSchema.properties ?? {};
  const roots: [string, JsonSchemaNode][] = [];
  const groups: [string, JsonSchemaNode, JsonSchemaNode][] = [];
  for (const [key, node] of Object.entries(properties)) {
    const obj = objectOf(node);
    if (obj?.properties) groups.push([key, node, obj]);
    else roots.push([key, node]);
  }

  const lines: ExampleLine[] = [];
  const push = (text: string, comment: string) => lines.push({ comment, id: `l${lines.length}`, text });
  const value = (key: string) => (hasProperty(SAMPLE_VALUES, key) ? JSON.stringify(SAMPLE_VALUES[key]) : '…');
  const total = roots.length + groups.length;
  let index = 0;

  for (const [key, node] of roots) {
    index += 1;
    push(`    ${JSON.stringify(key)}: ${value(key)}${index === total ? '' : ','}`, node.description ?? '');
  }
  for (const [key, node, obj] of groups) {
    index += 1;
    push(`    ${JSON.stringify(key)}: {`, node.anyOf?.some((b) => b.type === 'null') ? 'peut être null' : '');
    const fields = Object.entries(obj.properties ?? {});
    fields.forEach(([fieldKey, fieldNode], i) => {
      push(
        `      ${JSON.stringify(fieldKey)}: ${value(`${key}.${fieldKey}`)}${i === fields.length - 1 ? '' : ','}`,
        fieldNode.description ?? ''
      );
    });
    push(`    }${index === total ? '' : ','}`, '');
  }
  return lines;
})();

/**
 * Page publique de documentation de l'API partenaire (synchronisation CRM ↔ FCU).
 * Le contrat de données est dérivé de `zDemande` (source unique) ; la spec complète est servie sur /openapi-schema.yaml.
 */
const ApiGestionnairesPage = () => (
  <SimplePage
    title="API gestionnaires — synchronisez votre CRM avec France Chaleur Urbaine"
    description="Pilotez vos demandes de raccordement depuis votre CRM : récupération et mise à jour du statut."
    noIndex
  >
    <Box py="4w" className="fr-container">
      <Heading as="h1" color="blue-france">
        Piloter vos demandes depuis votre CRM
      </Heading>
      <Text mb="4w">
        France Chaleur Urbaine met à disposition une API REST pour <strong>piloter vos demandes de raccordement depuis votre CRM</strong> :
        une route pour les récupérer, une autre pour mettre à jour leur statut. Pour activer un accès,{' '}
        <Link href="/contact">contactez l'équipe FCU</Link>.
      </Text>

      <CallOut variant="blue" iconId="fr-icon-refresh-line" title="Une API dans les deux sens">
        <p>
          Elle relie votre CRM à France Chaleur Urbaine dans les deux sens : une route pour <strong>récupérer</strong> les demandes de vos
          réseaux, une autre pour <strong>mettre à jour leur statut</strong> (et commentaire). Vous suivez l'avancement dans votre outil,
          FCU reste à jour.
        </p>
        <p>
          L’utilisation de l’API dans un sens est conditionnée à la remontée d’information dans l’autre sens. France Chaleur Urbaine se
          réserve le droit de couper l’accès à l’API en cas de non respect de ce système.
        </p>
      </CallOut>

      <Heading as="h2" color="blue-france" mt="6w" mb="1w">
        Authentification
      </Heading>
      <Text>
        Chaque organisation dispose d'un <strong>token</strong> propre, fourni par l'équipe FCU. Il s'envoie dans l'en-tête{' '}
        <code>Authorization</code> et porte le périmètre de l'organisation : vous n'accédez qu'aux demandes des réseaux que vous gérez.
      </Text>
      <Box className="my-2w overflow-x-auto rounded bg-grey-975 p-3">
        <code>Authorization: Bearer &lt;votre-token&gt;</code>
      </Box>

      <Heading as="h2" color="blue-france" mt="6w" mb="1w">
        Récupérer les demandes
      </Heading>
      <Text>
        <code>GET /api/v2/demands?updated_since=2026-06-01T00:00:00Z</code> — renvoie un <strong>tableau JSON</strong> de toutes les
        demandes créées ou modifiées depuis la date fournie, triées par <code>date_modification</code> croissant. Sans{' '}
        <code>updated_since</code>, tout l'historique est renvoyé. Pour une synchro incrémentale, conservez la plus grande{' '}
        <code>date_modification</code> reçue et repassez-la en <code>updated_since</code> au prochain appel. Vous n'accédez qu'aux demandes
        des réseaux rattachés à votre organisation.
      </Text>
      <Box className="my-2w overflow-x-auto rounded bg-grey-975 p-3">
        <code>{`curl -H "Authorization: Bearer <token>" "https://france-chaleur-urbaine.beta.gouv.fr/api/v2/demands?updated_since=2026-06-01T00:00:00Z"`}</code>
      </Box>

      <Heading as="h3" color="blue-france" mt="4w" mb="1w">
        Champs d'une demande
      </Heading>
      <Text mb="2w">
        Chaque demande est renvoyée sous une forme stable et versionnée (indépendante de notre stockage interne), regroupée par thème. Les
        groupes <strong>contact</strong> et <strong>localisation</strong> relèvent du RGPD ; seuls <code>statut</code> et{' '}
        <code>commentaire</code> sont modifiables (voir plus bas).
      </Text>
      <TableBasic bordered>
        <thead>
          <tr>
            <th>Champ</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {demandFieldGroups.map((group) => (
            <Fragment key={group.category}>
              <tr>
                <th colSpan={3} scope="colgroup" className="bg-grey-975">
                  {group.category}
                </th>
              </tr>
              {group.fields.map((field) => (
                <tr key={field.name}>
                  <td>
                    <code>{field.name}</code>
                  </td>
                  <td>
                    <span className="whitespace-nowrap">{field.type}</span>
                  </td>
                  <td>{field.description}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </TableBasic>

      <Heading as="h3" color="blue-france" mt="4w" mb="1w">
        Exemple de réponse
      </Heading>
      <Text mb="2w">
        <code>GET /api/v2/demands</code> renvoie un <strong>tableau JSON</strong> de demandes. Exemple commenté pour une demande (les
        annotations <code>{'//'}</code> ne font pas partie de la réponse) :
      </Text>
      <pre className="my-2w overflow-x-auto rounded bg-grey-975 p-4 text-sm leading-relaxed">
        {'[\n  {\n'}
        {demandExampleLines.map((line) => (
          <Fragment key={line.id}>
            {line.text}
            {line.comment ? <span className="text-gray-500">{`  // ${line.comment}`}</span> : null}
            {'\n'}
          </Fragment>
        ))}
        {'  }\n]'}
      </pre>

      <Heading as="h3" color="blue-france" mt="4w" mb="1w">
        Valeurs du statut
      </Heading>
      <Text mb="2w">
        Le champ <code>statut</code> prend l'une des valeurs suivantes (libellé métier, tel qu'affiché dans France Chaleur Urbaine) :
      </Text>
      <TableBasic bordered>
        <thead>
          <tr>
            <th>Valeur</th>
          </tr>
        </thead>
        <tbody>
          {demandeStatuts.map((statut) => (
            <tr key={statut}>
              <td>
                <code>{statut}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </TableBasic>

      <Heading as="h2" color="blue-france" mt="6w" mb="1w">
        Mettre à jour une demande
      </Heading>
      <Text>
        <code>PATCH /api/v2/demands/&#123;id&#125;</code> — seuls deux champs sont modifiables : <code>statut</code> (l'une des valeurs
        ci-dessus) et <code>commentaire</code>. Tous les autres champs (contact, adresse, affectation du réseau) restent gérés par FCU et
        sont ignorés s'ils sont envoyés.
      </Text>
      <Box className="my-2w overflow-x-auto rounded bg-grey-975 p-3">
        <code>{`curl -X PATCH -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"statut":"Recontacté pour étude","commentaire":"RDV technique planifié"}' "https://france-chaleur-urbaine.beta.gouv.fr/api/v2/demands/<id>"`}</code>
      </Box>

      <Heading as="h2" color="blue-france" mt="6w" mb="1w">
        Données personnelles
      </Heading>
      <Text mb="4w">
        Les demandes contiennent des données personnelles (nom, e-mail, téléphone du prospect). Leur traitement via l'API est soumis au RGPD
        : limitez la conservation à l'usage de raccordement et sécurisez les accès à votre CRM.
      </Text>

      <Box className="rounded border border-blue-300 bg-blue-50/30 p-4">
        <Text>
          <strong>Spécification complète.</strong> La référence OpenAPI (endpoints, schémas, codes d'erreur) est disponible sur{' '}
          <a href="/openapi-schema.yaml">/openapi-schema.yaml</a>. Pour obtenir un accès, contactez l'équipe via la{' '}
          <a href="/contact">page contact</a>.
        </Text>
      </Box>
    </Box>
  </SimplePage>
);

export default ApiGestionnairesPage;
