# Demands Management System Analysis

**Subject**: Comprehensive analysis of the current demands (demandes) management system

**Date**: 2025-11-03

## Executive Summary

The demands system is currently a fully Airtable-based solution that manages user requests for district heating network connections. It features two distinct user interfaces (admin and gestionnaire/pro), automated assignment rules, email notifications, and periodic synchronization jobs.

---

## System Architecture

### Data Storage

**Primary Database**: Airtable

**Main Tables**:
1. **`FCU - Utilisateurs`** (Airtable.DEMANDES_UNUSED)
   - Core demands data
   - Access pattern: REST API via Airtable SDK
   - Configuration: `src/server/db/airtable.ts:9`

2. **`FCU - Utilisateurs relance`** (Airtable.RELANCE)
   - User feedback from relance (follow-up) emails
   - Stores comments when users respond to follow-up emails
   - Linked to demands via `Relance ID`

3. **`FCU - Utilisateurs emails`** (Airtable.UTILISATEURS_EMAILS)
   - Complete history of all emails sent by gestionnaires to prospects
   - Tracks: subject, body, recipients, CC, reply-to, timestamps
   - Linked to demands via `demand_id`

**Supporting PostgreSQL Tables**:
- `assignment_rules`: Stores pattern-based rules for auto-assignment of demands to gestionnaires
- `users`: Contains user accounts (gestionnaires, admins, pros)
- `events`: Audit trail for demand-related actions
- `email_templates`: User-created email templates for common responses

### Type Definitions

**Core Types** (`src/types/Summary/Demand.d.ts`):
- `DemandSummary`: Base demand with id, Nom, Prénom, Adresse, Mode de chauffage, Type de chauffage, Structure, Gestionnaires
- `EditableDemandSummary`: Editable fields for gestionnaires (Prise de contact, Commentaire, Status)
- `Demand`: Full demand object with 30+ fields including contact info, location, network info, building details, assignment, tracking
- `AdminDemand`: Extended demand with recommendedTags, recommendedAssignment, detailedEligibilityStatus, networkTags

**Status Enum** (`src/types/enum/DemandSatus.ts`):
- EMPTY: 'En attente de prise en charge'
- UNREALISABLE: 'Non réalisable'
- WAITING: 'En attente d\'éléments du prospect'
- IN_PROGRESS: 'Étude en cours'
- VOTED: 'Voté en AG'
- WORK_IN_PROGRESS: 'Travaux en cours'
- DONE: 'Réalisé'
- ABANDONNED: 'Projet abandonné par le prospect'

---

## User Interfaces

### 1. Admin Interface (`/admin/demandes`)

**File**: `src/pages/admin/demandes.tsx`
**Authentication**: `['admin']` only

**Purpose**: Validate and assign demands to gestionnaires

**Key Features**:
- **Validation workflow**: Admins review unvalidated demands (`Gestionnaires validés = FALSE`)
- **Auto-suggestions**: System recommends tags (gestionnaires) and assignments based on assignment rules
- **Tag assignment**: Multi-select gestionnaire tags using `FCUTagAutocomplete`
- **Network information**: Edit distance, network ID, and network name
- **Map integration**: Visual representation of demands on map (right panel)
- **Bulk validation**: "Valider" button auto-applies recommended values
- **Delete capability**: Can delete demands before validation

**API Endpoint**: `GET /api/admin/demands`
- Filters: `{Gestionnaires validés} = FALSE()`
- Processing:
  1. Fetches unvalidated demands from Airtable (src/pages/api/admin/demands.ts:11-16)
  2. Retrieves active assignment rules from PostgreSQL (src/pages/api/admin/demands.ts:24-29)
  3. For each demand:
     - Calls `getDetailedEligibilityStatus()` to compute network proximity
     - Evaluates assignment rules to generate `recommendedTags` and `recommendedAssignment`
     - Returns enriched `AdminDemand` object

**Update Endpoint**: `PUT /api/admin/demands/[demandId]`
- File: `src/pages/api/admin/demands/[demandId].ts`
- Allowed updates: Gestionnaires, Affecté à, Distance au réseau, Nom réseau, etc.
- Creates audit event: `demand_assigned` or `demand_updated`

### 2. Gestionnaire/Pro Interface (`/pro/demandes`)

**File**: `src/pages/pro/demandes.tsx`
**Authentication**: `['gestionnaire', 'demo', 'admin']`

**Purpose**: Track and manage assigned demands

**Key Features**:
- **Filtered view**: Shows only demands assigned to user's gestionnaire tags
- **Status management**: Update demand status via dropdown
- **Contact tracking**: Mark "prospect recontacté" checkbox
- **Email integration**: Send emails to prospects via `DemandEmailForm` modal
- **Quick filters**: Pre-configured filters for high-priority demands, PDP demands, etc.
- **Data export**: Export to XLSX via `exportService`
- **Advanced filters**: Faceted search on Status, Structure, Mode de chauffage, Distance, etc.

**Quick Filter Presets**:
1. **All demands**: Total count
2. **High potential** (`haut_potentiel`): Collective heating <100m (60m Paris), or 100+ units, or tertiary
3. **To process**: Status='En attente de prise en charge' AND NOT contacted
4. **In PDP**: Demands in priority development perimeter

**API Endpoint**: `GET /api/demands`
- File: `src/pages/api/demands/index.ts`
- Service: `getDemands(req.user)` from `src/server/services/manager.ts:91`
- Filtering logic (src/server/services/manager.ts:99-107):
  - **Admin**: No filter (all demands)
  - **Demo**: Paris network only + validated
  - **Gestionnaire**: Filter by user's gestionnaire tags + validated

**Update Endpoint**: `PUT /api/demands/[demandId]`
- File: `src/pages/api/demands/[demandId].ts`
- Allowed fields: Status, 'Prise de contact', Commentaire, surface, logement, consumption
- Permission check: User must have gestionnaire tag matching demand

---

## Business Logic & Services

### Demand Creation Flow

**Entry Point**: Contact form submission
- Hook: `useContactFormFCU` (src/hooks/useContactFormFCU.ts)
- Service: `formatDataToAirtable()` + `submitToAirtable()` (src/services/airtable.ts)

**API Handler**: `POST /api/airtable/records` (src/pages/api/airtable/records/index.ts)

**Creation Process** (src/pages/api/airtable/records/index.ts:42-93):
1. Create Airtable record with default empty values:
   - `Gestionnaires: [defaultEmptyStringValue]`
   - `Affecté à: defaultEmptyStringValue`
   - `Distance au réseau: defaultEmptyNumberValue`
2. Enrich with external data:
   - Gas consumption via `getConsommationGazAdresse()`
   - Number of housing units via `getNbLogement()`
3. Update record with enriched data
4. Create audit event: `demand_created`
5. Send confirmation email to user

**Data Transformation** (src/services/airtable.ts:85-147):
- Normalizes heating energy/type values
- Handles complex structure types (Tertiaire with Bureau d'études, Syndic, etc.)
- Maps company information based on structure type
- Includes UTM tracking parameters (mtm_campaign, mtm_kwd, mtm_source)

### Assignment Rules System

**Storage**: PostgreSQL `assignment_rules` table
- Fields: `id`, `search_pattern`, `result`, `active`, `created_at`

**Rule Syntax** (src/pages/api/admin/demands.ts:30-46):
- **Pattern**: Expression AST parsed from search pattern
- **Actions**: Parsed from result field
  - `tag:<name>`: Add gestionnaire tag
  - `affecte:<name>`: Assign to gestionnaire

**Evaluation** (src/pages/api/admin/demands.ts:48-81):
1. Parse all active rules' patterns to AST
2. For each demand's `DetailedEligibilityStatus`:
   - Evaluate AST against eligibility data
   - Collect matching tags
   - Take first matching assignment
3. Return `{ tags: string[], assignment: string | null }`

**Example Flow**:
```
Rule: "network.nom CONTAINS 'Paris' AND distance < 100"
Action: "tag:Paris, affecte:Gestionnaire Paris"
→ If demand matches, adds "Paris" to recommendedTags and suggests assignment
```

### Email Notifications

**Services** (src/server/services/manager.ts):

#### 1. New Demands Notification (`dailyNewManagerMail`)
- **Trigger**: Cron daily at 10:00 Mon-Fri (src/server/cron/cron.ts:8-13)
- **Recipients**: Users with `receive_new_demands = true`
- **Filter**: `{Gestionnaires validés} = TRUE() AND {Notification envoyé} = ""`
- **Process**:
  1. Group demands by gestionnaire tag
  2. Group users by gestionnaire tag
  3. Send email per gestionnaire per user
  4. Mark demands with `Notification envoyé: <date>`

#### 2. Stale Demands Reminder (`weeklyOldManagerMail`)
- **Trigger**: Cron Tuesday 09:55 (src/server/cron/cron.ts:15-20)
- **Recipients**: Users with `receive_old_demands = true`
- **Filter**: Status empty/waiting AND notification >7 days ago
- **Process**: Email reminder for each gestionnaire

#### 3. User Relance (`dailyRelanceMail`)
- **Trigger**: Cron Monday 10:05 (src/server/cron/cron.ts:22-27)
- **Recipients**: End users who submitted demands
- **Filter** (src/server/services/manager.ts:35-56):
  - First relance: >1 month, `Relance à activer = TRUE`, not contacted, no relance sent
  - Second relance: >45 days since first relance, still not contacted
- **Process**:
  1. Generate unique UUID per demand
  2. Update `Relance envoyée` or `Seconde relance envoyée` with date
  3. Store UUID in `Relance ID`
  4. Send email with UUID link for user response

**Template**: `relance` email includes link for user to indicate if contacted

### Relance (Follow-up) System

**Purpose**: Track whether users have been contacted by gestionnaires after submitting a demand.

**Components**:

#### 1. Relance Email Workflow

**Trigger**: `dailyRelanceMail` cron (Monday 10:05)

**Criteria** (src/server/services/manager.ts:35-56):
- **First relance**:
  - Demand older than 1 month
  - `Relance à activer = TRUE`
  - `Recontacté par le gestionnaire = ""` (empty)
  - `Relance envoyée = ""` (not sent yet)
- **Second relance**:
  - Demand older than 45 days from first relance
  - Still not contacted by gestionnaire
  - First relance already sent

**Process** (src/server/services/manager.ts:299-323):
1. Generate unique UUID for tracking
2. Update demand fields:
   - `Relance envoyée` or `Seconde relance envoyée` = current date
   - `Relance ID` = UUID
3. Send email to user with links:
   - `/satisfaction?id={uuid}&satisfaction=true` (if contacted)
   - `/satisfaction?id={uuid}&satisfaction=false` (if not contacted)

#### 2. User Response Page (`/satisfaction`)

**File**: `src/pages/satisfaction.tsx`

**Server-Side Processing** (src/pages/satisfaction.tsx:84-88):
- On page load: `updateRelanceAnswer(id, satisfaction)`
- Updates demand: `Recontacté par le gestionnaire = 'Oui'` or `'Non'`

**Client-Side Features**:
- If `satisfaction=false`: Shows message about delays, promises to re-contact gestionnaire
- Optional comment form → submitted to `Airtable.RELANCE` table
- Comment stored with `Relance ID` reference

#### 3. Airtable.RELANCE Table

**Purpose**: Store user feedback/comments from relance responses

**Fields**:
- `id`: Relance UUID
- `comment`: User's optional comment about their experience

**API Handler** (src/pages/api/airtable/records/index.ts:32-40):
- Receives comment with relance UUID
- Finds demand by Relance ID
- Updates demand's `Commentaire relance` field with user comment

**Flow**:
1. User receives relance email
2. Clicks link with UUID
3. `/satisfaction` page updates `Recontacté par le gestionnaire` field
4. User optionally leaves comment
5. Comment saved to RELANCE table AND to demand's `Commentaire relance` field

### Email Tracking System (UTILISATEURS_EMAILS)

**Purpose**: Complete audit trail of all gestionnaire-to-user communications

**Airtable.UTILISATEURS_EMAILS Table Fields**:
- `demand_id`: Links to demand (Airtable record ID)
- `email_key`: Template ID or UUID if custom email
- `object`: Email subject
- `body`: Email body (with `<br />` for newlines)
- `to`: Recipient email
- `cc`: CC recipients (comma-separated)
- `reply_to`: Reply-to address
- `signature`: Gestionnaire's signature
- `user_email`: Gestionnaire who sent the email
- `sent_at`: Timestamp (auto-created by Airtable)

#### Email Sending Flow

**Component**: `DemandEmailForm` (src/components/Manager/DemandEmailForm.tsx)

**Triggered From**: `/pro/demandes` page when gestionnaire clicks contact email button

**Features**:
1. **Email History Display** (src/components/Manager/DemandEmailForm.tsx:82-236):
   - GET `/api/managerEmail?demand_id={id}`
   - Shows all previously sent emails
   - Click to reload template
   - Prevents re-sending same template (marked as disabled)

2. **Template System**:
   - User can save/load custom email templates
   - Templates stored in PostgreSQL `email_templates` table
   - Support for placeholders: `{{Prénom}}`, `{{Nom}}`, `{{Adresse}}`, etc.
   - Preview before sending

3. **Placeholder Processing** (src/components/Manager/DemandEmailForm.tsx:36-58):
   - Replaces `{{key}}` with demand field values
   - Auto-formats dates
   - Available placeholders: Prénom, Nom, Adresse, Date de la demande, Distance au réseau, etc.

4. **Send Process** (src/components/Manager/DemandEmailForm.tsx:117-164):
   - POST `/api/managerEmail` with email content
   - Logs to `UTILISATEURS_EMAILS` table
   - Updates user's signature preference in PostgreSQL
   - Updates demand fields:
     - `Emails envoyés`: Appends subject line (newline-separated list)
     - `Prise de contact = true`
     - Conditional status updates based on template:
       - `koFarFromNetwork`, `koIndividualHeat`, `koOther` → Status = UNREALISABLE
       - `askForPieces` → Status = WAITING

#### Email API Handler (`/api/managerEmail`)

**File**: `src/pages/api/managerEmail.ts`

**GET** (src/pages/api/managerEmail.ts:13-43):
- Fetches email history for a specific demand
- Returns array of email records with all fields

**POST** (src/pages/api/managerEmail.ts:63-111):
1. Validate email content (Zod schema)
2. Log to Airtable `UTILISATEURS_EMAILS` table
3. Update user's signature in PostgreSQL if changed
4. Send actual email via `sendEmailTemplate('manager-email', ...)`

**Email Delivery**:
- Template: `manager-email`
- Custom subject from gestionnaire
- Custom body with processed placeholders
- Custom CC and reply-to headers

---

## Cron Jobs

### 1. syncComptesProFromUsers

**File**: `src/server/services/airtable.ts:16-119`
**Schedule**: Hourly (src/server/cron/cron.ts:29-36)
**Purpose**: Synchronize PostgreSQL users to Airtable `FCU - Comptes pro`

**Process**:
1. Query PostgreSQL `users` table for PROFESSIONNEL/PARTICULIER roles
2. Optional interval filter (only users created in last X time)
3. Fetch all existing `FCU - Comptes pro` records from Airtable
4. For each user:
   - If not in Airtable: **CREATE** new record
   - If exists but unchanged: **SKIP**
   - If exists and changed: **UPDATE** (based on `last_connection` or `active` fields)

**Synced Fields**:
- Email, Nom, Prénom, Téléphone
- Role, Statut, Actif
- Structure info (Type, Nom)
- CGU acceptées, Optin Newsletter
- Créé le, Dernière connexion

**DRY_RUN mode**: Controlled by `DRY_RUN` env variable

**Note**: This cron is NOT directly related to demands, but syncs user accounts that may become gestionnaires.

### 2. Daily/Weekly Email Jobs

See "Email Notifications" section above.

---

## Integration Points

### 1. Airtable Integration

**Tables Used**:
- `FCU - Utilisateurs` (DEMANDES): Main demands table
- `FCU - Comptes pro` (COMPTES_PRO): User accounts sync
- `FCU - Utilisateurs emails` (UTILISATEURS_EMAILS): Email tracking and history
- `FCU - Utilisateurs relance` (RELANCE): User feedback from follow-up emails

**Access Pattern**:
- SDK: `airtable` library via `AirtableDB()` helper
- Operations: create, update, select with filters, destroy
- Typecast: Always used for flexible field types

**Usage by Table**:
- **DEMANDES**: CRUD operations for demands, filtered queries for assignments
- **UTILISATEURS_EMAILS**: Create (on email send), Read (email history display)
- **RELANCE**: Create (user comment), Update parent demand's `Commentaire relance`
- **COMPTES_PRO**: Hourly sync from PostgreSQL users table

### 2. PostgreSQL Integration

**Tables**:
- `assignment_rules`: Auto-assignment logic
- `users`: Authentication, gestionnaire tags, email preferences
- `events`: Audit trail (demand_created, demand_updated, demand_assigned, demand_deleted)

**ORM**: Kysely query builder

### 3. External Services

**Address Information** (`src/server/services/addresseInformation`):
- `getDetailedEligibilityStatus(lat, lon)`: Network proximity, PDP status, commune
- `getConsommationGazAdresse(lat, lon)`: Gas consumption data
- `getNbLogement(lat, lon)`: Building unit count

**Email Service** (`src/server/email`):
- `sendEmailTemplate()`: Template-based emails
- Templates: `creation-demande`, `new-demands`, `old-demands`, `relance`

### 4. Analytics

**Matomo Tracking**:
- UTM parameters captured on demand creation
- Events tracked: address eligibility, form submissions

---

## User Permissions Model

**Roles**:
1. **Admin**: Full access to all demands, validation interface, deletion
2. **Gestionnaire**: Access to demands with matching gestionnaire tags, can update status/comments
3. **Demo**: Read-only access to Paris demands (fake data shown)
4. **Particulier/Professionnel**: No access to demand management (only create demands)

**Access Control**:
- Server-side: `withAuthentication(['admin', 'gestionnaire'])` HOC
- Data filtering: Airtable queries filtered by `Gestionnaires` field matching user tags
- Update validation: Permission check before allowing edits

---

## Key Files Reference

### Frontend Pages
- `src/pages/admin/demandes.tsx`: Admin validation interface
- `src/pages/pro/demandes.tsx`: Gestionnaire management interface
- `src/pages/satisfaction.tsx`: User relance response page

### API Routes
**Demands**:
- `src/pages/api/admin/demands.ts`: GET admin demands
- `src/pages/api/admin/demands/[demandId].ts`: PUT/DELETE admin demand
- `src/pages/api/demands/index.ts`: GET gestionnaire demands
- `src/pages/api/demands/[demandId].ts`: PUT gestionnaire demand
- `src/pages/api/airtable/records/index.ts`: POST create demand/relance

**Email & Communication**:
- `src/pages/api/managerEmail.ts`: GET email history, POST send email
- `src/pages/api/user/email-templates/[[...slug]].ts`: CRUD email templates

### Services
- `src/server/services/manager.ts`: Core demand business logic
- `src/server/services/airtable.ts`: User sync to Airtable
- `src/server/services/assignment-rules.ts`: Rule management (likely)
- `src/services/airtable.ts`: Client-side data formatting

### Components
- `src/components/Manager/Status.tsx`: Status dropdown
- `src/components/Manager/Contact.tsx`: Contact display
- `src/components/Manager/Contacted.tsx`: Checkbox for contact tracking
- `src/components/Manager/Comment.tsx`: Comment field
- `src/components/Manager/DemandEmailForm.tsx`: Email modal
- `src/components/Manager/DemandStatusBadge.tsx`: Status badge
- `src/components/Admin/TableFieldInput.tsx`: Editable field input

### Database
- `src/server/db/airtable.ts`: Airtable connection
- `src/server/db/kysely/database.ts`: PostgreSQL types
- `src/server/db/migrations/20250706000003_add_table_assignment_rules.ts`: Assignment rules table

### Types
- `src/types/Summary/Demand.d.ts`: Demand type definitions
- `src/types/enum/DemandSatus.ts`: Status enum
- `src/types/enum/Airtable.ts`: Airtable table names

### Cron
- `src/server/cron/cron.ts`: Cron job registration
- `src/server/cron/launch.ts`: Job launcher

---

## Data Flow Diagrams

### Demand Creation Flow
```
User Form → useContactFormFCU hook
  → formatDataToAirtable()
  → POST /api/airtable/records
    → Create Airtable record with defaults
    → Enrich: getConsommationGazAdresse(), getNbLogement()
    → Update Airtable with enriched data
    → createEvent(demand_created)
    → sendEmailTemplate(creation-demande)
  → Return demand ID
```

### Admin Validation Flow
```
Admin opens /admin/demandes
  → GET /api/admin/demands
    → Fetch unvalidated from Airtable
    → Fetch assignment_rules from PostgreSQL
    → For each demand:
      → getDetailedEligibilityStatus()
      → evaluateAST(rules, eligibilityStatus)
      → Return AdminDemand with recommendations
  → Admin reviews, edits tags/assignment
  → Click "Valider"
    → PUT /api/admin/demands/[demandId]
      → Update Airtable: Gestionnaires validés = true
      → createUserEvent(demand_assigned)
```

### Gestionnaire Management Flow
```
Gestionnaire opens /pro/demandes
  → GET /api/demands
    → Filter by user's gestionnaire tags
    → Return validated demands only
  → Update status/contact/comment
    → PUT /api/demands/[demandId]
      → Permission check: user tag matches demand
      → Update Airtable
      → createUserEvent(demand_updated)
```

### Relance (Follow-up) Flow
```
Cron: dailyRelanceMail (Monday 10:05)
  → Fetch demands: >1 month old, Relance à activer = TRUE, not contacted
  → For each demand:
    → Generate UUID
    → Update demand: Relance envoyée = date, Relance ID = UUID
    → Send email with links:
      - /satisfaction?id={UUID}&satisfaction=true
      - /satisfaction?id={UUID}&satisfaction=false

User clicks link
  → Lands on /satisfaction page
    → getServerSideProps: updateRelanceAnswer(UUID, true/false)
      → Find demand by Relance ID
      → Update: Recontacté par le gestionnaire = 'Oui'/'Non'
    → Client side: Optional comment form
      → POST /api/airtable/records (type: RELANCE)
        → Find demand by Relance ID
        → Update: Commentaire relance = comment
```

### Email Tracking Flow
```
Gestionnaire clicks email icon on /pro/demandes
  → Modal opens: DemandEmailForm
    → GET /api/managerEmail?demand_id={id}
      → Fetch from UTILISATEURS_EMAILS table
      → Return email history array
    → Display history (clickable to reload templates)

  → Gestionnaire composes email:
    → Select template OR write custom
    → Fill placeholders: {{Prénom}}, {{Adresse}}, etc.
    → Preview with processed placeholders

  → Click "Envoyer"
    → POST /api/managerEmail
      → Create record in UTILISATEURS_EMAILS:
        - demand_id, email_key, object, body, to, cc, reply_to
        - signature, user_email, sent_at (auto)
      → Update user signature in PostgreSQL if changed
      → Send actual email via sendEmailTemplate('manager-email')
      → Update demand in DEMANDES:
        - Emails envoyés += subject + '\n'
        - Prise de contact = true
        - Status = UNREALISABLE/WAITING (conditional on template)
```

---

## Critical Workflows

### 1. Assignment Rule Application
- **When**: On admin demand list load
- **Process**: Parse rules → evaluate against eligibility data → suggest tags/assignment
- **Output**: `recommendedTags`, `recommendedAssignment` fields on AdminDemand

### 2. Demand Enrichment
- **When**: On demand creation
- **External calls**:
  - Gas consumption API
  - Building data API (BNB)
- **Updates**: Conso, Logement fields in Airtable

### 3. Email Notification Cycles
- **Daily**: New demands notification (10:00)
- **Weekly**: Stale demands reminder (Tue 09:55)
- **Monthly+**: User relance system (Mon 10:05)

### 4. User Sync
- **Frequency**: Hourly
- **Direction**: PostgreSQL → Airtable
- **Purpose**: Keep Airtable up-to-date with user account changes

### 5. Relance System
- **When**: Cron Monday 10:05, for demands >1 month old not contacted
- **Process**: Generate UUID → email with satisfaction links → user response updates demand
- **Tracking**: Two-tier relance (1 month, then 45 days later)
- **Data Storage**: Response in demand field, optional comment in RELANCE table

### 6. Email Communication Tracking
- **When**: Gestionnaire sends email from /pro/demandes
- **Process**: Log to UTILISATEURS_EMAILS → send email → update demand fields
- **Features**: Template system, placeholder replacement, email history, auto-status updates
- **Audit**: Complete record of all gestionnaire-to-user emails with metadata


