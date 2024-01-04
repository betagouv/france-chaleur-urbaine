# Mise à jour des données de la BDNB
Pour l'instant tout fonctionne par région. Une table par région.
<br/>

## Première étape - en local

1. Importer les nouvelles tables par région.
    - `psql postgres://postgres:postgres_fcu@localhost:5432 -f nom_table.sql`

2. Si non existante, pour chaque table, créer la colonne *geom_adresse* et créer la géométrie du point de l'adresse :
    - `ALTER TABLE "bdnb_registre2022_aura" ADD geom_adresse geometry;`
    - `UPDATE "bdnb_registre2022_aura" SET geom_adresse = ST_SetSRID(ST_MakePoint(x,y),4326);`

2. Mettre à jour le code
    - Les appels aux colonnes des tables :
        - Uniquement l'ID :
            - scripts/updateDemands.ts
            - utils/tiles.ts
            - pages/api/airtable/records/index.ts
        - Toutes :
            - src/core/infrastructure/repository/
                - addresseInformation.ts
                - dataSummary.ts
            - pages/api/dpe/index.ts
            - services/tile.config.ts
    - Mettre à jour l'index max dans le script de calculs des tiles :
        - utils/tiles.ts : const maxIndex


3. Mettre à jour manuellement la colonne *bnb_nom* de la table *regions* avec le nom des nouvelles tables

4. Vider les tables *bnb - adresse_tiles* et *bnb - batiment_tiles*

5. Lancer les calculs des tiles
    - Pour les adresses : `NODE_PATH=./ npx ts-node --transpile-only scripts/fillTiles.ts energy 0 17 1`
    - Pour les bâtiments : `NODE_OPTIONS=--max-old-space-size=8192 NODE_PATH=./ npx ts-node --transpile-only scripts/fillTiles.ts buildings 0 17 1`
<br/><br/>

## Deuxième étape - en dev

1. Créer la review app pour pouvoir tester avant de passer en preprod (s'il y a eu des changements côté code)

2. Se connecter sur Scalingo : `scalingo --region osc-fr1 --app france-chaleur-urbaine-dev db-tunnel SCALINGO_POSTGRESQL_URL`
    - Le mot de passe est dans Scalingo
    - On peut maintenant accéder à la base de dev sur 127.0.0.1:10000

3. Sur la base en local, exporter les tables
    - Par région
    - "regions"
    - "bnb - adresse_tiles"
    - "bnb - batiment_tiles"

4. **!!! Vérifier qu'il n'y a pas de process en cours sur Scalingo avant de continuer**
    - https://dashboard.scalingo.com/apps/osc-fr1/france-chaleur-urbaine-dev/logs

5. Sur la base de dev - mise à jour des tables
    - Vider les table
    - Importer les données avec les export du local

6. Redémarrer le container *web* sur Scalingo

7. Tester
    - https://france-chaleur-urbaine-dev.osc-fr1.scalingo.io ou sur la review app
<br/><br/>

## Dernière étape - mise en prod

1. Se connecter sur Scalingo : `scalingo --region osc-fr1 --app france-chaleur-urbaine db-tunnel SCALINGO_POSTGRESQL_URL`
    - Le mot de passe est dans Scalingo
    - On peut maintenant accéder à la base de prod sur 127.0.0.1:10000

2. **!!! Vérifier qu'il n'y a pas de process en cours sur Scalingo avant de continuer**
    - https://dashboard.scalingo.com/apps/osc-fr1/france-chaleur-urbaine/logs

3. Même process que pour le dev, il faudra déployer le code en prod avant s'il y a eu des changements.

4. Tester
