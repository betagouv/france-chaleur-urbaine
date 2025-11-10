Rajoute au script de migration et à la table

  - created_at: récupéré de la valeur de "Date de la demande"
  - validated_at: qui aura la valeur de "Gestionnaires validés"
  - contacted_at: récupéré de la valeur de "Recontacté par le gestionnaire"
  - comment_gestionnaire -> Commentaire || ""
  - comment_fcu -> Concaténation de Commentaires_internes_FCU et
  Commentaires FCU
  - history un JSON array avec type, created_at, metadata, id
  - user: objet JSON avec
    - first_name: Nom
    - last_name: Prénom
    - email: Email
    - phone: Téléphone
    - structure_type: Structure (faire la fonction inverse)
    - structure_name: Nom de la structure accompagnante (=company)
  - user_id: à populaer si un user avec l'email
  - status: Status
  - assigned_to: Affecté à
  - assigned_to_pending: Gestionnaire Affecté à
  - referrer: Sondage
  - referrer_other: Sondage



  - batiment:
    - source_address: Addresse
    - ban_valid: A calculer
    - ban_address: A calculer
    - ban_score: A calculer
    - geom: A calculer
    - eligibility_history: un array avec le resultat de la fonction getAddressEligibilityHistoryEntry
    - mode_chauffage: Mode de chauffage (electricite, gaz, fioul, autre)
    - type_chauffage: Type de chauffage (individuel, collectif, autre)
    - type
    - surface_m2: Surface en m2
    - conso_gaz: Conso
    - nb_logements: Nombre de logements (=demandArea)
    - company_type: Type de structure (=demandCompanyType)
    - company_name: Etablissement (=demandCompanyName) || "Nom de la structure accompagnante" (=company)

  -

  - campaign_keywords: Campagne keywords
  - campaign_source: Campagne source
  - campaign_matomo: Campagne matomo





history:
  - type: "creation"
    created_at: récupéré de la valeur de "Date de la demande"
  - type: "validation"
    created_at: récupéré de la valeur de "Gestionnaires validés" ou rien s'il n'y a pas de date
  - type "contact"
    created_at: récupéré de la valeur de "Recontacté par le gestionnaire"
  - type: "relance"
    created_at: récupéré de la valeur de "Relance envoyée" avec metadata: { comment: récupéré de la valeur de "Commentaire relance" }
  - type: "relance"
    created_at: récupéré de la valeur "Seconde relance envoyée" est true
  - type: "gestionnaires_modifies"
    created_at: historique à creer lorsque les gestionnaires sont modifiés
  - type: "affectation_modifiee"
  - type: "affectation_acceptee"
