# Procédure pour exporter les batiments et logements à proximité de réseaux de chaleur

Prérequis :
- posséder les tables :
  - bdnb_registre_2022 (provenance Sébastien)
  - Donnees_de_conso_et_pdl_gaz_nat_2022 (provenance Sébastien)
  - reseaux_de_chaleur
- psql (CLI postgresql)
- [parallel](https://www.gnu.org/software/parallel/) (Pour macOS : `brew install parallel`)
- probablement avoir tuné la configuration postgresql pour augmenter la taille des buffers

## Étapes

Note : Idéalement, les étapes sont faites avec une grosse configuration postgres.

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
psql postgres://postgres:postgres_fcu@localhost:5432 -f fix-bdnb-registre-sans-code-departement.sql

# création d'un index spgist (partitionné et un peu plus efficace que gist) sur la geom des réseaux
psql postgres://postgres:postgres_fcu@localhost:5432 -c "create index if not exists reseaux_de_chaleur_geom_spidx on reseaux_de_chaleur using spgist(geom);"
psql postgres://postgres:postgres_fcu@localhost:5432 -c "create index if not exists zones_et_reseaux_en_construction_geom_spidx on zones_et_reseaux_en_construction using spgist(geom);"

# précalcul de toutes les données de proximité dans des tables prêtes à être exploitées
./prepare-batiments-summary.sh

# export des métriques en CSV
./export-batiments-summary.sh
```


## Maille EPCI

Le même export est demandé à la maille EPCI plutôt que département.

- Maj des tables consolidées :
```sql
-- ajout de la colonne EPCI aux summary
alter table batiments_summary_reseaux_de_chaleur add column code_epci_insee varchar;
alter table batiments_summary_reseaux_en_construction add column code_epci_insee varchar;

-- modification depuis la table bdnb
update batiments_summary_reseaux_de_chaleur summary set code_epci_insee = bdnb.code_epci_insee
from bdnb_registre_2022 bdnb
where bdnb.id = summary.id;
update batiments_summary_reseaux_en_construction summary set code_epci_insee = bdnb.code_epci_insee
from bdnb_registre_2022 bdnb
where bdnb.id = summary.id;
```

- Adaptation du script `export-batiments-summary.sh` pour ajouter l'export du champ code_epci_insee.
