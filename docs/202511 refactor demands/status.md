# Analyse du Système de Gestion des Demandes

**Sujet** : Analyse complète du système actuel de gestion des demandes (raccordement)

**Date** : 2025-11-03

## Résumé Exécutif

Le système de gestion des demandes est actuellement une solution entièrement basée sur Airtable qui gère les sollicitations des usagers pour le raccordement aux réseaux de chaleur urbains. Il propose deux interfaces distinctes (admin et gestionnaire/pro), des règles d’attribution automatiques, des notifications par email, ainsi que des tâches de synchronisation périodiques.

---

## Architecture du Système

### Stockage des Données

**Base de Données Principale** : Airtable

**Tables Principales** :
1. **`FCU - Utilisateurs`** (Airtable.DEMANDES_UNUSED)
   - Données principales des demandes
   - Accès via l’API REST grâce au SDK Airtable
   - Configuration : `src/server/db/airtable.ts:9`

2. **`FCU - Utilisateurs relance`** (Airtable.RELANCE)
   - Retours utilisateurs suite aux emails de relance
   - Stocke les commentaires lorsque les utilisateurs répondent aux relances
   - Liée aux demandes par le champ `Relance ID`

3. **`FCU - Utilisateurs emails`** (Airtable.UTILISATEURS_EMAILS)
   - Historique complet des emails envoyés par les gestionnaires aux prospects
   - Suivi : objet, corps du mail, destinataires, CC, reply-to, horodatages
   - Lié aux demandes via `demand_id`

**Tables PostgreSQL associées** :
- `assignment_rules` : Stocke les règles d'attribution automatique des demandes aux gestionnaires
- `users` : Comptes utilisateurs (gestionnaires, admins, pros)
- `events` : Journal d’audit des actions liées aux demandes
- `email_templates` : Modèles d’emails enregistrés par les utilisateurs

### Définitions Typescript

**Types centraux** (`src/types/Summary/Demand.d.ts`) :
- `DemandSummary` : Demande de base avec id, Nom, Prénom, Adresse, Mode de chauffage, Type de chauffage, Structure, Gestionnaires
- `EditableDemandSummary` : Champs modifiables par les gestionnaires (Prise de contact, Commentaire, Statut)
- `Demand` : Objet complet de demande (30+ champs), dont infos de contact, localisation, réseau, bâtiment, attribution, suivi
- `AdminDemand` : Extension avec recommendedTags, recommendedAssignment, detailedEligibilityStatus, networkTags

**Enum Statut** (`src/types/enum/DemandSatus.ts`) :
- EMPTY : 'En attente de prise en charge'
- UNREALISABLE : 'Non réalisable'
- WAITING : 'En attente d\'éléments du prospect'
- IN_PROGRESS : 'Étude en cours'
- VOTED : 'Voté en AG'
- WORK_IN_PROGRESS : 'Travaux en cours'
- DONE : 'Réalisé'
- ABANDONNED : 'Projet abandonné par le prospect'

---

## Interfaces Utilisateur

### 1. Interface Administrateur (`/admin/demandes`)

**Fichier** : `src/pages/admin/demandes.tsx`
**Authentification** : réservée à `['admin']`

**But** : Valider et attribuer les demandes aux gestionnaires

**Fonctionnalités clés** :
- **Workflow de validation** : Les administrateurs examinent les demandes non validées (`Gestionnaires validés = FALSE`)
- **Suggestions automatiques** : Tags et attributions proposés en fonction des règles d’affectation
- **Attribution de tags** : Sélection multiple grâce à `FCUTagAutocomplete`
- **Information réseau** : Edition de la distance, de l’ID réseau et du nom réseau
- **Carte** : Visualisation des demandes sur carte (panneau droit)
- **Validation en masse** : Bouton "Valider" applique les valeurs recommandées automatiquement
- **Suppression** : Demandes supprimables tant qu’elles ne sont pas validées

**API GET** : `/api/admin/demands`
- Filtres : `{Gestionnaires validés} = FALSE()`
- Traitement :
  1. Récupère les demandes non validées depuis Airtable (src/pages/api/admin/demands.ts:11-16)
  2. Charge les règles actives depuis PostgreSQL (src/pages/api/admin/demands.ts:24-29)
  3. Pour chaque demande :
     - Appelle `getDetailedEligibilityStatus()` pour calculer la proximité au réseau
     - Evalue les règles pour générer `recommendedTags` et `recommendedAssignment`
     - Retourne un objet enrichi `AdminDemand`

**API Mise à jour** : `PUT /api/admin/demands/[demandId]`
- Fichier : `src/pages/api/admin/demands/[demandId].ts`
- Champs éditables : Gestionnaires, Affecté à, Distance au réseau, Nom réseau, etc.
- Audit event créé : `demand_assigned` ou `demand_updated`

### 2. Interface Gestionnaire/Pro (`/pro/demandes`)

**Fichier** : `src/pages/pro/demandes.tsx`
**Authentification** : `['gestionnaire', 'demo', 'admin']`

**But** : Suivre et gérer les demandes attribuées

**Fonctionnalités clés** :
- **Vue filtrée** : Affiche uniquement les demandes correspondant aux tags du gestionnaire connecté
- **Gestion du statut** : Changement du statut via menu déroulant
- **Suivi du contact** : Case à cocher “prospect recontacté”
- **Envoi d’emails** : Modal d’envoi via `DemandEmailForm`
- **Filtres rapides** : Accès direct à certaines listes (haute priorité, PDP, etc.)
- **Export de données** : Export en XLSX via `exportService`
- **Filtres avancés** : Recherche par statut, structure, mode de chauffage, distance, etc.

**Préréglages de filtres rapides** :
1. **Toutes les demandes** : Nombre total
2. **Haut potentiel** (`haut_potentiel`): Chauffage collectif <100m (60m Paris), ou 100+ logements, ou tertiaire
3. **À traiter** : Statut = 'En attente de prise en charge' ET non contacté
4. **En PDP** : Demandes situées dans le périmètre de développement prioritaire

**API GET** : `/api/demands`
- Fichier : `src/pages/api/demands/index.ts`
- Service : `getDemands(req.user)` depuis `src/server/services/manager.ts:91`
- Logique de filtrage (src/server/services/manager.ts:99-107):
  - **Admin** : Pas de filtre (toutes les demandes)
  - **Demo** : Réseau Paris uniquement + validées
  - **Gestionnaire** : Filtres par tags du gestionnaire + validées

**API Mise à jour** : `PUT /api/demands/[demandId]`
- Fichier : `src/pages/api/demands/[demandId].ts`
- Champs modifiables : Statut, Prise de contact, Commentaire, surface, logements, consommation
- Contrôle permissions : L’utilisateur doit avoir le tag de gestionnaire correspondant

---

## Logique Métier & Services

### Création d’une demande

**Entrée** : Soumission du formulaire de contact
- Hook : `useContactFormFCU` (src/hooks/useContactFormFCU.ts)
- Service : `formatDataToAirtable()` + `submitToAirtable()` (src/services/airtable.ts)

**Handler API** : `POST /api/airtable/records` (src/pages/api/airtable/records/index.ts)

**Processus** (src/pages/api/airtable/records/index.ts:42-93) :
1. Créer la fiche Airtable avec valeurs vides par défaut :
   - `Gestionnaires: [defaultEmptyStringValue]`
   - `Affecté à: defaultEmptyStringValue`
   - `Distance au réseau: defaultEmptyNumberValue`
2. Enrichir avec des données externes :
   - Consommation gaz via `getConsommationGazAdresse()`
   - Nombre de logements via `getNbLogement()`
3. Mettre à jour la fiche avec les données enrichies
4. Créer un événement d’audit : `demand_created`
5. Envoyer l’email de confirmation à l’utilisateur

**Transformation des données** (src/services/airtable.ts:85-147) :
- Normalisation des valeurs énergie/type de chauffage
- Gestion des structures complexes (Tertiaire avec BE, Syndic, etc.)
- Mapping des informations société selon le type de structure
- Ajout des paramètres UTM de tracking

### Système de Règles d’Attribution

**Stockage** : Table PostgreSQL `assignment_rules`
- Champs : `id`, `search_pattern`, `result`, `active`, `created_at`

**Syntaxe des règles** (src/pages/api/admin/demands.ts:30-46) :
- **Pattern** : Expression AST parsée
- **Actions** : Extraction depuis `result`
  - `tag:<nom>` : Ajoute un tag gestionnaire
  - `affecte:<nom>` : Attribue à un gestionnaire

**Évaluation** (src/pages/api/admin/demands.ts:48-81) :
1. Parser tous les patterns actifs en AST
2. Pour chaque `DetailedEligibilityStatus` de demande :
   - Évaluer l’AST selon les données d’éligibilité
   - Rassembler les tags correspondants
   - Prendre la première affectation trouvée
3. Retourne `{ tags: string[], assignment: string | null }`

**Exemple** :
```
Règle : "network.nom CONTAINS 'Paris' AND distance < 100"
Action : "tag:Paris, affecte:Gestionnaire Paris"
→ Si la demande correspond, ajoute "Paris" aux tags recommandés et suggère l’attribution
```

### Notifications Email

**Services** (`src/server/services/manager.ts`) :

#### 1. Notification de nouvelles demandes (`dailyNewManagerMail`)
- **Déclenchement** : Cron, chaque jour ouvré à 10h (src/server/cron/cron.ts:8-13)
- **Destinataires** : Utilisateurs avec `receive_new_demands = true`
- **Filtre** : `{Gestionnaires validés} = TRUE() AND {Notification envoyé} = ""`
- **Processus** :
  1. Groupement des demandes par tag
  2. Groupement des utilisateurs par tag
  3. Envoi d’un mail pour chaque gestionnaire et utlisateur
  4. Marquage `Notification envoyé: <date>`

#### 2. Rappel pour demandes en attente (`weeklyOldManagerMail`)
- **Déclenchement** : Cron chaque mardi à 9h55 (src/server/cron/cron.ts:15-20)
- **Destinataires** : Utilisateurs avec `receive_old_demands = true`
- **Filtre** : Statut vide/en attente ET notification il y a plus de 7 jours
- **Processus** : Envoi d’un rappel email par gestionnaire

#### 3. Relance utilisateur (`dailyRelanceMail`)
- **Déclenchement** : Cron chaque lundi à 10h05 (src/server/cron/cron.ts:22-27)
- **Destinataires** : Utilisateurs finaux ayant soumis des demandes
- **Filtre** (src/server/services/manager.ts:35-56) :
  - Première relance : >1 mois, `Relance à activer = TRUE`, non contacté, pas de relance déjà envoyée
  - Seconde relance : >45 jours après la première, toujours non contacté
- **Processus** :
  1. Générer un UUID unique par demande
  2. Mettre à jour `Relance envoyée` ou `Seconde relance envoyée`
  3. Stocker l’UUID dans `Relance ID`
  4. Envoyer un email avec lien de retour utilisateur

**Modèle** : l’email de relance inclut un lien pour indiquer si l’utilisateur a été contacté

### Système de Relance

**But** : Suivre si les usagers ont bien été recontactés par les gestionnaires après soumission d’une demande

**Composants** :

#### 1. Workflow Email de Relance

**Déclenchement** : Cron `dailyRelanceMail` (lundi 10h05)

**Critères** (src/server/services/manager.ts:35-56) :
- **Première relance** :
  - Demande plus ancienne qu'1 mois
  - `Relance à activer = TRUE`
  - `Recontacté par le gestionnaire = ""` (vide)
  - `Relance envoyée = ""` (jamais envoyée)
- **Seconde relance** :
  - Demande plus ancienne de 45j depuis la 1ère relance
  - Toujours non recontacté
  - 1ère relance déjà envoyée

**Processus** (src/server/services/manager.ts:299-323) :
1. Génère un UUID unique
2. Met à jour la fiche demande :
   - `Relance envoyée` ou `Seconde relance envoyée` = date actuelle
   - `Relance ID` = UUID
3. Envoie un email à l'utilisateur avec des liens :
   - `/satisfaction?id={uuid}&satisfaction=true` (contacté)
   - `/satisfaction?id={uuid}&satisfaction=false` (non contacté)

#### 2. Page de réponse utilisateur (`/satisfaction`)

**Fichier** : `src/pages/satisfaction.tsx`

**Traitement serveur** (src/pages/satisfaction.tsx:84-88) :
- Lors de l’accès : `updateRelanceAnswer(id, satisfaction)`
- Met à jour la demande : `Recontacté par le gestionnaire = 'Oui'` ou `'Non'`

**Côté client** :
- Si `satisfaction=false` : Message d’excuse, promesse de relance gestionnaire
- Formulaire de commentaire optionnel → envoyé à la table `Airtable.RELANCE`
- Commentaire référencé via le `Relance ID`

#### 3. Table Airtable.RELANCE

**But** : Stocker l’avis/commentaire utilisateur suite à la relance

**Champs** :
- `id` : UUID relance
- `comment` : Commentaire utilisateur

**Handler API** (src/pages/api/airtable/records/index.ts:32-40) :
- Reçoit le commentaire avec l’UUID
- Retrouve la demande par `Relance ID`
- Met à jour le champ `Commentaire relance` sur la demande

**Flux** :
1. L'utilisateur reçoit la relance par email
2. Clique le lien avec UUID
3. La page `/satisfaction` met à jour `Recontacté par le gestionnaire`
4. L’utilisateur laisse éventuellement un commentaire
5. Le commentaire est stocké dans la table RELANCE ET sur la demande

### Système de Suivi Email (UTILISATEURS_EMAILS)

**But** : Posséder un audit complet de toutes les communications gestionnaire-prospect

**Champs - Table Airtable.UTILISATEURS_EMAILS** :
- `demand_id` : Lien vers la demande (Airtable record ID)
- `email_key` : ID du modèle ou UUID si email libre
- `object` : Objet de l’email
- `body` : Corps (avec `<br />` pour les sauts de ligne)
- `to` : Destinataire
- `cc` : Copie conforme (liste séparée par virgules)
- `reply_to` : Adresse de réponse
- `signature` : Signature du gestionnaire
- `user_email` : Gestionnaire auteur
- `sent_at` : Date d’envoi (automatique Airtable)

#### Flux d’envoi d’email

**Composant** : `DemandEmailForm` (src/components/Manager/DemandEmailForm.tsx)

**Déclenché depuis** : Page `/pro/demandes` lors d’un clic sur bouton email

**Fonctionnalités** :
1. **Affichage historique email** (src/components/Manager/DemandEmailForm.tsx:82-236) :
   - GET `/api/managerEmail?demand_id={id}`
   - Liste tous les emails envoyés précédemment
   - Clique = recharge le modèle
   - Empêche la réutilisation d’un même modèle pour une demande

2. **Système de modèles** :
   - Enregistrement et chargement de modèles personnalisés
   - Modèles stockés dans la table PostgreSQL `email_templates`
   - Prise en charge des placeholders : `{{Prénom}}`, `{{Nom}}`, `{{Adresse}}`, etc.
   - Prévisualisation avant envoi

3. **Gestion des placeholders** (src/components/Manager/DemandEmailForm.tsx:36-58) :
   - Remplace `{{clé}}` par la valeur de la demande
   - Formate automatiquement les dates
   - Placeholders disponibles : Prénom, Nom, Adresse, Date de la demande, Distance au réseau, etc.

4. **Processus d’envoi** (src/components/Manager/DemandEmailForm.tsx:117-164) :
   - POST `/api/managerEmail` avec le contenu du mail
   - Enregistre dans la table `UTILISATEURS_EMAILS`
   - Met à jour la signature de l'utilisateur si modifiée
   - Met à jour la demande :
     - `Emails envoyés` : ajoute la ligne d’objet
     - `Prise de contact = true`
     - Mise à jour du statut conditionnelle selon modèle :
       - `koFarFromNetwork`, `koIndividualHeat`, `koOther` → Statut = UNREALISABLE
       - `askForPieces` → Statut = WAITING

#### Handler API Email (`/api/managerEmail`)

**Fichier** : `src/pages/api/managerEmail.ts`

**GET** (src/pages/api/managerEmail.ts:13-43) :
- Récupère l’historique email pour une demande donnée
- Retourne la liste complète des envois

**POST** (src/pages/api/managerEmail.ts:63-111) :
1. Valide le contenu (Zod schema)
2. Log dans Airtable `UTILISATEURS_EMAILS`
3. Mise à jour de la signature PostgreSQL si modifiée
4. Envoi réel de l’email via `sendEmailTemplate('manager-email', ...)`

**Envoi effectif** :
- Modèle : `manager-email`
- Objet libre défini par le gestionnaire
- Corps personnalisé avec placeholders traités
- CC et reply-to personnalisés

---

## Tâches Planifiées (Cron)

### 1. syncComptesProFromUsers

**Fichier** : `src/server/services/airtable.ts:16-119`
**Fréquence** : Horaire (src/server/cron/cron.ts:29-36)
**But** : Synchroniser les utilisateurs PostgreSQL vers la table Airtable `FCU - Comptes pro`

**Processus** :
1. Requête sur la table `users` PostgreSQL (rôle PRO/PARTICULIER)
2. Filtre optionnel sur période (nouveaux utilisateurs seulement)
3. Récupère tous les comptes existants côté Airtable
4. Pour chaque user :
   - S’il n’existe pas : **CREATE**
   - S’il existe mais inchangé : **PASSER**
   - S’il existe et a changé : **UPDATE** (sur `last_connection` ou `active`)

**Champs synchronisés** :
- Email, Nom, Prénom, Téléphone
- Rôle, Statut, Actif
- Infos structure (Type, Nom)
- CGU acceptées, Optin Newsletter
- Créé le, Dernière connexion

**Mode DRY_RUN** : Gouverné par la variable d'environnement DRY_RUN

**Note** : Ce cron ne touche pas directement aux demandes, il met à jour les comptes pro susceptibles de recevoir des demandes.

### 2. Jobs email quotidiens/hebdo

Voir section “Notifications Email” ci-dessus.

---

## Points d’Intégration

### 1. Intégration Airtable

**Tables utilisées** :
- `FCU - Utilisateurs` (DEMANDES) : Table principale des demandes
- `FCU - Comptes pro` (COMPTES_PRO) : Comptes utilisateurs synchronisés
- `FCU - Utilisateurs emails` (UTILISATEURS_EMAILS) : Historique & traçabilité email
- `FCU - Utilisateurs relance` (RELANCE) : Avis/commentaires suite à relance

**Modalités d’accès** :
- SDK : Librairie `airtable` via helper `AirtableDB()`
- CRUD, sélections avec filtres, suppressions
- `typecast` toujours activé pour la souplesse typage

**Utilisation par table** :
- **DEMANDES** : Opérations CRUD, requêtes filtrées pour attributions
- **UTILISATEURS_EMAILS** : Création (à l’envoi), lecture (pour afficher historique)
- **RELANCE** : Création (commentaire utilisateur), update du champ commentaire relance parent
- **COMPTES_PRO** : Sync horaire depuis PostgreSQL

### 2. Intégration PostgreSQL

**Tables** :
- `assignment_rules` : Règles auto-attribution
- `users` : Authentification, tags gestionnaires, préférences email
- `events` : Audit (demand_created, demand_updated, demand_assigned, demand_deleted)

**ORM** : Kysely query builder

### 3. Services externes

**Information Adresse** (`src/server/services/addresseInformation`) :
- `getDetailedEligibilityStatus(lat, lon)` : Proximité réseau, Perimètre PDP, commune
- `getConsommationGazAdresse(lat, lon)` : Données conso gaz
- `getNbLogement(lat, lon)` : Nombre de logements

**Service Email** (`src/modules/email`) :
- `sendEmailTemplate()` : Envoi emails modèles
- Modèles : `creation-demande`, `new-demands`, `old-demands`, `relance`

### 4. Analytics

**Suivi Matomo** :
- Paramètres UTM capturés lors de la création de la demande
- Événements suivis : éligibilité adresse, soumissions formulaire

---

## Modèle de Permissions

**Rôles** :
1. **Admin** : Accès complet, interface de validation, suppression
2. **Gestionnaire** : Accès aux demandes correspondant à leurs tags, MAJ statut/commentaires
3. **Demo** : Lecture seule des demandes Paris (données fictives)
4. **Particulier/Professionnel** : Pas d’accès à la gestion (création seulement)

**Contrôle d’accès** :
- Côté serveur : `withAuthentication(['admin', 'gestionnaire'])`
- Filtrage : Requêtes Airtable filtrées par champ `Gestionnaires` selon tags user
- Validation des updates : Contrôle permissions avant MAJ

---

## Fichiers Clés

### Pages frontend
- `src/pages/admin/demandes.tsx` : Interface de validation admin
- `src/pages/pro/demandes.tsx` : Interface gestionnaire
- `src/pages/satisfaction.tsx` : Page de retour relance utilisateur

### API
**Demandes** :
- `src/pages/api/admin/demands.ts` : GET admin
- `src/pages/api/admin/demands/[demandId].ts` : PUT/DELETE admin
- `src/pages/api/demands/index.ts` : GET gestionnaire
- `src/pages/api/demands/[demandId].ts` : PUT gestionnaire
- `src/pages/api/airtable/records/index.ts` : POST création demande/relance

**Email & communication** :
- `src/pages/api/managerEmail.ts` : GET historique, POST envoi email
- `src/pages/api/user/email-templates/[[...slug]].ts` : CRUD modèles email

### Services
- `src/server/services/manager.ts` : Logique métier demandes
- `src/server/services/airtable.ts` : Sync utilisateurs → Airtable
- `src/server/services/assignment-rules.ts` : Gestion règles attribution (présumé)
- `src/services/airtable.ts` : Formatage données côté client

### Composants
- `src/components/Manager/Status.tsx` : Statut dropdown
- `src/components/Manager/Contact.tsx` : Contact affichage
- `src/components/Manager/Contacted.tsx` : Case recontacté
- `src/components/Manager/Comment.tsx` : Zone commentaire
- `src/components/Manager/DemandEmailForm.tsx` : Modal email
- `src/components/Manager/DemandStatusBadge.tsx` : Badge statut
- `src/components/Admin/TableFieldInput.tsx` : Input éditable admin

### Base de données
- `src/server/db/airtable.ts` : Connexion Airtable
- `src/server/db/kysely/database.ts` : Types PostgreSQL
- `src/server/db/migrations/20250706000003_add_table_assignment_rules.ts` : Table règles attribution

### Types
- `src/types/Summary/Demand.d.ts` : Types demandes
- `src/types/enum/DemandSatus.ts` : Enum statuts
- `src/types/enum/Airtable.ts` : Enum tables Airtable

### Cron
- `src/server/cron/cron.ts` : Déclaration CRON jobs
- `src/server/cron/launch.ts` : Lancement CRON

---

## Schémas de flux

### Flux de création d’une demande
```
Formulaire utilisateur → hook useContactFormFCU
  → formatDataToAirtable()
  → POST /api/airtable/records
    → Crée fiche Airtable avec valeurs par défaut
    → Enrichissement : getConsommationGazAdresse(), getNbLogement()
    → MAJ fiche avec données enrichies
    → createEvent(demand_created)
    → sendEmailTemplate(creation-demande)
  → Retourne l’id de la demande
```

### Flux de validation admin
```
Admin ouvre /admin/demandes
  → GET /api/admin/demands
    → Cherche demandes non validées sur Airtable
    → Règles assignment_rules depuis PostgreSQL
    → Pour chaque demande :
      → getDetailedEligibilityStatus()
      → evaluateAST(règles, eligibilityStatus)
      → Retourne AdminDemand avec recommandations
  → Admin révise, édite tags/attribution
  → Clique “Valider”
    → PUT /api/admin/demands/[demandId]
      → MAJ Airtable: Gestionnaires validés = true
      → createUserEvent(demand_assigned)
```

### Flux gestionnaire
```
Gestionnaire ouvre /pro/demandes
  → GET /api/demands
    → Filtre par tags du gestionnaire
    → Seules les demandes validées en retour
  → Met à jour statut/contact/commentaire
    → PUT /api/demands/[demandId]
      → Contrôle permission: tag user = demande
      → MAJ sur Airtable
      → createUserEvent(demand_updated)
```

### Flux relance (follow-up)
```
Cron: dailyRelanceMail (lundi 10h05)
  → Recherche demandes: >1 mois, Relance à activer = TRUE, non contacté
  → Pour chaque :
    → Génère UUID unique
    → MAJ demande: Relance envoyée = date, Relance ID = UUID
    → Envoi email avec liens :
      - /satisfaction?id={UUID}&satisfaction=true
      - /satisfaction?id={UUID}&satisfaction=false

Utilisateur clique un lien
  → Arrive sur la page /satisfaction
    → getServerSideProps: updateRelanceAnswer(UUID, true/false)
      → Trouve par Relance ID
      → MAJ: Recontacté par le gestionnaire = 'Oui'/'Non'
    → Côté client: formulaire de commentaire optionnel
      → POST /api/airtable/records (type: RELANCE)
        → Cherche demande par Relance ID
        → MAJ: Commentaire relance = commentaire
```

### Flux de suivi email
```
Gestionnaire clique email sur /pro/demandes
  → Modal DemandEmailForm
    → GET /api/managerEmail?demand_id={id}
      → Récupère depuis la table UTILISATEURS_EMAILS
      → Retourne l’historique email
    → Affiche l’historique (clic pour recharger template)

  → Gestionnaire rédige l’email :
    → Choisit un template OU rédige
    → Remplit placeholders: {{Prénom}}, {{Adresse}}, etc.
    → Prévisualisation personnalisée

  → Clique 'Envoyer'
    → POST /api/managerEmail
      → Ajout dans UTILISATEURS_EMAILS:
        - demand_id, email_key, object, body, to, cc, reply_to
        - signature, user_email, sent_at (auto)
      → MAJ signature dans PostgreSQL si changée
      → Envoi réel via sendEmailTemplate('manager-email')
      → MAJ demande:
        - Emails envoyés += objet + '\n'
        - Prise de contact = true
        - Statut = UNREALISABLE/WAITING (selon template)
```

---

## Workflows Critiques

### 1. Application des règles d’attribution
- **Quand** : Lors du chargement de la liste admin
- **Processus** : Parser règles → évaluer sur eligibility data → suggestion tags/attribution
- **Sortie** : Champs `recommendedTags`, `recommendedAssignment` sur AdminDemand

### 2. Enrichissement des demandes
- **Quand** : À la création
- **Externes** :
  - API consommation gaz
  - API bâtiments (BNB)
- **Mise à jour** : Champs Conso, Logement sur Airtable

### 3. Cycles de notifications email
- **Quotidien** : Nouveaux leads (10:00)
- **Hebdo** : Demandes en attente (mar 09:55)
- **Mensuel+** : Système de relance utilisateur (lun 10:05)

### 4. Synchronisation des utilisateurs
- **Fréquence** : Horaire
- **Sens** : PostgreSQL → Airtable
- **But** : Garder Airtable à jour côté comptes gestionnaires/pro

### 5. Système de relance
- **Quand** : Cron lundi 10h05, demandes >1 mois, non contactées
- **Processus** : Génération UUID → emails satisfaction → réponse utilisateur met à jour la demande
- **Tracking** : Double relance (1 mois, puis 45 jours)
- **Stockage** : Réponse sur la demande, commentaire éventuel en RELANCE

### 6. Suivi email gestionnaire/usager
- **Quand** : Envoi depuis /pro/demandes
- **Processus** : Log dans UTILISATEURS_EMAILS → envoi → MAJ demande
- **Fonctionnalités** : Système modèle email, placeholders, historique, MAJ statut auto
- **Audit** : Archivage exhaustif de tous les emails gestionnaire-usager avec métadonnées

