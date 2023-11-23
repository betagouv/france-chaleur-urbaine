# Procédure pour exporter les batiments et logements à proximité de réseaux de chaleur

Prérequis :
- posséder les tables :
  - bdnb_registre_2022 (provenance Sébastien)
  - reseaux_de_chaleur
- psql (CLI postgresql)
- [parallel](https://www.gnu.org/software/parallel/)
- probablement avoir tuné la configuration postgresql pour augmenter la taille des buffers

## Étapes

```sh
cd scripts/bdnb

# importer la table departements (utilisée pour récupérer les labels des départements et régions)
psql postgres://postgres:postgres_fcu@localhost:5432 -f create-table-departements.sql

# correction des 28k codes département manquant pour les batiments issus du registre
psql postgres://postgres:postgres_fcu@localhost:5432 <<EOF
UPDATE bdnb_registre_2022
SET code_departement_insee = substring(libelle_adr_principale_ban from '(\d{2})\d{2,3}')
WHERE code_departement_insee is null;
EOF

# correction des 360 codes via données de Sébastien (puis il en restera que 4)
psql postgres://postgres:postgres_fcu@localhost:5432 -f ./scripts/bdnb/fix-bdnb-registre-sans-code-departement.sql

# création d'un index spgist (partitionné et un peu plus efficace que gist) sur la geom des réseaux
psql postgres://postgres:postgres_fcu@localhost:5432 -c "create index if not exists reseaux_de_chaleur_geom_spidx on reseaux_de_chaleur using spgist(geom);"
psql postgres://postgres:postgres_fcu@localhost:5432 -c "create index if not exists zones_et_reseaux_en_construction_geom_spidx on zones_et_reseaux_en_construction using spgist(geom);"

# précalcul de toutes les données de proximité dans des tables prêtes à être exploitées
./prepare-batiments-summary.sh

# export des métriques en CSV
./export-batiments-summary.sh
```
