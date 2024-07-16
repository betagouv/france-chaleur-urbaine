#!/bin/bash -e

usage() {
  echo "Usage: copyRemoteTableToLocal.sh <dev|prod> <table_name>"
  echo "Used to synchronize a remote table with a local table (dropped and recreated each sync)"
  echo "Use the env variable SCALINGO_TUNNEL_ARGS=\"-i $HOME/.ssh/keys/path_to_keys_ed\" if your SSH key is not ~/.ssh/id_rsa"
}

env=$1
table=$2
options=$3
if [[ $env != "dev" && $env != "prod" ]]; then
  usage
  exit 1+
fi

if [[ "$table" = "" ]]; then
  usage
  exit 1
fi

if [[ $env = "prod" ]]; then
  SCALINGO_APP=france-chaleur-urbaine
else
  SCALINGO_APP=france-chaleur-urbaine-dev
fi

echo "> Synchronisation de la table distante '$table' depuis l'environnement $env..."

# ouvre un tunnel vers BDD distance
scalingo -a $SCALINGO_APP db-tunnel $SCALINGO_TUNNEL_ARGS SCALINGO_POSTGRESQL_URL &
sleep 4

POSTGRESQL_URL=$(scalingo -a $SCALINGO_APP env-get SCALINGO_POSTGRESQL_URL)
export PGUSER=$(expr $POSTGRESQL_URL : '.*/\([^:]*\):.*')
export PGPASSWORD=$(expr $POSTGRESQL_URL : '.*:\([^@]*\)@.*')

# export depuis BDD distance
pg_dump postgres://localhost:10000 --format=c --no-owner -t $table >/tmp/table.dump

# ferme le tunnel
kill %1

# import vers BDD locale
pg_restore --no-owner --clean --if-exists -d postgres://postgres:postgres_fcu@localhost:5432/postgres /tmp/table.dump

echo "> Synchronisation terminée de $env -> local pour la table '$table'"
