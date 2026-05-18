#!/bin/bash -e

usage() {
  echo "Usage: dropRemoteTables.sh <dev|prod> <table_name1> [table_name2 ...]"
  echo "Drops the given tables from the remote database (CASCADE)."
  echo ""
  echo "Pour la prod : passer --i-know-what-im-doing et taper la confirmation interactive."
  echo "  ex: ./scripts/dropRemoteTables.sh prod --i-know-what-im-doing ma_table"
}

source "$(dirname "$0")/db_sync_common.sh"

if [ $# -eq 0 ]; then
  usage
  exit 1
fi

ENV=$1
shift

if [[ $ENV != "dev" && $ENV != "prod" ]]; then
  usage
  exit 1
fi

FORCE_PROD=false
if [[ "$1" == "--i-know-what-im-doing" ]]; then
  FORCE_PROD=true
  shift
fi

TABLES=("$@")
if [ ${#TABLES[@]} -eq 0 ]; then
  usage
  exit 1
fi

if [[ $ENV == "prod" ]]; then
  if [ $FORCE_PROD = false ]; then
    echo "ERREUR: drop sur prod interdit sans --i-know-what-im-doing"
    echo "Cas extrême uniquement. Préviens l'équipe avant."
    exit 1
  fi

  echo ""
  echo "!!! ATTENTION : tu vas DROP en PROD les tables suivantes :"
  for t in "${TABLES[@]}"; do
    echo "  - $t"
  done
  echo ""
  read -p 'Tape exactement "DROP PROD" pour confirmer : ' confirm
  if [[ "$confirm" != "DROP PROD" ]]; then
    echo "Confirmation invalide, abandon."
    exit 1
  fi
fi

if [[ $ENV = "prod" ]]; then
  SCALINGO_APP=france-chaleur-urbaine
  DB_PORT=10001
else
  SCALINGO_APP=france-chaleur-urbaine-dev
  DB_PORT=10000
fi

mkdir -p /tmp/fcu
chmod 777 /tmp/fcu

get_db_credentials
setup_tunnel

echo "> Drop des tables sur $ENV..."
drop_tables postgres://$DOCKER_HOST:$DB_PORT "${TABLES[@]}"
echo "> Drop terminé sur $ENV"
