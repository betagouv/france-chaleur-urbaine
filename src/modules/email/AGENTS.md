# Email Module - AI Directives

## Architecture

Module qui produit et envoie les emails transactionnels de l'application.
Le rendu HTML/texte est assuré par les composants atomiques de
[`react-email`](https://react.email/) (`Layout`, `Text`, `Button`…).

```
src/modules/email/
├── email.config.tsx           # Registre central : tous les templates, leurs scénarios et métadonnées
├── index.tsx                  # `sendEmailTemplate(...)` : rendu + envoi via nodemailer
├── scenarios.ts               # Helper `defineEmailScenarios` + types associés (sans dépendance vers la config)
├── react-email/
│   └── components.tsx         # Composants atomiques réutilisables
├── templates/                 # Un fichier par template, organisés par <module>/<destinataire>/
│   ├── auth/
│   │   ├── gestionnaire/
│   │   │   └── ouverture-espace.tsx
│   │   └── utilisateur/
│   │       ├── confirmation-inscription.tsx
│   │       └── reinitialisation-mot-de-passe.tsx
│   └── demands/
│       ├── demandeur/
│       └── gestionnaire/
├── server/
│   ├── trpc-routes.ts             # Routers `email.list`, `email.preview` et `email.deliverability.*` (tous admin)
│   ├── brevo-client.ts            # Appels HTTP à l'API Brevo (liste des bloqués, événements, déblocage)
│   └── deliverability-service.ts  # Sync de la blocklist Brevo → `email_blocked_contacts`, statut, déblocage, events
└── client/
    ├── EmailDeliverabilityPanel.tsx  # Statut de délivrabilité d'une adresse (admin) + déblocage + historique
    ├── EmailEventsList.tsx           # Timeline des événements Brevo d'une adresse
    ├── EmailBlockedBadge.tsx         # Badge « Emails bloqués » + raccourci de déblocage (tableaux users / demandes / stats réseaux, taille `xs` pour les cellules denses)
    ├── EmailUnblockButton.tsx        # Bouton icône de déblocage avec confirmation, grisé si écritures désactivées
    └── admin/
        ├── EmailsPage.tsx                # Visualiseur dans /admin/emails
        └── EmailDeliverabilityPage.tsx   # Inventaire des adresses bloquées dans /admin/email-delivery
```

## Délivrabilité (Brevo)

L'envoi SMTP réussit même quand Brevo bloque le destinataire (hard bounce, désinscription, plainte) : le blocage n'est visible que via l'API Brevo. Le module miroir la blocklist transactionnelle dans la table `email_blocked_contacts` (owned) :

- **Sync** : `syncBlockedContacts()` (cron `syncEmailBlockedContacts`, `0 7-21 * * *`, et mutation admin). Remplacement complet de la table, puis événements sur transition : `user_email_blocked` / `demand_email_blocked` (datés `blocked_at` Brevo, idempotents) et `user_email_unblocked` / `demand_email_unblocked` (source `external`). Le matching se fait sur `lower(users.email)` et `lower(demands.legacy_values->>'Mail')`.
- **Statut** : `getEmailDeliverability(email)` = ligne locale uniquement (pas d'appel Brevo). **Historique** : `listEmailEventsForAdmin(email)` = événements Brevo en direct (90 jours max), chargé au clic dans le panneau ; une erreur API est renvoyée dans `error` (message brut affiché à l'admin), jamais levée.
- **Déblocage** (admin uniquement, pas de self-service : les utilisateurs ne sont pas censés pouvoir se désinscrire) : `unblockEmail(email, { adminUserId })` appelle `DELETE /smtp/blockedContacts/{email}`, supprime la ligne, trace `*_email_unblocked` (source `admin`). Refusé (`FORBIDDEN`) si `BREVO_ALLOW_WRITES` est faux : le compte Brevo est partagé par tous les environnements, seule la prod peut écrire.
- **Dates Brevo** : `blockedAt` (liste des bloqués) est l'heure locale du compte (Europe/Paris) avec un suffixe `Z` trompeur, alors que les événements portent un vrai offset (`+02:00`) ; toujours passer par `parseBrevoDate()` (`brevo-client.ts`), jamais `new Date()` sur une date Brevo.
- **Config** : `BREVO_API_KEY` (optionnelle, tout est no-op sans elle), `BREVO_ALLOW_WRITES` (défaut `false`).
- **Listes admin** : `users.list()`, `demands.admin.list` et `demands.admin.getReseauxStats` (par utilisateur du réseau) exposent `email_blocked_reason` (left join sur la table) pour les badges et filtres.

| Procédure | Type | Auth | Description |
|-----------|------|------|-------------|
| `email.deliverability.getSettings` | query | admin | Clé configurée, écritures autorisées (pour griser les boutons) |
| `email.deliverability.getEmailDeliverability` | query | admin | Statut local (bloqué ou non) d'une adresse |
| `email.deliverability.listEmailEvents` | query | admin | Événements Brevo d'une adresse (à la demande) |
| `email.deliverability.listBlockedContacts` | query | admin | Inventaire des bloqués (+ compte et nb de demandes liés) |
| `email.deliverability.unblockContact` | mutation | admin | Réactive une adresse côté Brevo |
| `email.deliverability.syncBlockedContacts` | mutation | admin | Lance la synchronisation |

Ne pas ajouter de header `X-Mailin-Tag` aux envois (décision produit : pas de nom de template dans les entêtes reçus par les utilisateurs).

## Convention de nommage

Clés des templates dans `email.config.tsx` :

```
<module>.<destinataire>.<intention>
```

- **module** : `auth` ou `demands`.
- **destinataire** : `utilisateur`, `gestionnaire`, `demandeur`.
- **intention** : verbe ou expression courte en kebab-case français
  (ex: `confirmation-inscription`, `message-gestionnaire`, `enquete-satisfaction`).

L'arborescence des fichiers `templates/` reflète cette convention.

## Créer un nouveau template

### 1. Fichier du composant

```tsx
// templates/auth/utilisateur/mon-email.tsx
import { defineEmailScenarios } from '@/modules/email/scenarios';
import { Button, Layout, Text } from '@/modules/email/react-email/components';

const MonEmail = ({ token }: { token: string }) => (
  <Layout>
    <Text>Bonjour,</Text>
    <Button href={`/lien?token=${token}`}>Action</Button>
  </Layout>
);

// Scénarios pré-paramétrés affichés dans /admin/emails.
// Le helper applique un type-checking strict sur les props du composant.
export const scenarios = defineEmailScenarios<typeof MonEmail>({
  defaut: {
    label: 'Cas par défaut',
    props: { token: 'sample-token' },
  },
});

export default MonEmail;
```

**Règles** :
- Les composants importent **uniquement** depuis `@/modules/email/react-email/components`,
  jamais directement depuis `react-email`.
- Tout template doit déclarer au moins un scénario (clé `defaut` en général).
- Pour des templates avec branches conditionnelles (éligibilité, distance, type
  de bâtiment…), exposer un scénario par cas significatif — ils seront tous
  navigables dans l'admin.

### 2. Enregistrement dans `email.config.tsx`

La map est wrappée dans le helper `defineEmails({ ... })` qui :

- préserve les types littéraux des clés (utilisés pour `EmailType`) ;
- capture le type précis de chaque `Component` ;
- **valide à la compilation** que le `scenarios` de chaque entrée matche les
  props du `Component` de la même entrée (impossible de mélanger les
  scénarios d'un email avec un autre — TS rejette).

Ajouter une entrée :

```tsx
import MonEmail, { scenarios as monEmailScenarios } from './templates/.../mon-email';

export const emails = defineEmails({
  // ... entrées existantes
  'auth.utilisateur.mon-email': {
    Component: MonEmail,
    scenarios: monEmailScenarios,
    label: 'Mon email',
    description: 'Phrase descriptive (rôle + destinataire + déclencheur).',
    subject: '[France Chaleur Urbaine] Sujet',
    preview: 'Ligne de preview',
  },
});
```

Champs obligatoires :

- `Component` : default export du fichier de template.
- `scenarios` : export nommé `scenarios` du fichier — **renommer à l'import**
  pour éviter les collisions (`scenarios as monEmailScenarios`).
- `label` : titre humain affiché dans la sidebar de l'admin.
- `description` : phrase descriptive.
- `subject` : sujet par défaut envoyé au destinataire.
- `preview` : ligne de preview affichée par certains clients mail.

## Envoyer un email

```ts
import { sendEmailTemplate } from '@/modules/email';

await sendEmailTemplate(
  'auth.utilisateur.confirmation-inscription',
  { email: 'user@example.com' },
  { activationToken: 'abc' }
);
```

Le typing garantit que `templateProps` correspond aux props du composant cible.

## Composants disponibles

Depuis `@/modules/email/react-email/components` :

`Layout`, `Text`, `Title`, `Button`, `Link`, `Note`, `Callout`, `Table`,
`TableRow`, `TableColumn`, `Section`, `Row`, `Column`, `Hr`, `Markdown`,
`Img`, `LogoFCU`, `LogoRF`, `LogoADEME`.

Ne pas créer de composants stylés ad-hoc dans les templates — étendre
`components.tsx` si un nouveau primitif est nécessaire.

## Visualiser les templates

La page `/admin/emails` (rôle `admin` requis) liste tous les modèles avec
sélecteur de scénario et rendu HTML/texte. C'est la seule façon supportée
de prévisualiser les emails (pas de `dev:email`).

## Tests

Les tests d'intégration (`*.integration.spec.ts`) qui déclenchent l'envoi
d'emails mockent `sendEmailTemplate` :

```ts
vi.mock('@/modules/email', () => ({
  sendEmailTemplate: vi.fn().mockResolvedValue(undefined),
}));
```
