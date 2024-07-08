#!/bin/bash -e

tables=('donnees_de_consos' 'reseaux_de_chaleur' 'reseaux_de_froid' 'zone_de_developpement_prioritaire' 'zones_et_reseaux_en_construction')
usage() {
  echo "Usage: copyLocalNetworkToRemote.sh <preprod|prod> <${tables[@]}>"
}

env=$1
table=$2
if [[ $env != "preprod" && $env != "prod" ]]; then
  usage
  exit 1
fi

if [[ ! "${tables[@]}" =~ "$table" ]]; then
  usage
  exit 1
fi

# export depuis BDD locale
pg_dump postgres://postgres:dummy@localhost:5432 --format=c --data-only -t ${table} >/tmp/table.dump
pg_dump postgres://postgres:dummy@localhost:5432 --format=c --data-only -t ${table}_tiles >/tmp/tiles.dump

if [[ $env = "prod" ]]; then
  SCALINGO_APP=france-chaleur-urbaine
else
  SCALINGO_APP=france-chaleur-urbaine-dev
fi

echo "> Mise à jour table '$table' sur l'environnement de $env en cours"

# ouvre un tunnel vers BDD cible
scalingo -a $SCALINGO_APP db-tunnel SCALINGO_POSTGRESQL_URL &
sleep 4

# import vers BDD cible
POSTGRESQL_URL=$(scalingo -a $SCALINGO_APP env-get SCALINGO_POSTGRESQL_URL)
export PGUSER=$(expr $POSTGRESQL_URL : '.*/\([^:]*\):.*')
export PGPASSWORD=$(expr $POSTGRESQL_URL : '.*:\([^@]*\)@.*')
psql postgres://localhost:10000 -c "truncate ${table}"
psql postgres://localhost:10000 -c "truncate ${table}_tiles"
pg_restore -d postgres://localhost:10000 --data-only /tmp/table.dump
pg_restore -d postgres://localhost:10000 --data-only /tmp/tiles.dump

# ferme le tunnel
kill %1

echo "> Mise à jour terminée sur $env pour les tables '$table' et '${table}_tiles'"
