# Plan de tracking PostHog - France Chaleur Urbaine

## Vue d'ensemble

France Chaleur Urbaine utilise PostHog pour mesurer l'usage produit. Ce document est la référence fonctionnelle du plan de tracking : tout événement envoyé à PostHog doit être listé ici et typé dans `posthog.config.ts`.

### Principes

1. **Peu d'événements, beaucoup de propriétés** : un événement générique avec des propriétés filtrables plutôt que N événements spécifiques.
2. **Consentement utilisateur requis** : le tracking PostHog est conditionné au consentement cookie.
3. **Nommage : `categorie:objet_action`** en snake_case.
4. **Propriétés** : `is_`/`has_` pour booléens, `_date` pour dates, `source` pour identifier la page d'origine.
5. **Synchronisation** : un événement présent dans le code doit être listé ici et dans `PostHogEventMap`; un événement non déclenché doit être supprimé des deux.

---

## Événements

### Éligibilité

| Événement | Propriétés | Description |
|---|---|---|
| `address_test:started` | `source`, `chauffage_type?` | Démarrage d'un test d'adresse |
| `address_test:submitted` | `address`, `source`, `is_eligible`, `chauffage_type?`, `distance_reseau_m?` | Soumission du test d'adresse |
| `address_test:result_displayed` | `source`, `result_type`, `chauffage_type?`, `distance_reseau_m?` | Affichage du résultat d'éligibilité |
| `address_test:discover_more_clicked` | `source?`, `result_type`, `chauffage_type?`, `distance_reseau_m?` | Clic pour en savoir plus depuis un résultat |
| `address_test:contact_form_submitted` | `address`, `source`, `is_eligible`, `heating_energy`, `heating_type?`, `structure_type`, `company_type?`, `nb_logements?`, `demand_area_m2?`, `has_phone?` | Soumission du formulaire de contact |

**Sources** : `carte`, `comparateur`, `fiche-reseau`, `homepage`, `choix-chauffage`, `chaleur-renouvelable`, `eligibility`, `ville`.

### Test d'adresses en masse

| Événement | Propriétés | Description |
|---|---|---|
| `bulk_test:file_uploaded` | `rows_count`, `file_size_kb` | Import d'un fichier d'adresses |
| `bulk_test:processing_started` | `bulk_test_id`, `rows_count?` | Lancement du traitement |
| `bulk_test:session_resumed` | `bulk_test_id`, `days_since_creation`, `is_original_creator` | Reprise d'une session de test |
| `bulk_test:result_displayed` | `bulk_test_id`, `rows_total`, `rows_eligible`, `rows_near_network`, `rows_non_eligible`, `rows_error` | Affichage des résultats |
| `bulk_test:results_filtered` | `bulk_test_id`, `filter_type` | Filtrage des résultats |
| `bulk_test:map_viewed` | `bulk_test_id`, `rows_displayed_on_map?` | Consultation des résultats sur la carte |
| `bulk_test:results_exported` | `bulk_test_id`, `rows_exported`, `filter_applied` | Export des résultats |
| `bulk_test:contact_request_clicked` | `bulk_test_id`, `selected_rows_count` | Clic vers la demande de contact |
| `bulk_test:contact_request_submitted` | `bulk_test_id`, `selected_rows_count`, `has_phone`, `professional_type?` | Soumission de la demande de contact |

### Carte

| Événement | Propriétés | Description |
|---|---|---|
| `map:address_searched` | _(aucune)_ | Recherche d'adresse sur la carte |
| `map:layer_toggled` | `layer`, `is_enabled` | Activation ou désactivation d'une couche |
| `map:legend_toggle` | `is_open` | Ouverture ou fermeture de la légende |
| `map:tab_select` | `tab_name` | Sélection d'un onglet de légende |
| `map:tool_use` | `tool_name`, `action` | Utilisation d'un outil carte |
| `map:feature_click` | `feature_type?`, `feature_id?` | Clic sur une entité cartographique |
| `map:network_clicked` | `network_id` | Clic sur un réseau |
| `map:network_exported` | `network_name`, `network_id` | Export de la géométrie d'un réseau |
| `map:download_network` | _(aucune)_ | Clic sur le téléchargement des réseaux |
| `map:manager_contact_form_submitted` | _(aucune)_ | Soumission du formulaire de contribution gestionnaire |
| `map:contribute_clicked` | _(aucune)_ | Clic vers la contribution |

**`tool_name`** : `distance`, `density`, `extraction`. **`action`** : `start`, `complete`, `reset`, `export`.

### Potentiel création de réseau

| Événement | Propriétés | Description |
|---|---|---|
| `potentiel-creation-reseau:commune_form_submit` | `commune`, `potentiel` | Test du potentiel d'une commune |
| `potentiel-creation-reseau:contact_form_submit` | `commune`, `email`, `potentiel` | Prise de contact suite au test potentiel |
| `network_creation:territory_searched` | `territory_code?` | Recherche de territoire sur la page potentiel |
| `network_creation:layer_toggled` | `layer_name` | Activation d'une couche sur la page potentiel |
| `network_creation:contact_cta_clicked` | `territory_code?` | Clic sur un CTA de contact |

### Comparateur coûts et CO2

| Événement | Propriétés | Description |
|---|---|---|
| `comparator:started` | `address?`, `distance_reseau_m`, `is_eligible` | Démarrage depuis une adresse testée |
| `comparator:advanced_mode_clicked` | `address?` | Accès au mode avancé |
| `comparator:step_1_completed` | `address?` | Validation de l'étape 1 |
| `comparator:step_2_completed` | `address?`, `modeChauffage?` | Validation de l'étape 2 |
| `comparator:config_create` | _(aucune)_ | Création d'une configuration |
| `comparator:config_loaded` | _(aucune)_ | Chargement d'une configuration existante |
| `comparator:config_share` | _(aucune)_ | Partage d'une configuration |
| `comparator:image_saved` | Règles Publicodes calculées | Export image du graphique |
| `comparator:data_exported` | _(aucune)_ | Export des données |
| `comparator:cost_detail_tab_opened` | Règles Publicodes calculées | Ouverture du détail des coûts |
| `comparator:cost_detail_posts_opened` | Règles Publicodes calculées | Ouverture du détail des postes de coûts |
| `comparator:co2_emissions_tab_opened` | Règles Publicodes calculées | Ouverture de l'onglet émissions CO2 |

### Chaleur renouvelable - landing

| Événement | Propriétés | Description |
|---|---|---|
| `fcr_landing:address_typed` | _(aucune)_ | Première saisie dans le champ adresse |
| `fcr_landing:heating_mode_selected` | `heating_mode` | Sélection du type de logement / chauffage |
| `fcr_landing:emitter_type_selected` | `emitter_type` | Sélection du type d'émetteurs |
| `fcr_landing:outdoor_space_selected` | `outdoor_space` | Sélection des espaces extérieurs |
| `fcr_landing:simulation_started` | `address_filled`, `heating_mode?`, `emitter_type?`, `outdoor_space?` | Lancement de la simulation |
| `fcr_landing:scroll_depth_reached` | `depth_percent` | Seuil de scroll atteint |
| `fcr_landing:bottom_cta_clicked` | _(aucune)_ | Clic sur le CTA bas de page |
| `fcr_landing:article_clicked` | `element_name`, `article_title?`, `article_position?` | Clic sur une carte article |
| `fcr_landing:testimonial_clicked` | `element_name`, `testimonial_title?` | Clic sur un témoignage |
| `fcr_landing:faq_item_opened` | `faq_question` | Ouverture d'une question FAQ |

### Chaleur renouvelable - simulateur

| Événement | Propriétés | Description |
|---|---|---|
| `fcr_simulator:address_selected` | `address`, `city?`, `postcode?`, `source` | Sélection d'une adresse |
| `fcr_simulator:heating_mode_selected` | `heating_mode?`, `typeLogement?` | Sélection du mode de chauffage |
| `fcr_simulator:emitter_type_selected` | `emitter_type` | Sélection du type d'émetteurs |
| `fcr_simulator:outdoor_space_selected` | `outdoor_space?`, `outdoorSpace?` | Sélection des espaces extérieurs |
| `fcr_simulator:params_panel_opened` | _(aucune)_ | Ouverture du panneau paramètres |
| `fcr_simulator:nb_logements_changed` | `nb_logements` | Modification du nombre de logements |
| `fcr_simulator:surface_changed` | `surface_m2` | Modification de la surface |
| `fcr_simulator:habitants_changed` | `habitants` | Modification du nombre d'habitants |
| `fcr_simulator:dpe_changed` | `dpe` | Modification du DPE |
| `fcr_simulator:ecs_mode_changed` | `ecs_mode` | Modification du mode ECS |
| `fcr_simulator:parameters_saved` | `dpe`, `nb_logements?`, `surface_m2?`, `habitants?`, `heating_mode?`, `emitter_type?`, `ecs_mode?` | Sauvegarde des paramètres |
| `fcr_simulator:parameters_cancelled` | _(aucune)_ | Annulation des modifications |

### Chaleur renouvelable - résultats

| Événement | Propriétés | Description |
|---|---|---|
| `chaleur-renouvelable:accordeon` | `name` | Ouverture d'un accordéon du parcours |
| `fcr_results:no_solution_displayed` | `heating_mode?`, `outdoor_space?` | Affichage sans solution compatible |
| `fcr_results:recommended_solution_displayed` | `solution_type` | Affichage de la solution recommandée |
| `fcr_results:recommended_solution_expanded` | `solution_type` | Dépliage du détail de la solution recommandée |
| `fcr_results:recommended_solution_cta_clicked` | `solution_type` | Clic sur "Bénéficier d'un accompagnement gratuit" depuis la solution recommandée |
| `fcr_results:ccrt_contact_cta_clicked` | _(aucune)_ | Clic sur un CTA d'accès au formulaire CCRT |
| `fcr_results:tab_switched` | `tab_value` | Changement d'onglet résultats (`chauffage_ecs`, `ecs_uniquement`) |
| `fcr_results:alternative_solution_opened` | `solution_type`, `position` | Ouverture d'une solution alternative |
| `fcr_results:alternative_solution_closed` | `solution_type`, `position` | Fermeture d'une solution alternative |
| `fcr_results:prerequisite_detail_clicked` | `solution_type`, `prerequisite_label` | Clic sur le détail d'un prérequis |
| `fcr_results:alternative_solution_cta_clicked` | `solution_type` | Clic sur le CTA d'une solution alternative |
| `fcr_results:methodology_link_clicked` | _(aucune)_ | Clic vers la méthodologie |
| `fcr_results:share_button_clicked` | _(aucune)_ | Clic sur le bouton de partage |
| `fcr_results:agir_link_clicked` | _(aucune)_ | Clic vers Agir |
| `fcr_results:france_renov_coordinates_toggled` | `is_open` | Ouverture ou fermeture des coordonnées France Rénov' |
| `fcr_results:france_renov_cta_clicked` | _(aucune)_ | Clic sur le CTA France Rénov' |
| `fcr_results:no_ecs_solution_displayed` | `heating_mode?` | Affichage sans solution ECS |
| `fcr_results:ecs_to_full_tab_clicked` | _(aucune)_ | Passage de l'onglet ECS vers chauffage + ECS |

### Chaleur renouvelable - contact

| Événement | Propriétés | Description |
|---|---|---|
| `fcr_contact:profile_selected` | `profile`, `is_raccordable` | Sélection du profil |
| `fcr_contact:energy_selected` | `energy`, `is_raccordable` | Sélection de l'énergie actuelle |
| `fcr_contact:project_stage_selected` | `stages`, `is_raccordable` | Sélection des étapes du projet |
| `fcr_contact:non_raccordable_checked` | _(aucune)_ | Sélection du parcours non raccordable |
| `fcr_contact:non_raccordable_reason_selected` | `reason` | Sélection du motif de non-raccordabilité |
| `fcr_contact:map_viewed` | _(aucune)_ | Consultation de la carte dans le résultat réseau de chaleur |
| `fcr_contact:cgu_accepted` | `is_raccordable` | Acceptation des CGU |
| `fcr_contact:form_submitted` | `profile`, `energy`, `nb_logements?`, `top_solution?`, `project_stages`, `phone_filled`, `is_raccordable`, `non_raccordable_reason?` | Soumission du formulaire |

### Simulateur PAC embarqué

Ces événements n'utilisent pas `posthog-js` dans le widget : le navigateur appelle l'API FCU en fire-and-forget, puis le serveur envoie l'événement à PostHog avec `$process_person_profile: false`. Ne pas envoyer d'adresse, d'email, de téléphone ni de texte libre utilisateur dans ces propriétés.

| Événement | Propriétés | Description |
|---|---|---|
| `simulateur_pac:form_started` | `source_host?`, `source_path?`, `referrer_host?`, `current_step?`, `owner_status?`, `housing_type?`, `heating_equipment?`, `dpe?`, `department_code?`, `route_outcome?` | Premier engagement dans le formulaire |
| `simulateur_pac:results_requested` | `source_host?`, `source_path?`, `referrer_host?`, `current_step?`, `owner_status?`, `housing_type?`, `heating_equipment?`, `dpe?`, `department_code?`, `route_outcome?` | Demande de résultats |
| `simulateur_pac:france_renov_coordinates_requested` | `source_host?`, `source_path?`, `department_code?` | Affichage des coordonnées France Rénov' |
| `simulateur_pac:france_renov_external_link_clicked` | `source_host?`, `source_path?` | Clic vers France Rénov' |
| `simulateur_pac:fcu_outbound_link_clicked` | `source_host?`, `source_path?`, `link_name?` | Clic sortant vers FCU ou Chaleur renouvelable |

### Simulateur CEE

| Événement | Propriétés | Description |
|---|---|---|
| `simu_cee:started` | _(aucune)_ | Démarrage du simulateur CEE |
| `simu_cee:field_filled` | `field_name`, `field_value?` | Renseignement d'un champ |
| `simu_cee:result_displayed` | `building_type`, `eligible`, `estimated_amount_eur`, `network_name?`, `surface_m2?` | Affichage du résultat |

### Navigation, contenu et structure globale

| Événement | Propriétés | Description |
|---|---|---|
| `link:click` | `link_name`, `source` | Clic générique sur lien ou CTA |
| `link:internal` | `news_slug`, `source` | Clic vers une actualité interne |
| `content:click` | `content_type`, `content_name`, `source`, `content_category?` | Consultation ou téléchargement d'un contenu |
| `content:internal_link_clicked` | `target_path` | Clic sur lien interne depuis un contenu |
| `nav:menu_item_clicked` | `item`, `menu_level` | Clic dans la navigation principale |
| `nav:external_link_clicked` | `partner_name`, `partner_url` | Clic automatique sur un lien externe |
| `global:footer_link_clicked` | `link_name` | Clic sur un lien du pied de page |
| `global:login_cta_clicked` | `is_auth` | Clic sur le CTA de connexion |
| `consent:cookie_choice_made` | `consent` | Choix de consentement cookies |
| `account:created` | _(aucune)_ | Création de compte |

### Accueil

| Événement | Propriétés | Description |
|---|---|---|
| `home:tool_tile_clicked` | `element_name` | Clic sur une tuile outil |
| `home:comparator_tile_clicked` | _(aucune)_ | Clic sur la tuile comparateur |
| `home:bulk_test_cta_clicked` | _(aucune)_ | Clic vers le test d'adresses en masse |
| `home:guide_download_clicked` | `filename` | Téléchargement d'un guide |
| `home:fcr_tile_clicked` | _(aucune)_ | Clic vers Chaleur renouvelable |
| `home:article_clicked` | `element_name` | Clic sur un article |
| `home:news_clicked` | `element_name` | Clic sur une actualité |
| `home:pedagogic_section_clicked` | `element_name` | Clic sur une section pédagogique |
| `home:partner_logo_clicked` | `partner_name`, `target_url` | Clic sur un logo partenaire |
| `home:testimonial_carousel_clicked` | `action`, `testimonial_index` | Interaction avec le carrousel témoignages |

### FAQ

| Événement | Propriétés | Description |
|---|---|---|
| `faq:accordeon` | `question` | Ouverture d'une question FAQ |
| `faq:click` | `source` | Clic vers la FAQ |
| `faq:cta_contact_equipe` | _(aucune)_ | Clic sur le CTA de contact depuis la FAQ |

### Pages réseau, ville, collectivités et professionnels

| Événement | Propriétés | Description |
|---|---|---|
| `network_page:address_test_cta_clicked` | `network_id` | Clic sur le CTA de test d'adresse d'une fiche réseau |
| `network_list:filter_applied` | `filter_name`, `filter_value` | Application d'un filtre dans la liste des réseaux |
| `city_page:network_link_clicked` | `city_slug`, `target` | Clic vers un réseau depuis une page ville |
| `collectivities:content_cta_clicked` | `content_name` | Clic sur un contenu collectivités |
| `collectivities:section_clicked` | `section_id` | Clic sur une section collectivités |
| `collectivities:iframe_code_copied` | `iframe_type` | Copie d'un code iframe |
| `collectivities:iframe_cta_clicked` | _(aucune)_ | Clic vers la section iframe |
| `pro:tool_cta_clicked` | `tool_name` | Clic sur un outil professionnel |
| `tools:tool_accessed` | `tool_name` | Accès à un outil depuis la page outils |

---

## Funnels clés à configurer dans PostHog

### Funnel éligibilité

```
$pageview (page avec formulaire)
  → address_test:started
    → address_test:submitted
      → address_test:result_displayed
        → address_test:contact_form_submitted
```

Breakdown par : `source`, `is_eligible`, `structure_type`.

### Funnel test d'adresses en masse

```
bulk_test:file_uploaded
  → bulk_test:processing_started
    → bulk_test:result_displayed
      → bulk_test:contact_request_submitted
```

### Funnel potentiel collectivités

```
$pageview (page potentiel)
  → potentiel-creation-reseau:commune_form_submit
    → potentiel-creation-reseau:contact_form_submit
```

### Engagement carte

```
$pageview (page carte)
  → map:address_searched / map:layer_toggled / map:tool_use
```

### Chaleur renouvelable

```
fcr_landing:simulation_started
  → fcr_results:recommended_solution_displayed / fcr_results:no_solution_displayed
    → fcr_contact:form_submitted
```

---

## Dashboards recommandés

### Conversion

- Taux de conversion du funnel éligibilité par `source`.
- Volume de demandes de contact par jour/semaine.
- Répartition des demandes par `structure_type` et `heating_energy`.

### Usage carte

- Top couches activées (`map:layer_toggled` par `layer`).
- Usage des outils (`map:tool_use` par `tool_name` et `action`).
- Onglets les plus visités (`map:tab_select` par `tab_name`).

### Contenu et navigation

- Top contenus consultés (`content:click` par `content_name`).
- Top CTAs cliqués (`link:click` par `link_name`).
- Navigation principale (`nav:menu_item_clicked` par `item` et `menu_level`).

### Chaleur renouvelable

- Taux de lancement simulation → résultat → contact.
- Solutions recommandées (`fcr_results:recommended_solution_displayed` par `solution_type`).
- Motifs de non-raccordabilité (`fcr_contact:non_raccordable_reason_selected` par `reason`).

---

## Consentement, persistance et identification

L'intégration PostHog est initialisée avant React, puis pilotée par le consentement DSFR. Sans consentement, PostHog reste en persistance mémoire et ne capture pas durablement l'utilisateur ; avec consentement, la persistance `localStorage+cookie` permet de conserver le `distinct_id` entre les sessions.

Lorsqu'un utilisateur connecté a donné son consentement, `posthog.identify()` associe son `id`, son `email` et son `role` au profil PostHog. Les utilisateurs publics restent identifiés par le `distinct_id` anonyme de PostHog.

Les propriétés potentiellement personnelles comme `address` ou `email` ne doivent être envoyées que pour les événements où le consentement PostHog est actif et où la donnée est utile à l'analyse produit.

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

- Snake case quand la valeur est une clé technique.
