# Mise à jour des données FCU

> Améliorations à venir côté sébastien :
> - ne pas transformer futurs réseaux en polygone mais exporter 2 tables de type polygon et linestring
>   - afin de calculer is_zone automatiquement
> - renommer `reseaux_sans_traces_full` en `reseaux_de_chaleur_sans_traces_full`
> - ajouter l'extension sql aux fichiers exportés
> - renommer id en id_fcu sur zones_de_developpement_prioritaire
> - l'id sncu devrait être ajouté aux pdp


FCU s'occupe de gérer les tracés de 4 types de données :
- réseaux de chaleur
- réseaux de froid
- réseaux en construction
- périmètres de développement prioritaire (anciennement zones)

Sébastien utilise QGIS pour mettre à jour les tracés et les exporte périodiquement au format SQL (archive de 27Mo).

Postgres contient plusieurs tables avec les données des tracés et leurs métadonnées.

Les métadonnées sont éditées par l'équipe sur Airtable.


## Processus général

- Sébastien exporte une archive et l'envoie aux développeurs
- Les tracés sont mis à jour / ajoutés / supprimés dans postgres, et les données correspondances sont également mises à jour / ajoutés / supprimés côté airtable.
- Grâce à l'id_fcu ajouté côté airtable, Florence met à jour certaines données des nouveaux réseaux (exemple : gestionnaire).
- Les métadonnées airtable sont synchronisées avec postgres.
- Les tuiles sont générées.
- Les données sont copiées en dev et prod.
- Si la structure de certaines tables / données a changé, alors il y a probablement une PR à faire en plus.


## Règles de gestion

- Les communes sont calculées automatiquement avec les contours de l'IGN.
- On prend les délimitations réduites de 150m, ou sinon celles sans réduction.
- Le champ `has_trace` est calculé automatiquement si la géometrie est de type ligne.


## Format de l'archive exportée par Sébastien

Contient des dumps PG de plusieurs tables avec des noms différents :
- reseaux_de_chaleur : table reseaux_de_chaleur_full
- reseaux_sans_traces : table reseaux_sans_traces_full
- reseaux_de_froid : table reseaux_de_froid_full
- reseaux_de_froid_sans_traces : table reseaux_de_froid_sans_traces_full
- zones_de_developpement_prioritaire : table zones_de_developpement_prioritaire (public = zone_de_developpement_prioritaire)
- zones_et_reseaux_en_construction : table zones_et_reseaux_en_construction_full


## Worflow

! Note : le workflow est en cours de stabilisation !

- Récupérer les dernières évolutions de la base
```sh
# au préalable, récupérer les données à jour depuis la prod
pnpm db:pull:prod reseaux_de_chaleur
pnpm db:pull:prod reseaux_de_froid
pnpm db:pull:prod zone_de_developpement_prioritaire
pnpm db:pull:prod zones_et_reseaux_en_construction
```
- Vérifier qu'on est bien branché sur la base airtable de prod `vim .env.local`
- Récupérer des tickets à faire dans la colonne "Fichiers SIG dispos" sur Trello : https://trello.com/b/Tz9kOsCy/carto
- Classer les cards dans la colonneen commencant par les réseaux de chaleur et en finissant par les PDP
- Trier les cards par tag pour traiter les demandes similaires les unes après les autres

## Cas MAJ

Dans les différentes commandes les tables utilisées sont:
- rdc: reseaux_de_chaleur
- rdf: reseaux_de_froid
- pdp: zone_de_developpement_prioritaire
- futur: zones_et_reseaux_en_construction

Les références dans Airtable sont
- rdc: https://airtable.com/app9opX8gRAtBqkan/tblyfmHHCtyHg0MAk/viwAhx8JLQGw2XVDN?blocks=hide
- futur: https://airtable.com/app9opX8gRAtBqkan/tble0LoJtQeH1z63a?blocks=hide


### Insertion
- L'entité n'existe pas en base

```sh
# pnpm cli geom insert <rdc|rdf|pdp|futur> <fichier.geojson> [id_fcu] [id_sncu]
# si nouvelle entité réseau de chaleur 123
pnpm cli geom insert rdc mon-fichier.geojson 123
pnpm cli geom insert rdf mon-fichier.geojson 123
pnpm cli geom insert futur mon-fichier.geojson 123
pnpm cli geom insert pdp mon-fichier.geojson 0 123C
```

Si aucun ID n'est fourni, il faut aller créer un record dans Airtable


### Remplacement
- L'entité existe déjà en base et on veut **remplacer sa géométrie**

```sh
# pnpm cli geom update <rdc|rdf|pdp|futur> <fichier.geojson> <id_fcu_or_sncu>
# si entité réseau de chaleur 123 à mettre à jour
pnpm cli geom update rdc mon-fichier.geojson 123
pnpm cli geom update rdf mon-fichier.geojson 123
pnpm cli geom update futur mon-fichier.geojson 123
```

### Extension
- L'entité existe déjà en base et on veut **ajouter la géométrie** a une existante
```sh
# pnpm cli geom extend <rdc|rdf|pdp|futur> <fichier.geojson> <id_fcu_or_sncu>
# si entité réseau de chaleur 123 à mettre à jour
pnpm cli geom extend rdc mon-fichier.geojson 123
pnpm cli geom extend rdf mon-fichier.geojson 123
pnpm cli geom extend futur mon-fichier.geojson 123
```

### Suppression
- L'entité existe en base et on veut **la supprimer**

```sql
DELETE FROM <nom_table> where id_fcu = 123
DELETE FROM <nom_table> where "Identifiant reseau" = '123C'
```

### Fusion

- 2 entités existent en base et on souhaite les fusionner. C'est-à-dire fusionner leurs géométries dans l'une et supprimer l'autre.

Il faut donc choisir celle qui restera et supprimer l'autre


```sql
update <nom_table> t1
set geom = ST_Union(t1.geom, (
    select t2.geom
    from <nom_table> t2
    where t2.id_fcu = <id a supprimer> -- ID de l'entité qui sera supprimée
  ))
WHERE t1.id_fcu = <id a garder>; -- ID de l'entité qui sera gardée

DELETE FROM <nom_table> where id_fcu = <id a supprimer>;
```

## Commandes utiles

```sh
# si on doit créer un pdp depuis une commune
# - rechercher le code insee de la commune
pnpm cli communes:search vannes
# - puis appeler la commande
pnpm cli geom create-pdp-from-commune 56260
```

## Finalisation

Quand tout est fini, ou qu'on veut voir des changement sur la carte

```sh
# mise à jour des champs communes selon la géométrie des données
# En principe obsolète car les communes sont calculées automatiquement à la mise à jour.
# Mais il peut arriver qu'on doive appliquer des opérations une fois la géométrie chargée (ex dilatation)
pnpm cli geom update-communes

# synchronise les champs communes, has_trace, is_zone, has_PDP
pnpm cli sync-postgres-to-airtable

# mise à jour des métadonnées depuis airtable
pnpm cli download-network network
pnpm cli download-network coldNetwork
pnpm cli download-network futurNetwork

# génération des tuiles
pnpm cli tiles:generate reseaux-de-chaleur
pnpm cli tiles:fill coldNetwork 0 14 # meme fonction que tiles:generate mais pas encore migré
pnpm cli tiles:fill zoneDP 0 14
pnpm cli tiles:fill futurNetwork 0 14

# copie vers dev
# Use --data-only when no structures changes
pnpm db:push:dev --data-only reseaux_de_chaleur
pnpm db:push:dev --data-only reseaux_de_chaleur_tiles
pnpm db:push:dev --data-only reseaux_de_froid
pnpm db:push:dev --data-only reseaux_de_froid_tiles
pnpm db:push:dev --data-only zone_de_developpement_prioritaire
pnpm db:push:dev --data-only zone_de_developpement_prioritaire_tiles
pnpm db:push:dev --data-only zones_et_reseaux_en_construction
pnpm db:push:dev --data-only zones_et_reseaux_en_construction_tiles

# redéploie dev pour créer les pages statiques de réseaux
# https://dashboard.scalingo.com/apps/osc-fr1/france-chaleur-urbaine-dev/deploy/manual

# copie vers prod (quand validé en dev par Florence)
pnpm db:push:prod --data-only reseaux_de_chaleur
pnpm db:push:prod --data-only reseaux_de_chaleur_tiles
pnpm db:push:prod --data-only reseaux_de_froid
pnpm db:push:prod --data-only reseaux_de_froid_tiles
pnpm db:push:prod --data-only zone_de_developpement_prioritaire
pnpm db:push:prod --data-only zone_de_developpement_prioritaire_tiles
pnpm db:push:prod --data-only zones_et_reseaux_en_construction
pnpm db:push:prod --data-only zones_et_reseaux_en_construction_tiles

# redéploie prod pour créer les pages statiques de réseaux
# https://dashboard.scalingo.com/apps/osc-fr1/france-chaleur-urbaine/deploy/manual
```

## Misc

```sql
-- supprimer les tables comme les vues en dépendent et que le script copyRemoteTableToLocal ne fait pas de cascade
DROP TABLE public.reseaux_de_chaleur cascade;
DROP TABLE public.reseaux_de_froid cascade;
DROP TABLE public.zone_de_developpement_prioritaire cascade;
DROP TABLE public.zones_et_reseaux_en_construction cascade;
```

```sh
```

```sql
-- copie pour backup si l'application des changements se passe mal
CREATE TABLE wip_traces.backup_reseaux_de_chaleur AS TABLE public.reseaux_de_chaleur;
CREATE TABLE wip_traces.backup_reseaux_de_froid AS TABLE public.reseaux_de_froid;
CREATE TABLE wip_traces.backup_zone_de_developpement_prioritaire AS TABLE public.zone_de_developpement_prioritaire;
CREATE TABLE wip_traces.backup_zones_et_reseaux_en_construction AS TABLE public.zones_et_reseaux_en_construction;

-- à restaurer avec
TRUNCATE TABLE public.reseaux_de_chaleur;
INSERT INTO public.reseaux_de_chaleur SELECT * FROM wip_traces.backup_reseaux_de_chaleur;
TRUNCATE TABLE public.reseaux_de_froid;
INSERT INTO public.reseaux_de_froid SELECT * FROM wip_traces.backup_reseaux_de_froid;
TRUNCATE TABLE public.zone_de_developpement_prioritaire;
INSERT INTO public.zone_de_developpement_prioritaire SELECT * FROM wip_traces.backup_zone_de_developpement_prioritaire;
TRUNCATE TABLE public.zones_et_reseaux_en_construction;
INSERT INTO public.zones_et_reseaux_en_construction SELECT * FROM wip_traces.backup_zones_et_reseaux_en_construction;
```

```sh
# extraction de l'archive de Sébastien
unzip export_fcu.zip -d export_sebastien
cd $_

# transformation des fichiers pour utiliser le schéma wip_traces
sed -i 's/public\./wip_traces\./g; s/geom wip_traces/geom public/g;' *.sql

# nettoyage mot clé postgres 17 non reconnu en 16
sed -i '/transaction_timeout/d' *.sql

# import des données
psql postgres://postgres:postgres_fcu@localhost:5432 -c "drop schema if exists wip_traces cascade"
psql postgres://postgres:postgres_fcu@localhost:5432 -c "create schema if not exists wip_traces"

# import des données
psql postgres://postgres:postgres_fcu@localhost:5432 \
  -f reseaux_de_chaleur.sql \
  -f reseaux_de_chaleur_sans_traces.sql \
  -f reseaux_de_froid.sql \
  -f reseaux_de_froid_sans_traces.sql \
  -f zones_de_developpement_prioritaire.sql \
  -f zones_et_reseaux_en_construction.sql

# construction de tables agrégées pour les réseaux de chaleur et froid car elles sont séparées selon leur geom (limitation qgis)
psql postgres://postgres:postgres_fcu@localhost:5432 <<EOF
CREATE OR REPLACE VIEW wip_traces.reseaux_de_chaleur AS
SELECT
  id_fcu,
  geom,
  "Identifiant reseau",
  communes,
  true as has_trace
FROM wip_traces.reseaux_de_chaleur_full
UNION
SELECT
  id_fcu,
  geom,
  "Identifiant reseau",
  communes,
  false as has_trace
FROM wip_traces.reseaux_de_chaleur_sans_traces_full;
CREATE OR REPLACE VIEW wip_traces.reseaux_de_froid AS
SELECT
  id_fcu,
  geom,
  "Identifiant reseau",
  communes,
  true as has_trace
FROM wip_traces.reseaux_de_froid_full
UNION
SELECT
  id_fcu,
  geom,
  "Identifiant reseau",
  communes,
  false as has_trace
FROM wip_traces.reseaux_de_froid_sans_traces_full;
EOF
```

```sql
-- création d'un index pour réduire la géométrie des communes à 150m pour déduire les communes des réseaux et éviter les limites
CREATE INDEX IF NOT EXISTS ign_communes_geom_buffer_150m_idx ON public.ign_communes USING gist(st_buffer(geom, -150));

-- agrégation des données avant et après reseaux_de_chaleur
CREATE OR REPLACE VIEW wip_traces.changements_reseaux_de_chaleur AS
SELECT
  COALESCE(r1.id_fcu, r2.id_fcu) AS id_fcu,
  CASE
    WHEN r1.id_fcu IS NULL THEN 'Supprimé'
    WHEN r2.id_fcu IS NULL THEN 'Ajouté'
    WHEN
      not ST_Equals(
        COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)),
        COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154))
      )
      or COALESCE(r1.communes, ARRAY[]::TEXT[]) != COALESCE(r2.communes, ARRAY[]::TEXT[])
      or COALESCE(r1.id_sncu, '') != COALESCE(r2.id_sncu, '')
    THEN 'Modifié'
    ELSE 'Identique'
  END AS changement,
  COALESCE(r1.id_sncu, '') != COALESCE(r2.id_sncu, '') AS changement_id_sncu,
  COALESCE(r1.communes, ARRAY[]::TEXT[]) != COALESCE(r2.communes, ARRAY[]::TEXT[]) AS changement_communes,
  COALESCE(r1.communes, ARRAY[]::TEXT[]) != COALESCE(r1.ign_communes, ARRAY[]::TEXT[]) AS changement_ign_communes,
  not ST_Equals(
    COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)),
    COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154))
  ) AS changement_geom,

  COALESCE(r2.id_sncu, '') as id_sncu_old,
  COALESCE(r1.id_sncu, '') as id_sncu_new,

  COALESCE(r2.communes, ARRAY[]::TEXT[]) as communes_old,
  COALESCE(r1.communes, ARRAY[]::TEXT[]) as communes_new,
  COALESCE(r1.ign_communes, ARRAY[]::TEXT[]) as ign_communes,

  COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)) as geom_old,
  COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)) as geom_new
FROM (
  SELECT
    id_fcu,
    geom,
    (
      SELECT COALESCE(array_agg(elem ORDER BY elem), ARRAY[]::TEXT[])
      FROM unnest(communes) AS elem
    ) as communes,
    COALESCE(
      (
        SELECT array_agg(nom order by nom)
        FROM public.ign_communes
        WHERE ST_Intersects(wip_traces.reseaux_de_chaleur.geom, st_buffer(ign_communes.geom, -150))
      ),
      (
        SELECT array_agg(nom order by nom)
        FROM public.ign_communes
        WHERE ST_Intersects(wip_traces.reseaux_de_chaleur.geom, ign_communes.geom)
      )
    )::text[] as ign_communes,
    COALESCE("Identifiant reseau", '') as id_sncu
  FROM wip_traces.reseaux_de_chaleur
) r1
FULL JOIN (
  SELECT
    id_fcu,
    geom,
    (
      SELECT COALESCE(array_agg(elem ORDER BY elem), ARRAY[]::TEXT[])
      FROM unnest(communes) AS elem
    ) as communes,
    COALESCE("Identifiant reseau", '') as id_sncu
  FROM public.reseaux_de_chaleur
) r2 ON r1.id_fcu = r2.id_fcu
ORDER BY COALESCE(r1.id_fcu, r2.id_fcu);

-- agrégation des données avant et après reseaux_de_froid
CREATE OR REPLACE VIEW wip_traces.changements_reseaux_de_froid AS
SELECT
  COALESCE(r1.id_fcu, r2.id_fcu) AS id_fcu,
  CASE
    WHEN r1.id_fcu IS NULL THEN 'Supprimé'
    WHEN r2.id_fcu IS NULL THEN 'Ajouté'
    WHEN
      not ST_Equals(
        COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)),
        COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154))
      )
      or COALESCE(r1.communes, ARRAY[]::TEXT[]) != COALESCE(r2.communes, ARRAY[]::TEXT[])
      or COALESCE(r1.id_sncu, '') != COALESCE(r2.id_sncu, '')
    THEN 'Modifié'
    ELSE 'Identique'
  END AS changement,
  COALESCE(r1.id_sncu, '') != COALESCE(r2.id_sncu, '') AS changement_id_sncu,
  COALESCE(r1.communes, ARRAY[]::TEXT[]) != COALESCE(r2.communes, ARRAY[]::TEXT[]) AS changement_communes,
  COALESCE(r1.communes, ARRAY[]::TEXT[]) != COALESCE(r1.ign_communes, ARRAY[]::TEXT[]) AS changement_ign_communes,
  not ST_Equals(
    COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)),
    COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154))
  ) AS changement_geom,

  COALESCE(r2.id_sncu, '') as id_sncu_old,
  COALESCE(r1.id_sncu, '') as id_sncu_new,

  COALESCE(r2.communes, ARRAY[]::TEXT[]) as communes_old,
  COALESCE(r1.communes, ARRAY[]::TEXT[]) as communes_new,
  COALESCE(r1.ign_communes, ARRAY[]::TEXT[]) as ign_communes,

  COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)) as geom_old,
  COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)) as geom_new
FROM (
  SELECT
    id_fcu,
    geom,
    (
      SELECT COALESCE(array_agg(elem ORDER BY elem), ARRAY[]::TEXT[])
      FROM unnest(communes) AS elem
    ) as communes,
    COALESCE(
      (
        SELECT array_agg(nom order by nom)
        FROM public.ign_communes
        WHERE ST_Intersects(wip_traces.reseaux_de_froid.geom, st_buffer(ign_communes.geom, -150))
      ),
      (
        SELECT array_agg(nom order by nom)
        FROM public.ign_communes
        WHERE ST_Intersects(wip_traces.reseaux_de_froid.geom, ign_communes.geom)
      )
    )::text[] as ign_communes,
    COALESCE("Identifiant reseau", '') as id_sncu
  FROM wip_traces.reseaux_de_froid
) r1
FULL JOIN (
  SELECT
    id_fcu,
    geom,
    (
      SELECT COALESCE(array_agg(elem ORDER BY elem), ARRAY[]::TEXT[])
      FROM unnest(communes) AS elem
    ) as communes,
    COALESCE("Identifiant reseau", '') as id_sncu
  FROM public.reseaux_de_froid
) r2 ON r1.id_fcu = r2.id_fcu
ORDER BY COALESCE(r1.id_fcu, r2.id_fcu);


-- agrégation des données avant et après zones_de_developpement_prioritaire
CREATE OR REPLACE VIEW wip_traces.changements_zones_de_developpement_prioritaire AS
SELECT
  COALESCE(r1.id_fcu, r2.id_fcu) AS id_fcu,
  CASE
    WHEN r1.id_fcu IS NULL THEN 'Supprimé'
    WHEN r2.id_fcu IS NULL THEN 'Ajouté'
    WHEN
      not ST_Equals(
        COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)),
        COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154))
      )
    THEN 'Modifié'
    ELSE 'Identique'
  END AS changement,
  not ST_Equals(
    COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)),
    COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154))
  ) AS changement_geom,
  COALESCE(r1.ign_communes, ARRAY[]::TEXT[]) as ign_communes,

  COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)) as geom_old,
  COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)) as geom_new
FROM (
  SELECT
    id_fcu,
    geom,
    COALESCE(
      (
        SELECT array_agg(nom order by nom)
        FROM public.ign_communes
        WHERE ST_Intersects(wip_traces.zones_de_developpement_prioritaire.geom, st_buffer(ign_communes.geom, -150))
      ),
      (
        SELECT array_agg(nom order by nom)
        FROM public.ign_communes
        WHERE ST_Intersects(wip_traces.zones_de_developpement_prioritaire.geom, ign_communes.geom)
      )
    )::text[] as ign_communes
  FROM wip_traces.zones_de_developpement_prioritaire
) r1
FULL JOIN (
  SELECT
    id_fcu,
    geom
  FROM public.zone_de_developpement_prioritaire
) r2 ON r1.id_fcu = r2.id_fcu
ORDER BY COALESCE(r1.id_fcu, r2.id_fcu);

-- agrégation des données avant et après zones_et_reseaux_en_construction
CREATE OR REPLACE VIEW wip_traces.changements_zones_et_reseaux_en_construction AS
SELECT
  COALESCE(r1.id_fcu, r2.id_fcu) AS id_fcu,
  CASE
    WHEN r1.id_fcu IS NULL THEN 'Supprimé'
    WHEN r2.id_fcu IS NULL THEN 'Ajouté'
    WHEN
      not ST_Equals(
        COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)),
        COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154))
      )
      or COALESCE(r1.communes, ARRAY[]::TEXT[]) != COALESCE(r2.communes, ARRAY[]::TEXT[])
    THEN 'Modifié'
    ELSE 'Identique'
  END AS changement,
  COALESCE(r1.communes, ARRAY[]::TEXT[]) != COALESCE(r2.communes, ARRAY[]::TEXT[]) AS changement_communes,
  COALESCE(r1.communes, ARRAY[]::TEXT[]) != COALESCE(r1.ign_communes, ARRAY[]::TEXT[]) AS changement_ign_communes,
  not ST_Equals(
    COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)),
    COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154))
  ) AS changement_geom,

  COALESCE(r2.communes, ARRAY[]::TEXT[]) as communes_old,
  COALESCE(r1.communes, ARRAY[]::TEXT[]) as communes_new,
  COALESCE(r1.ign_communes, ARRAY[]::TEXT[]) as ign_communes,

  COALESCE(r2.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)) as geom_old,
  COALESCE(r1.geom, ST_SetSRID(ST_GeomFromText('POINT EMPTY'), 2154)) as geom_new
FROM (
  SELECT
    id_fcu,
    geom,
    (
      SELECT COALESCE(array_agg(elem ORDER BY elem), ARRAY[]::TEXT[])
      FROM unnest(communes) AS elem
    ) as communes,
    COALESCE(
      (
        SELECT array_agg(nom order by nom)
        FROM public.ign_communes
        WHERE ST_Intersects(wip_traces.zones_et_reseaux_en_construction_full.geom, st_buffer(ign_communes.geom, -150))
      ),
      (
        SELECT array_agg(nom order by nom)
        FROM public.ign_communes
        WHERE ST_Intersects(wip_traces.zones_et_reseaux_en_construction_full.geom, ign_communes.geom)
      )
    )::text[] as ign_communes
  FROM wip_traces.zones_et_reseaux_en_construction_full
) r1
FULL JOIN (
  SELECT
    id_fcu,
    geom,
    (
      SELECT COALESCE(array_agg(elem ORDER BY elem), ARRAY[]::TEXT[])
      FROM unnest(communes) AS elem
    ) as communes
  FROM public.zones_et_reseaux_en_construction
) r2 ON r1.id_fcu = r2.id_fcu
ORDER BY COALESCE(r1.id_fcu, r2.id_fcu);


-- Tous les changements
SELECT *
FROM wip_traces.changements_reseaux_de_chaleur
where changement != 'Identique';
-- 126

SELECT *
FROM wip_traces.changements_reseaux_de_chaleur
where changement_id_sncu = true;
-- 64

SELECT *
FROM wip_traces.changements_reseaux_de_chaleur
where changement_communes = true;
-- 97

SELECT *
FROM wip_traces.changements_reseaux_de_chaleur
where changement_geom = true;
-- 44


-- export en CSV des changements pour Florence, avec troncage des géométries
SELECT
  id_fcu,
  changement,
  changement_id_sncu,
  changement_communes,
  changement_ign_communes,
  changement_geom,
  id_sncu_old,
  id_sncu_new,
  array_to_string(communes_old, ', ') as communes_old,
  array_to_string(communes_new, ', ') as communes_new,
  array_to_string(ign_communes, ', ') as ign_communes,
  substring(st_asgeojson(st_transform(geom_old, 4326))::text, 0, 100) as geom_old,
  substring(st_asgeojson(st_transform(geom_new, 4326))::text, 0, 100) as geom_new
FROM wip_traces.changements_reseaux_de_chaleur
where changement != 'Identique';

SELECT
  id_fcu,
  changement,
  changement_id_sncu,
  changement_communes,
  changement_ign_communes,
  changement_geom,
  id_sncu_old,
  id_sncu_new,
  communes_old,
  communes_new,
  ign_communes,
  substring(st_asgeojson(st_transform(geom_old, 4326))::text, 0, 100) as geom_old,
  substring(st_asgeojson(st_transform(geom_new, 4326))::text, 0, 100) as geom_new
FROM wip_traces.changements_reseaux_de_froid
where changement != 'Identique';
```

```sh
# export en GeoJSON des différences des tracés changements_reseaux_de_chaleur
psql postgres://postgres:postgres_fcu@localhost:5432/postgres -c "COPY (
WITH changements AS (
  SELECT *
  FROM wip_traces.changements_reseaux_de_chaleur
  where changement_geom = true
)
SELECT
  json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(features ORDER BY CAST(features->'properties'->>'id_fcu' AS integer))
  )
FROM (
  SELECT json_build_object(
      'id', id_fcu || '-identique',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(ST_Intersection(geom_new, geom_old), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section inchangée',
        'changement', changement,
        'changement_id_sncu', changement_id_sncu,
        'changement_communes', changement_communes,
        'changement_ign_communes', changement_ign_communes,
        'changement_geom', changement_geom,
        'id_sncu_old', id_sncu_old,
        'id_sncu_new', id_sncu_new,
        'communes_old', array_to_string(communes_old, ', '),
        'communes_new', array_to_string(communes_new, ', '),
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#000000',
        'fill-opacity', 0.5,
        'marker-color', '#000000',
        'stroke', '#000000',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(ST_Intersection(geom_new, geom_old))
  UNION ALL
  SELECT json_build_object(
      'id', id_fcu || '-suppression',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(st_difference(geom_old, geom_new), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section supprimée',
        'changement', changement,
        'changement_id_sncu', changement_id_sncu,
        'changement_communes', changement_communes,
        'changement_ign_communes', changement_ign_communes,
        'changement_geom', changement_geom,
        'id_sncu_old', id_sncu_old,
        'id_sncu_new', id_sncu_new,
        'communes_old', array_to_string(communes_old, ', '),
        'communes_new', array_to_string(communes_new, ', '),
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#f50000',
        'fill-opacity', 0.5,
        'marker-color', '#f50000',
        'stroke', '#f50000',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(st_difference(geom_old, geom_new))
  UNION ALL
  SELECT json_build_object(
      'id', id_fcu || '-ajout',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(st_difference(geom_new, geom_old), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section ajoutée',
        'changement', changement,
        'changement_id_sncu', changement_id_sncu,
        'changement_communes', changement_communes,
        'changement_ign_communes', changement_ign_communes,
        'changement_geom', changement_geom,
        'id_sncu_old', id_sncu_old,
        'id_sncu_new', id_sncu_new,
        'communes_old', array_to_string(communes_old, ', '),
        'communes_new', array_to_string(communes_new, ', '),
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#00f500',
        'fill-opacity', 0.5,
        'marker-color', '#00f500',
        'stroke', '#00f500',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(st_difference(geom_new, geom_old))
) as sub
) TO STDOUT" > changements_reseaux_de_chaleur.geojson

# export en GeoJSON des différences des tracés changements_reseaux_de_froid
psql postgres://postgres:postgres_fcu@localhost:5432/postgres -c "COPY (
WITH changements AS (
  SELECT *
  FROM wip_traces.changements_reseaux_de_froid
  where changement_geom = true
)
SELECT
  json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(features ORDER BY CAST(features->'properties'->>'id_fcu' AS integer))
  )
FROM (
  SELECT json_build_object(
      'id', id_fcu || '-identique',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(ST_Intersection(geom_new, geom_old), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section inchangée',
        'changement', changement,
        'changement_id_sncu', changement_id_sncu,
        'changement_communes', changement_communes,
        'changement_ign_communes', changement_ign_communes,
        'changement_geom', changement_geom,
        'id_sncu_old', id_sncu_old,
        'id_sncu_new', id_sncu_new,
        'communes_old', array_to_string(communes_old, ', '),
        'communes_new', array_to_string(communes_new, ', '),
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#000000',
        'fill-opacity', 0.5,
        'marker-color', '#000000',
        'stroke', '#000000',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(ST_Intersection(geom_new, geom_old))
  UNION ALL
  SELECT json_build_object(
      'id', id_fcu || '-suppression',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(st_difference(geom_old, geom_new), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section supprimée',
        'changement', changement,
        'changement_id_sncu', changement_id_sncu,
        'changement_communes', changement_communes,
        'changement_ign_communes', changement_ign_communes,
        'changement_geom', changement_geom,
        'id_sncu_old', id_sncu_old,
        'id_sncu_new', id_sncu_new,
        'communes_old', array_to_string(communes_old, ', '),
        'communes_new', array_to_string(communes_new, ', '),
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#f50000',
        'fill-opacity', 0.5,
        'marker-color', '#f50000',
        'stroke', '#f50000',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(st_difference(geom_old, geom_new))
  UNION ALL
  SELECT json_build_object(
      'id', id_fcu || '-ajout',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(st_difference(geom_new, geom_old), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section ajoutée',
        'changement', changement,
        'changement_id_sncu', changement_id_sncu,
        'changement_communes', changement_communes,
        'changement_ign_communes', changement_ign_communes,
        'changement_geom', changement_geom,
        'id_sncu_old', id_sncu_old,
        'id_sncu_new', id_sncu_new,
        'communes_old', array_to_string(communes_old, ', '),
        'communes_new', array_to_string(communes_new, ', '),
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#00f500',
        'fill-opacity', 0.5,
        'marker-color', '#00f500',
        'stroke', '#00f500',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(st_difference(geom_new, geom_old))
) as sub
) TO STDOUT" > changements_reseaux_de_froid.geojson

# export en GeoJSON des différences des tracés changements_zones_de_developpement_prioritaire
psql postgres://postgres:postgres_fcu@localhost:5432/postgres -c "COPY (
WITH changements AS (
  SELECT *
  FROM wip_traces.changements_zones_de_developpement_prioritaire
  where changement_geom = true
)
SELECT
  json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(features ORDER BY CAST(features->'properties'->>'id_fcu' AS integer))
  )
FROM (
  SELECT json_build_object(
      'id_fcu', id_fcu || '-identique',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(ST_Intersection(geom_new, geom_old), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section inchangée',
        'changement', changement,
        'changement_geom', changement_geom,
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#000000',
        'fill-opacity', 0.5,
        'marker-color', '#000000',
        'stroke', '#000000',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(ST_Intersection(geom_new, geom_old))
  UNION ALL
  SELECT json_build_object(
      'id_fcu', id_fcu || '-suppression',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(st_difference(geom_old, geom_new), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section supprimée',
        'changement', changement,
        'changement_geom', changement_geom,
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#f50000',
        'fill-opacity', 0.5,
        'marker-color', '#f50000',
        'stroke', '#f50000',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(st_difference(geom_old, geom_new))
  UNION ALL
  SELECT json_build_object(
      'id_fcu', id_fcu || '-ajout',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(st_difference(geom_new, geom_old), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section ajoutée',
        'changement', changement,
        'changement_geom', changement_geom,
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#00f500',
        'fill-opacity', 0.5,
        'marker-color', '#00f500',
        'stroke', '#00f500',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(st_difference(geom_new, geom_old))
) as sub
) TO STDOUT" > changements_zones_de_developpement_prioritaire.geojson

# export en GeoJSON des différences des tracés changements_zones_et_reseaux_en_construction
psql postgres://postgres:postgres_fcu@localhost:5432/postgres -c "COPY (
WITH changements AS (
  SELECT *
  FROM wip_traces.changements_zones_et_reseaux_en_construction
  where changement_geom = true
)
SELECT
  json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(features ORDER BY CAST(features->'properties'->>'id_fcu' AS integer))
  )
FROM (
  SELECT json_build_object(
      'id', id_fcu || '-identique',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(ST_Intersection(geom_new, geom_old), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section inchangée',
        'changement', changement,
        'changement_communes', changement_communes,
        'changement_ign_communes', changement_ign_communes,
        'changement_geom', changement_geom,
        'communes_old', array_to_string(communes_old, ', '),
        'communes_new', array_to_string(communes_new, ', '),
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#000000',
        'fill-opacity', 0.5,
        'marker-color', '#000000',
        'stroke', '#000000',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(ST_Intersection(geom_new, geom_old))
  UNION ALL
  SELECT json_build_object(
      'id', id_fcu || '-suppression',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(st_difference(geom_old, geom_new), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section supprimée',
        'changement', changement,
        'changement_communes', changement_communes,
        'changement_ign_communes', changement_ign_communes,
        'changement_geom', changement_geom,
        'communes_old', array_to_string(communes_old, ', '),
        'communes_new', array_to_string(communes_new, ', '),
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#f50000',
        'fill-opacity', 0.5,
        'marker-color', '#f50000',
        'stroke', '#f50000',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(st_difference(geom_old, geom_new))
  UNION ALL
  SELECT json_build_object(
      'id', id_fcu || '-ajout',
      'type', 'Feature',
      'geometry', st_asgeojson(st_transform(st_difference(geom_new, geom_old), 4326))::jsonb,
      'properties', json_build_object(
        'id_fcu', id_fcu,
        'modification', 'section ajoutée',
        'changement', changement,
        'changement_communes', changement_communes,
        'changement_ign_communes', changement_ign_communes,
        'changement_geom', changement_geom,
        'communes_old', array_to_string(communes_old, ', '),
        'communes_new', array_to_string(communes_new, ', '),
        'ign_communes', array_to_string(ign_communes, ', '),
        'fill', '#00f500',
        'fill-opacity', 0.5,
        'marker-color', '#00f500',
        'stroke', '#00f500',
        'stroke-width', 4,
        'stroke-opacity', 0.8
      )
    ) as features
  FROM changements
  WHERE NOT ST_IsEmpty(st_difference(geom_new, geom_old))
) as sub
) TO STDOUT" > changements_zones_et_reseaux_en_construction.geojson


# installer la CLI github si ce n'est pas déjà fait
gh auth login

# créer les gist github
gh gist create changements_reseaux_de_chaleur.geojson --public --desc "Changements réseaux de chaleur"
gh gist create changements_reseaux_de_froid.geojson --public --desc "Changements réseaux de froid"
gh gist create changements_zones_de_developpement_prioritaire.geojson --public --desc "Changements zones de développement prioritaire"
gh gist create changements_zones_et_reseaux_en_construction.geojson --public --desc "Changements zones et réseaux en construction"
# - Creating gist changements_reseaux_de_chaleur.geojson
# ✓ Created public gist changements_reseaux_de_chaleur.geojson
# https://gist.github.com/totakoko/f398b8f0cbbae52cbe224542d3b6247e
# - Creating gist changements_reseaux_de_froid.geojson
# ✓ Created public gist changements_reseaux_de_froid.geojson
# https://gist.github.com/totakoko/64119348f2f01d3ad028d0fb5c15d74d
# - Creating gist changements_zones_de_developpement_prioritaire.geojson
# ✓ Created public gist changements_zones_de_developpement_prioritaire.geojson
# https://gist.github.com/totakoko/d5fe1dfcdaeab8f1e213441b7c1e8bbf
# - Creating gist changements_zones_et_reseaux_en_construction.geojson
# ✓ Created public gist changements_zones_et_reseaux_en_construction.geojson
# https://gist.github.com/totakoko/014c9f8c6cdc8bd7ab6792deb6a4f09c


# pour mettre à jour le gist (avec l'id récupéré depuis l'URL)
gh gist edit f398b8f0cbbae52cbe224542d3b6247e -a changements_reseaux_de_chaleur.geojson
gh gist edit 64119348f2f01d3ad028d0fb5c15d74d -a changements_reseaux_de_froid.geojson
gh gist edit d5fe1dfcdaeab8f1e213441b7c1e8bbf -a changements_zones_de_developpement_prioritaire.geojson
gh gist edit 014c9f8c6cdc8bd7ab6792deb6a4f09c -a changements_zones_et_reseaux_en_construction.geojson
```

Envoyer les liens à l'équipe Florence / Léa pour voir les changements (noter que les métadonnées ne sont pas présentes, et que ça serait intéressant)

```md
Changements de sébastien du 07/11/2024 :
- [Changements réseaux de chaleur](https://geojson.io/#id=gist:totakoko/f398b8f0cbbae52cbe224542d3b6247e)
- [Changements réseaux de froid](https://geojson.io/#id=gist:totakoko/64119348f2f01d3ad028d0fb5c15d74d)
- [Changements zones de développement prioritaire](https://geojson.io/#id=gist:totakoko/d5fe1dfcdaeab8f1e213441b7c1e8bbf)
- [Changements zones et réseaux en construction](https://geojson.io/#id=gist:totakoko/014c9f8c6cdc8bd7ab6792deb6a4f09c)

Explications :
- Différence entre les tracés en production et les mises à jour de Sébastien.
- Quand je détecte un changement de géométrie, j'affiche pour chaque feature : la section identique en noir, la nouvelle section en vert, la section supprimée en rouge.
- Penser à activer le fond light pour afficher les tracés au dessus des bâtiments sinon ils sont parfois masqués.
```


## Étapes application des changements et synchro avec airtable

On applique les changements de géométrie + maj airtable
```sh
pnpm cli apply-geometry-updates
mkdir maj_tracés_réseaux
mv changements* maj_tracés_réseaux/
```

Les changements peuvent être utilisés pour suivre ce qui a changé.
Ils sont déplacés dans un répertoire car le logger vide les fichiers quand on lance la CLI.


```sh
# mise à jour des métadonnées avec airtable
pnpm cli download-network network
pnpm cli download-network coldNetwork
pnpm cli download-network futurNetwork

# voir génération custom via geojson pour les réseaux de chaleur via doc !
pnpm cli tiles:import-geojson-legacy reseaux_de_chaleur.geojson reseaux_de_chaleur_tiles 0 14
pnpm cli tiles:fill coldNetwork 0 14
pnpm cli tiles:fill zoneDP 0 14
pnpm cli tiles:fill futurNetwork 0 14

# copie en dev
./scripts/copyLocalTableToRemote.sh dev reseaux_de_chaleur --data-only
./scripts/copyLocalTableToRemote.sh dev reseaux_de_froid --data-only
./scripts/copyLocalTableToRemote.sh dev zone_de_developpement_prioritaire --data-only
./scripts/copyLocalTableToRemote.sh dev zones_et_reseaux_en_construction --data-only

./scripts/copyLocalTableToRemote.sh dev reseaux_de_chaleur_tiles --data-only
./scripts/copyLocalTableToRemote.sh dev reseaux_de_froid_tiles --data-only
./scripts/copyLocalTableToRemote.sh dev zone_de_developpement_prioritaire_tiles --data-only
./scripts/copyLocalTableToRemote.sh dev zones_et_reseaux_en_construction_tiles --data-only

# copie en prod
./scripts/copyLocalTableToRemote.sh prod reseaux_de_chaleur --data-only
./scripts/copyLocalTableToRemote.sh prod reseaux_de_froid --data-only
./scripts/copyLocalTableToRemote.sh prod zone_de_developpement_prioritaire --data-only
./scripts/copyLocalTableToRemote.sh prod zones_et_reseaux_en_construction --data-only

./scripts/copyLocalTableToRemote.sh prod reseaux_de_chaleur_tiles --data-only
./scripts/copyLocalTableToRemote.sh prod reseaux_de_froid_tiles --data-only
./scripts/copyLocalTableToRemote.sh prod zone_de_developpement_prioritaire_tiles --data-only
./scripts/copyLocalTableToRemote.sh prod zones_et_reseaux_en_construction_tiles --data-only
```
