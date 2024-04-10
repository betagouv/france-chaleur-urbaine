#!/bin/bash -e

usage() {
  echo "Usage: copyLocalTableToRemote.sh <dev|prod> <table_name> [--data-only]"
  echo "Used to synchronize a local table with a remote table (dropped and recreated each sync)"
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

# export depuis BDD locale
if [[ $dataonly = "true" ]]; then
  pg_dump postgres://postgres:postgres_fcu@localhost:5432/postgres --data-only -t $table >/tmp/table.dump.sql
else
  pg_dump postgres://postgres:postgres_fcu@localhost:5432/postgres --format=c --no-owner -t $table >/tmp/table.dump
fi

if [[ $env = "prod" ]]; then
  SCALINGO_APP=france-chaleur-urbaine
else
  SCALINGO_APP=france-chaleur-urbaine-dev
fi

echo "> Synchronisation de la table locale '$table' vers l'environnement $env..."

# ouvre un tunnel vers BDD cible
scalingo -a $SCALINGO_APP db-tunnel $SCALINGO_TUNNEL_ARGS SCALINGO_POSTGRESQL_URL &
sleep 4

# import vers BDD cible
POSTGRESQL_URL=$(scalingo -a $SCALINGO_APP env-get SCALINGO_POSTGRESQL_URL)
export PGUSER=$(expr $POSTGRESQL_URL : '.*/\([^:]*\):.*')
export PGPASSWORD=$(expr $POSTGRESQL_URL : '.*:\([^@]*\)@.*')

# copie des données
if [[ $dataonly = "true" ]]; then
  # noter le delete plutôt que truncate pour ne pas locker la table et bloquer les requêtes
  psql -v ON_ERROR_STOP=1 postgres://localhost:10000 --single-transaction -c "delete from $table;" -f /tmp/table.dump.sql
else
  pg_restore --no-owner --clean --if-exists -d postgres://localhost:10000 /tmp/table.dump
fi


# ferme le tunnel
kill %1

echo "> Synchronisation terminée sur $env pour la table '$table'"
