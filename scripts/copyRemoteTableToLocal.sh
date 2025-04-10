#!/bin/bash -e

usage() {
  echo "Usage: copyRemoteTableToLocal.sh <dev|prod> <table_name> [--data-only]"
  echo "Used to synchronize a remote table with a local table (dropped and recreated each sync)"
  echo "Use --data-only to perform a zero downtime update (in a transaction)"
  echo "Use the env variable SCALINGO_TUNNEL_ARGS=\"-i $HOME/.ssh/keys/path_to_keys_ed\" if your SSH key is not ~/.ssh/id_rsa"
}

env=$1
table=$2
options=$3
if [[ $env != "dev" && $env != "prod" ]]; then
  usage
  exit 1
fi

if [[ "$table" = "" ]]; then
  usage
  exit 1
fi

if [[ $options == "--data-only" ]] ; then
  dataonly=true
fi

if [[ $env = "prod" ]]; then
  SCALINGO_APP=france-chaleur-urbaine
  DB_PORT=10001
else
  SCALINGO_APP=france-chaleur-urbaine-dev
  DB_PORT=10000
fi

# Check if there's already a process using the DB_PORT
PORT_IN_USE=$(lsof -i :$DB_PORT > /dev/null 2>&1; echo $?)

if [ $PORT_IN_USE -ne 0 ]; then
  echo "Database tunnel not running, starting it..."
  # ferme le tunnel quand le programme s'arrête
  trap 'kill %1' EXIT

  # ouvre un tunnel vers BDD distance
  scalingo -a $SCALINGO_APP db-tunnel $SCALINGO_TUNNEL_ARGS SCALINGO_POSTGRESQL_URL &
  sleep 4
fi


echo "> Synchronisation de la table distante '$table' depuis l'environnement $env..."

POSTGRESQL_URL=$(scalingo -a $SCALINGO_APP env-get SCALINGO_POSTGRESQL_URL)
export PGUSER=$(expr $POSTGRESQL_URL : '.*/\([^:]*\):.*')
export PGPASSWORD=$(expr $POSTGRESQL_URL : '.*:\([^@]*\)@.*')

echo "Exporting data from remote database $env:$DB_PORT..."
# export depuis BDD distance
if [[ $dataonly = "true" ]]; then
  pg_dump postgres://localhost:$DB_PORT --data-only -t $table >/tmp/table.dump.sql
else
  pg_dump postgres://localhost:$DB_PORT --format=c --no-owner -t $table >/tmp/table.dump
fi

if [ $PORT_IN_USE -ne 0 ]; then
  echo "Closing database tunnel..."
  # ferme le tunnel
  kill %1
fi

echo "Importing data from $table to $env database..."
# import vers BDD locale
if [[ $dataonly = "true" ]]; then
  # noter le delete plutôt que truncate pour ne pas locker la table et bloquer les requêtes
  psql -v ON_ERROR_STOP=1 postgres://postgres:postgres_fcu@localhost:5432/postgres --single-transaction -c "delete from $table;" -f /tmp/table.dump.sql
else
  psql -v ON_ERROR_STOP=1 postgres://postgres:postgres_fcu@localhost:5432/postgres -c "DROP TABLE IF EXISTS $table CASCADE;"
  pg_restore --no-owner --clean --if-exists -d postgres://postgres:postgres_fcu@localhost:5432/postgres /tmp/table.dump
fi

echo "> Synchronisation terminée de $env -> local pour la table '$table'"
