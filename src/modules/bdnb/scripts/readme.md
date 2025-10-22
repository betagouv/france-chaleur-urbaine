# Procédure pour exporter les batiments et logements à proximité de réseaux de chaleur

# /!\\
# /!\\ Non à jour car bdnb_registre_2022 a été remplacé par bdnb_batiments
# /!\\

## Étapes

Prérequis :
- posséder les tables :
  - bdnb_registre_2022 (provenance Sébastien)
  - Donnees_de_conso_et_pdl_gaz_nat_2022 (provenance Sébastien)
  - reseaux_de_chaleur
- psql (CLI postgresql)
- [parallel](https://www.gnu.org/software/parallel/) (Pour macOS : `brew install parallel`, Pour ubuntu : `apt install parallel`)
- probablement avoir tuné la configuration postgresql pour augmenter la taille des buffers

Note : Idéalement, les étapes sont faites avec une grosse configuration postgres.

```sh
cd src/modules/bdnb/scripts

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
