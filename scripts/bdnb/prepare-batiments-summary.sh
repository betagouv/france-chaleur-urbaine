#!/bin/bash -e

# Prépare et calcule les distance entre les batiments et les réseaux en utilisant la table bndb_registre_2022.
# Plutôt que calculer d'un coup toutes les distances, ce qui peut prendre globalement 6h20 en local avec juste 1 CPU à fond
# et pas de mémoire ou disque utilisé, on parallélise au maximum en lançant $(nproc) requêtes en parallèle.
# Les requêtes travaillent sur un sous-ensemble de la bdnb 24 millions de lignes qui est découpée par tranches de 10k batiments
# pour paralléliser au mieux, car certaines tranches de batiments mettent quelques millisecondes à être traitées tandis que
# d'autres mettent jusqu'à 20 minutes...
# Grâce à cette parallélisation qui utilise 2400 tables temporaires, le script met 25 minutes en local à traiter les tests de
# proximité avec les réseaux de chaleur.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR"/lib.sh

# Décommenter pour écrire dans un fichier en plus de la sortie standard
# exec &> >(tee batiments-summary.log)

# 1. Test d'existance qu'un batiment est à proximité des réseaux de chaleur
split_bdnb_table_query batiments_summary_reseaux_de_chaleur "
SELECT
  id,
  code_departement_insee,
  departements.nom as departement,
  departements.region,
  dpe_mix_arrete_type_installation_chauffage,
  dpe_mix_arrete_type_energie_chauffage,
  ffo_bat_nb_log,

  EXISTS (
    SELECT *
    FROM reseaux_de_chaleur reseau
    WHERE ST_DWithin(
      batiment.geom,
      reseau.geom,
      50)
    LIMIT 1
  ) as is_close_50,

  EXISTS (
    SELECT *
    FROM reseaux_de_chaleur reseau
    WHERE ST_DWithin(
      batiment.geom,
      reseau.geom,
      100)
    LIMIT 1
  ) as is_close_100,

  EXISTS (
    SELECT *
    FROM reseaux_de_chaleur reseau
    WHERE ST_DWithin(
      batiment.geom,
      reseau.geom,
      150)
    LIMIT 1
  ) as is_close_150

FROM bdnb_registre_2022 as batiment
LEFT JOIN departements ON departements.code = batiment.code_departement_insee
"

# 2. Test d'existance qu'un batiment est à proximité des réseaux en constuction OU qu'un batiment est dans les zones en constuction
split_bdnb_table_query batiments_summary_reseaux_en_construction "
SELECT
  id,
  code_departement_insee,
  departements.nom as departement,
  departements.region,
  dpe_mix_arrete_type_installation_chauffage,
  dpe_mix_arrete_type_energie_chauffage,
  ffo_bat_nb_log,

  EXISTS (
    SELECT *
    FROM zones_et_reseaux_en_construction reseau
    WHERE ST_DWithin(
        batiment.geom,
        reseau.geom,
        50
      )
	    AND is_zone is false
    LIMIT 1
  ) as is_close_50,

  EXISTS (
    SELECT *
    FROM zones_et_reseaux_en_construction reseau
    WHERE ST_DWithin(
        batiment.geom,
        reseau.geom,
        100
      )
	    AND is_zone is false
    LIMIT 1
  ) as is_close_100,

  EXISTS (
    SELECT *
    FROM zones_et_reseaux_en_construction reseau
    WHERE ST_DWithin(
        batiment.geom,
        reseau.geom,
        150
      )
	    AND is_zone is false
    LIMIT 1
  ) as is_close_150,

  EXISTS (
    SELECT *
    FROM zones_et_reseaux_en_construction reseau
    WHERE ST_Intersects(
        batiment.geom,
        reseau.geom
      )
      AND is_zone is true
    LIMIT 1
  ) as is_in_zone

FROM bdnb_registre_2022 as batiment
LEFT JOIN departements ON departements.code = batiment.code_departement_insee
"
