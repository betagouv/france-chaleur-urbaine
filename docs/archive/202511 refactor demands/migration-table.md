# Migration des demandes Airtable vers PostgreSQL

## Champs de la table `demands`

### Métadonnées de la demande

| Champ | Source Airtable | Description |
|-------|----------------|-------------|
| `created_at` | "Date de la demande" | Date de création de la demande |
| `validated_at` | "Gestionnaires validés" | Date de validation des gestionnaires |
| `contacted_at` | "Recontacté par le gestionnaire" | Date de recontact par le gestionnaire |
| `status` | "Status" | Statut de la demande |
| `assigned_to` | "Affecté à" | Gestionnaire assigné |
| `assigned_to_pending` | "Gestionnaire Affecté à" | Gestionnaire en attente d'affectation |

### Commentaires

| Champ | Source Airtable | Description |
|-------|----------------|-------------|
| `comment_gestionnaire` | "Commentaire" \|\| "" | Commentaire du gestionnaire |
| `comment_fcu` | Concaténation de "Commentaires_internes_FCU" et "Commentaire FCU" | Commentaires internes FCU |

### Utilisateur (objet JSON `user`)

| Champ JSON | Source Airtable | Description |
|------------|----------------|-------------|
| `first_name` | "Nom" | Nom de l'utilisateur |
| `last_name` | "Prénom" | Prénom de l'utilisateur |
| `email` | "Mail" | Email de l'utilisateur |
| `phone` | "Téléphone" | Téléphone de l'utilisateur |
| `structure_type` | "Structure" | Type de structure (fonction inverse nécessaire) |
| `structure_name` | "Nom de la structure accompagnante" | Nom de la structure |

**Note**: `user_id` doit être populé si un user avec cet email existe déjà.

### Sondage / Référencement

| Champ | Source Airtable | Description |
|-------|----------------|-------------|
| `referrer` | "Sondage" | Comment l'utilisateur a connu FCU |
| `referrer_other` | "Sondage" (autre) | Détails si "Autre" |

### Bâtiment (objet JSON `batiment`)

#### Adresse et géolocalisation

| Champ JSON | Source Airtable / Calcul | Description |
|------------|--------------------------|-------------|
| `source_address` | "Adresse" | Adresse source saisie |
| `ban_valid` | À calculer | Adresse validée par BAN |
| `ban_address` | À calculer | Adresse normalisée BAN |
| `ban_score` | À calculer | Score de confiance BAN |
| `geom` | À calculer | Géométrie du point (PostGIS) |

#### Chauffage

| Champ JSON | Source Airtable | Description |
|------------|----------------|-------------|
| `mode_chauffage` | "Mode de chauffage" | électricité, gaz, fioul, autre |
| `type_chauffage` | "Type de chauffage" | individuel, collectif, autre |

#### Caractéristiques du bâtiment

| Champ JSON | Source Airtable | Description |
|------------|----------------|-------------|
| `type` | "Établissement" | Type de bâtiment |
| `surface_m2` | "Surface en m2" | Surface du bâtiment |
| `conso_gaz` | "Conso" | Consommation de gaz |
| `nb_logements` | "Logement" (`demandArea`) | Nombre de logements |
| `company_type` | `demandCompanyType` | Type de structure |
| `company_name` | "Établissement" (`demandCompanyName`) \|\| "Nom de la structure accompagnante" | Nom de l'établissement |

#### Historique d'éligibilité

| Champ JSON | Calcul | Description |
|------------|--------|-------------|
| `eligibility_history` | Array avec résultat de `getAddressEligibilityHistoryEntry()` | Historique des tests d'éligibilité |

### Campagnes marketing

| Champ | Source Airtable | Description |
|-------|----------------|-------------|
| `campaign_keywords` | "Campagne keywords" | Mots-clés de la campagne |
| `campaign_source` | "Campagne source" | Source de la campagne |
| `campaign_matomo` | "Campagne matomo" | Identifiant Matomo |

---

## Historique des événements (`history` array)

Format: Array d'objets JSON avec `{ type, created_at, metadata?, id }`

### Types d'événements

| Type | Source | Metadata |
|------|--------|----------|
| `creation` | "Date de la demande" | Date de création |
| `validation` | "Gestionnaires validés" | Si date existe, sinon rien |
| `contact` | "Recontacté par le gestionnaire" | Date de recontact |
| `relance` | "Relance envoyée" | `{ comment: "Commentaire relance" }` |
| `relance` | "Seconde relance envoyée" = true | Deuxième relance |
| `gestionnaires_modifies` | Créé lors de modification | Changement de gestionnaires |
| `affectation_modifiee` | Créé lors de modification | Changement d'affectation |
| `affectation_acceptee` | Créé lors d'acceptation | Acceptation de l'affectation |

### Exemple de structure

```json
[
  {
    "id": "uuid",
    "type": "creation",
    "created_at": "2024-01-15T10:00:00Z"
  },
  {
    "id": "uuid",
    "type": "validation",
    "created_at": "2024-01-16T14:30:00Z"
  },
  {
    "id": "uuid",
    "type": "relance",
    "created_at": "2024-02-15T09:00:00Z",
    "metadata": {
      "comment": "Première relance envoyée"
    }
  }
]
```

---

## Notes de migration

- **Dates**: Toutes les dates doivent être converties en format ISO 8601
- **Null vs vide**: Les champs vides dans Airtable deviennent `null` en PostgreSQL
- **Arrays**: Les champs multiples Airtable deviennent des arrays JSON
- **Validation**: Valider les emails, téléphones et adresses avant insertion
