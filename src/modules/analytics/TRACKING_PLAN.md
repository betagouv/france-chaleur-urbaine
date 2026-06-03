# Plan de tracking PostHog - France Chaleur Urbaine

## Vue d'ensemble

France Chaleur Urbaine utilise PostHog pour mesurer l'usage du produit. Ce document est la **référence unique** du plan de tracking : tout événement envoyé à PostHog doit être déclaré ici.

### Principes

1. **Peu d'événements, beaucoup de propriétés** : un événement générique avec des propriétés filtrables plutôt que N événements spécifiques
2. **Consentement utilisateur requis** : le tracking PostHog est conditionné au consentement cookie. Les données comme l'adresse ou l'email peuvent être incluses dans les propriétés d'événements
3. **Nommage : `categorie:objet_action`** en snake_case, verbes au présent
4. **Propriétés** : `is_`/`has_` pour booléens, `_date` pour dates, `source` pour identifier la page d'origine

---

## Taxonomie des événements

### 1. Éligibilité (funnel principal)

Le parcours business critique : test d'adresse → résultat → prise de contact.

| Événement | Propriétés | Description |
|---|---|---|
| `address_test:submitted` | `address`, `source`, `is_eligible` | Soumission du formulaire de test d'adresse |
| `address_test:contact_form_submitted` | `address`, `source`, `is_eligible`, `heating_energy`, `heating_type?`, `structure_type`, `company_type?`, `nb_logements?`, `demand_area_m2?` | Soumission du formulaire de contact (conversion principale) |

**Sources** : `carte`, `comparateur`, `fiche-reseau`, `homepage`, `choix-chauffage`

**Funnel PostHog** : `address_test:submitted` → `address_test:contact_form_submitted` (breakdown par `source` et `is_eligible`)

### 2. Potentiel création de réseau

Test du potentiel d'une commune pour la création d'un réseau de chaleur.

| Événement | Propriétés | Description |
|---|---|---|
| `potentiel-creation-reseau:commune_form_submit` | `commune`, `potentiel` | Test du potentiel d'une commune |
| `potentiel-creation-reseau:contact_form_submit` | `commune`, `email`, `potentiel` | Prise de contact suite au test potentiel |

### 3. Carte

Outil central du produit. On mesure l'interaction avec les couches et les outils.

| Événement | Propriétés | Description |
|---|---|---|
| `map:layer_toggled` | `layer`, `is_enabled` | Activation/désactivation d'une couche |
| `map:legend_toggle` | `is_open` | Ouverture/fermeture de la légende |
| `map:tab_select` | `tab_name` | Navigation entre onglets (réseaux, potentiel, enrr, outils) |
| `map:tool_use` | `tool_name`, `action` | Utilisation des outils carte |
| `map:feature_click` | `feature_type?`, `feature_id?` | Clic sur une feature de la carte (ouverture popup de détail) |

**`tool_name`** : `distance`, `density`, `extraction`
**`action`** : `start`, `complete`, `reset`, `export`

### 4. Comparateur

Outil de comparaison des solutions de chauffage.

| Événement | Propriétés | Description |
|---|---|---|
| `comparator:config_create` | _(aucune)_ | Création d'une configuration |
| `comparator:config_load` | `is_shared` | Chargement d'une configuration (partagée ou non) |
| `comparator:config_share` | _(aucune)_ | Partage d'une configuration |

### 5. Navigation (liens, CTA, boutons)

Tracking unifié de tous les clics de navigation.

| Événement | Propriétés | Description |
|---|---|---|
| `link:click` | `link_name`, `source` | Clic sur un CTA, bouton ou lien de navigation |

**Exemples d'utilisation** :
- CTA "Tester mon adresse" sur la homepage : `{ link_name: 'tester_adresse', source: 'homepage' }`
- Bouton "Voir le comparateur" : `{ link_name: 'voir_comparateur', source: 'choix-chauffage' }`
- Lien guide raccordement : `{ link_name: 'guide_raccordement', source: 'homepage' }`
- Lien schéma directeur sur fiche réseau : `{ link_name: 'schema_directeur', source: 'fiche-reseau' }`
- Lien sources données sur la carte : `{ link_name: 'sources_donnees', source: 'carte' }`
- Popup potentiel densification : `{ link_name: 'popup_potentiel_densification', source: 'carte' }`

### 6. Contenu (documents, vidéos, guides)

Tracking unifié de la consultation de contenu.

| Événement | Propriétés | Description |
|---|---|---|
| `content:click` | `content_type`, `content_name`, `source`, `content_category?` | Consultation d'un contenu |

**`content_type`** : `document`, `video`, `guide`, `faq`, `external_link`

**Exemples d'utilisation** :
- Téléchargement d'un PDF sur la page supports : `{ content_type: 'document', content_name: 'Infographie Avenir', source: 'supports', content_category: 'Infographies' }`
- Lecture d'une vidéo : `{ content_type: 'video', content_name: 'Présentation FCU', source: 'supports' }`
- Clic sur un guide : `{ content_type: 'guide', content_name: 'Guide Copropriétés', source: 'ressources' }`

### 7. Chaleur renouvelable (FCR)

Parcours issu de `docs/planTracking.xlsx` : landing → simulateur → résultats → contact.

#### Landing page

| Événement | Propriétés | Description |
|---|---|---|
| `fcr_landing:hero_cta_clicked` | _(aucune)_ | Clic sur le CTA principal "Comparer les solutions" |
| `fcr_landing:address_typed` | _(aucune)_ | Première saisie dans le champ adresse |
| `fcr_landing:heating_mode_selected` | `heating_mode` | Sélection du mode de chauffage |
| `fcr_landing:emitter_type_selected` | `emitter_type` | Sélection du type de radiateurs |
| `fcr_landing:outdoor_space_selected` | `outdoor_space` | Sélection des espaces extérieurs disponibles |
| `fcr_landing:simulation_started` | `heating_mode?`, `emitter_type?`, `outdoor_space?`, `address_filled` | Lancement de la simulation depuis la landing |
| `fcr_landing:scroll_depth_reached` | `depth_percent` | Seuil de scroll atteint (`25`, `50`, `75`, `100`) |
| `fcr_landing:bottom_cta_clicked` | _(aucune)_ | Clic sur un CTA secondaire en bas de page |
| `fcr_landing:article_clicked` | `article_title?`, `article_position?`, `element_name` | Clic sur une carte article pédagogique |
| `fcr_landing:testimonial_clicked` | `testimonial_title?`, `element_name` | Clic sur une carte témoignage |
| `fcr_landing:faq_item_opened` | `faq_question` | Ouverture d'une question FAQ |

#### Simulateur

| Événement | Propriétés | Description |
|---|---|---|
| `fcr_simulator:address_selected` | `address`, `city?`, `postcode?`, `source` | Sélection d'une adresse dans l'autocomplétion |
| `fcr_simulator:heating_mode_selected` | `heating_mode` | Sélection du mode de chauffage |
| `fcr_simulator:emitter_type_selected` | `emitter_type` | Sélection du type de radiateurs |
| `fcr_simulator:outdoor_space_selected` | `outdoor_space` | Sélection des espaces extérieurs |
| `fcr_simulator:params_panel_opened` | _(aucune)_ | Ouverture du panneau d'ajustement des paramètres |
| `fcr_simulator:nb_logements_changed` | `nb_logements` | Modification du nombre de logements |
| `fcr_simulator:surface_changed` | `surface_m2` | Modification de la surface habitable moyenne |
| `fcr_simulator:habitants_changed` | `habitants` | Modification du nombre moyen d'habitants |
| `fcr_simulator:dpe_changed` | `dpe` | Modification du DPE |
| `fcr_simulator:ecs_mode_changed` | `ecs_mode` | Modification du mode d'eau chaude sanitaire |
| `fcr_simulator:parameters_saved` | `nb_logements?`, `surface_m2?`, `habitants?`, `dpe`, `heating_mode?`, `emitter_type?`, `ecs_mode?` | Sauvegarde des paramètres et recalcul |
| `fcr_simulator:parameters_cancelled` | _(aucune)_ | Annulation des modifications de paramètres |

#### Résultats

| Événement | Propriétés | Description |
|---|---|---|
| `fcr_results:no_solution_displayed` | `heating_mode?`, `outdoor_space?` | Affichage de l'état sans solution ENR compatible |
| `fcr_results:recommended_solution_displayed` | `solution_type` | Affichage de la solution recommandée |
| `fcr_results:recommended_solution_expanded` | `solution_type` | Dépliage du détail de la solution recommandée |
| `fcr_results:recommended_solution_cta_clicked` | `solution_type` | Clic sur "Passer à l'étape suivante" depuis la solution recommandée |
| `fcr_results:tab_switched` | `tab_value` | Changement d'onglet résultats (`chauffage_ecs`, `ecs_uniquement`) |
| `fcr_results:alternative_solution_opened` | `solution_type`, `position` | Ouverture d'une solution alternative |
| `fcr_results:alternative_solution_closed` | `solution_type`, `position` | Fermeture d'une solution alternative |
| `fcr_results:prerequisite_detail_clicked` | `solution_type`, `prerequisite_label` | Clic sur un lien de détail de prérequis |
| `fcr_results:alternative_solution_cta_clicked` | `solution_type` | Clic sur "Passer à l'étape suivante" depuis une solution alternative |
| `fcr_results:methodology_link_clicked` | _(aucune)_ | Clic sur le lien méthodologie |
| `fcr_results:share_button_clicked` | _(aucune)_ | Clic sur le bouton partager |
| `fcr_results:agir_link_clicked` | _(aucune)_ | Clic sur le lien Agir dans l'état sans solution |
| `fcr_results:france_renov_cta_clicked` | _(aucune)_ | Clic sur le CTA France Rénov' |
| `fcr_results:no_ecs_solution_displayed` | `heating_mode?` | Affichage de l'état sans solution ECS |
| `fcr_results:ecs_to_full_tab_clicked` | _(aucune)_ | Clic depuis l'état ECS vide vers l'onglet chauffage + ECS |

#### Contact

| Événement | Propriétés | Description |
|---|---|---|
| `fcr_contact:profile_selected` | `profile`, `is_raccordable` | Sélection du profil |
| `fcr_contact:energy_selected` | `energy`, `is_raccordable` | Sélection de l'énergie actuelle |
| `fcr_contact:nb_logements_filled` | `nb_logements`, `is_raccordable` | Nombre de logements disponible dans le contexte du formulaire |
| `fcr_contact:project_stage_selected` | `stages`, `is_raccordable` | Sélection d'une ou plusieurs étapes de projet |
| `fcr_contact:non_raccordable_checked` | _(aucune)_ | Sélection du parcours non raccordable |
| `fcr_contact:non_raccordable_reason_selected` | `reason` | Sélection du motif de non-raccordabilité |
| `fcr_contact:map_viewed` | _(aucune)_ | Consultation de la carte réseau de chaleur avant contact |
| `fcr_contact:cgu_accepted` | `is_raccordable` | Acceptation des CGU |
| `fcr_contact:form_submitted` | `profile`, `energy`, `nb_logements?`, `top_solution?`, `project_stages`, `phone_filled`, `is_raccordable`, `non_raccordable_reason?` | Soumission du formulaire de contact |

---

## Récapitulatif

### Événements socle

| # | Événement | Catégorie |
|---|---|---|
| 1 | `address_test:submitted` | Conversion |
| 2 | `address_test:contact_form_submitted` | Conversion |
| 3 | `potentiel-creation-reseau:commune_form_submit` | Conversion |
| 4 | `potentiel-creation-reseau:contact_form_submit` | Conversion |
| 5 | `map:layer_toggled` | Carte |
| 6 | `map:legend_toggle` | Carte |
| 7 | `map:tab_select` | Carte |
| 8 | `map:tool_use` | Carte |
| 9 | `map:feature_click` | Carte |
| 10 | `comparator:config_create` | Comparateur |
| 11 | `comparator:config_load` | Comparateur |
| 12 | `comparator:config_share` | Comparateur |
| 13 | `link:click` | Navigation |
| 14 | `content:click` | Contenu |

### Événements FCR

Les événements du parcours chaleur renouvelable sont listés dans la section dédiée ci-dessus. Ils ajoutent **47 événements custom** au plan de tracking PostHog.

**Total documenté : 61 événements custom** + `$pageview` natif PostHog.

---

## Funnels clés à configurer dans PostHog

### Funnel éligibilité (KPI principal)
```
$pageview (page avec formulaire)
  → address_test:submitted
    → address_test:contact_form_submitted
```
Breakdown par : `source`, `is_eligible`, `structure_type`

### Funnel potentiel collectivités
```
$pageview (page potentiel)
  → potentiel-creation-reseau:commune_form_submit
    → potentiel-creation-reseau:contact_form_submit
```

### Engagement carte
```
$pageview (page carte)
  → map:layer_toggled (au moins 1)
  → map:tool_use (au moins 1)
```

---

## Dashboards recommandés

### 1. Conversion
- Taux de conversion du funnel éligibilité (global + par source)
- Volume de demandes de contact par jour/semaine
- Répartition des demandes par `structure_type` et `heating_energy`

### 2. Usage carte
- Top couches activées (`map:layer_toggled` breakdown par `layer`)
- Usage des outils (`map:tool_use` breakdown par `tool_name`)
- Onglets les plus visités (`map:tab_select` breakdown par `tab_name`)

### 3. Contenu
- Top contenus consultés (`content:click` breakdown par `content_name`)
- Répartition par type de contenu (`content:click` breakdown par `content_type`)
- Top CTAs cliqués (`link:click` breakdown par `link_name`)

### 4. Acquisition
- Pages les plus visitées (`$pageview` breakdown par `$current_url`)
- Sources de trafic (propriété native `$referring_domain`)

---

## Conventions de nommage

### Événements
- Format : `categorie:objet_action`
- snake_case partout
- Verbes au présent (`submit`, pas `submitted`)

### Propriétés
- snake_case
- Booléens : préfixe `is_` ou `has_`
- Dates : suffixe `_date`
- La propriété `source` identifie la page/contexte d'origine

### Valeurs de propriétés
- snake_case (pas de majuscules, pas d'espaces)
- Exemple : `source: 'fiche-reseau'`, `content_type: 'document'`

---

## Consentement, persistance et identification

### Architecture

L'intégration PostHog repose sur deux fichiers :

- **`src/instrumentation-client.ts`** : initialisation synchrone avant React
- **`src/components/ConsentBanner/usePostHog.tsx`** : gestion dynamique du consentement et identification

### Initialisation (avant React)

PostHog est initialisé dans `instrumentation-client.ts` qui s'exécute avant le montage de React. Pour éviter de générer un nouveau `distinct_id` à chaque rechargement, le consentement DSFR est lu **synchroniquement depuis localStorage** avant `posthog.init()` :

- **Consentement déjà donné** → `persistence: 'localStorage+cookie'`, autocapture et pageview activés. Le `distinct_id` existant est restauré depuis localStorage, l'utilisateur conserve son identité entre les sessions.
- **Pas de consentement** → `persistence: 'memory'`, autocapture et pageview désactivés. Aucun cookie ni donnée persistée (RGPD).

### Gestion dynamique du consentement (`usePostHog`)

Le hook `usePostHog(enable)` réagit aux changements de consentement en temps réel :

- **Consentement accordé** : switch vers `persistence: 'localStorage+cookie'`, `opt_in_capturing()`
- **Consentement retiré** : `posthog.reset()` (nettoie le `distinct_id` et les propriétés), switch vers `persistence: 'memory'`, `opt_out_capturing()`

### Identification des utilisateurs connectés

L'identification via `posthog.identify()` se déclenche quand les deux conditions sont réunies :

1. Le consentement PostHog est actif (`enable = true`)
2. Un utilisateur est authentifié (`user.id` disponible)

Propriétés envoyées : `id`, `email`, `role`.

Les utilisateurs publics restent identifiés par le `distinct_id` anonyme de PostHog.

### RGPD

- Le tracking est **conditionné au consentement cookie** (opt-in via la bannière DSFR)
- Aucun cookie ni localStorage PostHog n'est écrit avant consentement
- Les données comme `address` et `email` peuvent être incluses dans les propriétés d'événements car l'utilisateur a donné son consentement
