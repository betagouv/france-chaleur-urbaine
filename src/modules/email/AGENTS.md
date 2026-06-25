# Email Module - AI Directives

## Architecture

Module qui produit et envoie les emails transactionnels de l'application.
Le rendu HTML/texte est assuré par les composants atomiques de
[`@react-email/components`](https://react.email/) (`Layout`, `Text`, `Button`…).

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
│   └── trpc-routes.ts         # Router admin (`email.list`, `email.preview`)
└── client/
    └── admin/
        └── EmailsPage.tsx     # Visualiseur dans /admin/emails
```

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
  jamais directement depuis `@react-email/components`.
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
