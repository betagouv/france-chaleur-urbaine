# Mettre à jour les réseaux de chaleur
<br/>

## Première étape - en local

1. Si de nouveaux tracés ou des mises à jour de tracés : Mise à jour de la table *reseaux_de_chaleur*
    - Vider la table *reseaux_de_chaleur* : `psql postgres://postgres:postgres_fcu@localhost:5432 -c "truncate reseaux_de_chaleur"`
        - Si des colonnes ont été ajoutées il faudra peut-être supprimer et recréer la table
    - Lancer : `psql postgres://postgres:postgres_fcu@localhost:5432 -f reseaux_de_chaleur.sql`
        - Il faudra peut-être modifier le fichier pour supprimer la création de la table et des index

2. Si de nouveaux tracés ou des mises à jour de tracés : Faire la même chose pour les réseaux de chaleur sans tracé
        - Il faudra peut-être modifier le fichier pour changer le nom de la table par *reseaux_de_chaleur* et supprimer sa création ainsi que celle des index

3. Mise à jour des données sur les réseaux depuis Airtable
    - Si la table des réseaux a été mise à jour lors de l'étape précédente : `yarn cli update-networks network`
    - Sinon 
        - `yarn cli download-network network`
    - Normalement ce script complète la table *zones_et_reseaux_en_construction* et regénère la table *zones_et_reseaux_en_construction_tiles*

4. Si mauvaise mise à jour des tiles : mise à jour de la table *reseaux_de_chaleur_tiles*
    - Vider la table (sans la supprimer)
    - Lancer le script fillTiles.ts : `npx tsx scripts/fillTiles.ts network 0 17`
<br/><br/>

## Deuxième étape - en dev

Script :
```sh
./scripts/copyLocalNetworkToRemote.sh preprod reseaux_de_chaleur
```

1. Se connecter sur Scalingo : `scalingo --region osc-fr1 --app france-chaleur-urbaine-dev db-tunnel SCALINGO_POSTGRESQL_URL`
    - Le mot de passe est dans Scalingo
    - On peut maintenant accéder à la base de dev sur 127.0.0.1:10000

2. Sur la base en local
    - Exporter les tables *reseaux_de_chaleur* et *reseaux_de_chaleur_tiles*

3. **!!! Vérifier qu'il n'y a pas de process en cours sur Scalingo avant de continuer**
    - https://dashboard.scalingo.com/apps/osc-fr1/france-chaleur-urbaine-dev/logs

4. Sur la base de dev - mise à jour de la table *reseaux_de_chaleur*
    - Vider la table
        - Si des colonnes ont été ajoutées ou modifiées il faudra la supprimer et la créer à nouveau avec le schéma de celle en local
    - Importer les données avec l'export du local

5. Sur la base de dev - mise à jour de la table *reseaux_de_chaleur_tiles*
    - Vider la table sans la supprimer
    - Importer les données avec l'export du local

6. Aller redémarrer le container *web* sur Scalingo

7. Tester
    - https://france-chaleur-urbaine-dev.osc-fr1.scalingo.io
    - Vérifier les adresses que Sebastien nous envoie à vérifier
<br/><br/>

## Dernière étape - mise en prod

Script :
```sh
./scripts/copyLocalNetworkToRemote.sh prod reseaux_de_chaleur
```

1. Se connecter sur Scalingo : `scalingo --region osc-fr1 --app france-chaleur-urbaine db-tunnel SCALINGO_POSTGRESQL_URL`
    - Le mot de passe est dans Scalingo
    - On peut maintenant accéder à la base de prod sur 127.0.0.1:10000

2. **!!! Vérifier qu'il n'y a pas de process en cours sur Scalingo avant de continuer**
    - https://dashboard.scalingo.com/apps/osc-fr1/france-chaleur-urbaine/logs

3. Sur la base de prod - mise à jour de la table *reseaux_de_chaleur*
    - Vider la table
        - Si des colonnes ont été ajoutées ou modifiées il faudra la supprimer et la créer à nouveau avec le schéma de celle en local
    - Importer les données avec l'export du local

4. Sur la base de prod - mise à jour de la table *reseaux_de_chaleur_tiles*
    - Vider la table sans la supprimer
    - Importer les données avec l'export du local

5. Aller redémarrer le container *web* sur Scalingo

6. Tester
    - Vérifier les adresses que Sebastien nous envoie à vérifier


## Pour les autres réseaux / tables

1. Réseaux de froid
    - Tables : *reseaux_de_froid* et *reseaux_de_froid_tiles*
    - Dans les scripts *network* devient *coldNetwork*
    - Même process que pour les réseaux de chaleur

2. Réseaux en construction
    - Tables : *zones_et_reseaux_en_construction* et *zones_et_reseaux_en_construction_tiles*
    - Dans les scripts *network* devient *futurNetwork*
    - Même process que pour les réseaux de chaleur

2. Zone de développement prioritaire
    - Tables : *zone_de_developpement_prioritaire* et *zone_de_developpement_prioritaire_tiles*
    - Dans les scripts *network* devient *zoneDP*
    - Les données ne sont pas présentes dans le AirTable donc il faut sauter cette étape et utiliser le script fillTiles directement
        - `npx tsx scripts/fillTiles.ts zoneDP 0 17`
