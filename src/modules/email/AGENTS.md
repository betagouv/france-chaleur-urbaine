# Email Module - AI Directives

## Architecture

This module uses **[react-email](https://react.email/)** to build and render email templates.

### Directory Structure

```
src/modules/email/
├── email.config.tsx           # Email template registry
├── react-email/
│   ├── components.tsx         # Reusable email components
│   └── templates/            # Email templates organized by module
│       ├── auth/             # Authentication emails
│       ├── demands/          # Demand-related emails
│       └── legacy/           # Legacy templates
```

## Creating Email Templates

### 1. Template Structure

Each folder in `templates/` corresponds to a **functional module** (auth, demands, etc.).

Create your template file inside the appropriate module folder:
- `templates/auth/` for authentication-related emails
- `templates/demands/` for demand management emails
- `templates/legacy/` for legacy/deprecated templates

### 2. Component Imports

**IMPORTANT:** Always import components using relative path `../../components`:

```tsx
import { Layout, Text, Button, Title, Link } from '../../components';
```

**NEVER** import directly from `@react-email/components`.

### 3. Shared Test Data

**STANDARD:** Use `./_data.ts` to share test entities across multiple email templates in the same module.

Create a `_data.ts` file in your template folder to define reusable test data:

```tsx
// templates/demands/_data.ts
import type { AirtableLegacyRecord } from '@/modules/demands/types';

export const demand: AirtableLegacyRecord = {
  Nom: 'MARTIN',
  Prénom: 'ALICE',
  Mail: 'a.martin@email.com',
  // ... other fields
};

export const anotherDemand: AirtableLegacyRecord = {
  // ... another test case
};
```

Then import in your templates:

```tsx
import { demand } from './_data';

MyTemplate.PreviewProps = { demand };
```

**Benefits:**
- Single source of truth for test data across multiple templates
- Consistent test scenarios
- Easier maintenance

### 4. Available Components

Only use components exported from `components.tsx`:
- `Layout` - Base email layout with header/footer
- `Text` - Styled text paragraph
- `Title` - Section title
- `Button` - CTA button
- `Link` - Hyperlink
- `Note` - Small footnote text
- `Callout` - Highlighted info box (blue left border, for critical instructions)
- `Table`, `TableRow`, `TableColumn` - Table components
- `Section`, `Row`, `Column` - Layout components
- `Hr` - Horizontal rule
- `Markdown` - Markdown content
- `LogoFCU`, `LogoRF` - Brand logos

### 5. Template Pattern

```tsx
import type { SomeType } from '@/modules/some-module/types';
import { Layout, Text, Button, Title } from '../../components';
import { sampleData } from './_data';

const MyModuleEmailTemplate = ({ data }: { data: SomeType }) => {
  return (
    <Layout>
      <Title>Email Title</Title>
      <Text>Email content here...</Text>
      <Button href="https://example.com">Call to Action</Button>
    </Layout>
  );
};

// REQUIRED: Define preview props for testing
MyModuleEmailTemplate.PreviewProps = { data: sampleData };

export default MyModuleEmailTemplate;
```

### 6. Preview Props

**Always** add `.PreviewProps` to your template component for development and testing:

```tsx
MyTemplate.PreviewProps = {
  user: testUserData,
  token: 'sample-token'
};
```

This allows the template to be previewed in the React Email dev tools.

## Registering Templates

### In `email.config.tsx`

Add your template to the `emails` object with the following naming convention:

**Format:** `'<module>.<template-name>'`

Example:
```tsx
export const emails = {
  // Auth module templates
  'auth.activation': {
    Component: AuthActivationEmail,
    preview: 'Finalisez votre inscription en confirmant votre adresse email',
    subject: '[France Chaleur Urbaine] Confirmez votre email',
  },

  // Demands module templates
  'demands.admin-new': {
    Component: DemandAdminNewEmail,
    preview: 'Une nouvelle demande de contact a �t� cr��e',
    subject: '[France Chaleur Urbaine] Nouvelle demande de contact',
  },

  // Your new template
  'mymodule.template-name': {
    Component: MyModuleEmailTemplate,
    preview: 'Short preview text',
    subject: '[France Chaleur Urbaine] Subject line',
  },
} as const;
```

**Prefix Convention:**
- Use the module name as prefix: `auth.`, `demands.`, etc.
- Use kebab-case for template names: `admin-new`, `user-relance`

## Example: Complete Template

```tsx
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { Layout, Link, Note, Table, TableColumn, TableRow, Text, Title } from '../../components';
import { demand as demandData } from './_data';

const DemandAdminNewEmail = ({ demand }: { demand: AirtableLegacyRecord }) => {
  return (
    <Layout>
      <Title>Nouvelle demande de contact reçue</Title>

      <Text>Une nouvelle demande de contact a été créée sur France Chaleur Urbaine avec les informations suivantes :</Text>

      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Nom</TableColumn>
          <TableColumn>{demand.Nom}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Email</TableColumn>
          <TableColumn>
            <Link href={`mailto:${demand.Mail}`}>{demand.Mail}</Link>
          </TableColumn>
        </TableRow>
      </Table>

      <Note>Cette demande a été automatiquement générée par le système France Chaleur Urbaine.</Note>
    </Layout>
  );
};

DemandAdminNewEmail.PreviewProps = { demand: demandData };

export default DemandAdminNewEmail;
```

## Sending Emails

Use the `sendEmailTemplate` helper from the email service:

```tsx
import { sendEmailTemplate } from '@/server/email';

await sendEmailTemplate('demands.admin-new',
  { email: 'recipient@example.com' },
  { demand: demandData }
);
```

## Testing

1. Create test data in `_data.ts` file in your template folder
2. Use `.PreviewProps` to reference test data
3. Preview templates using React Email dev tools: `pnpm email:dev`

## Key Rules

1. **DO** import components from `@/modules/email/react-email/components`
2. **DO** add `.PreviewProps` to all templates
3. **DO** use only components from `components.tsx`
4. **DO** prefix template keys with module name in `email.config.tsx`
5. L **DON'T** import from `@react-email/components` directly
6. L **DON'T** create custom styled components outside of `components.tsx`
