#!/bin/bash -e

source "$(dirname "$0")/../db_sync_common.sh"

echo "Lancement du script d'import BatEnr (auto data.gouv.fr) - reprise robuste + validation ZIP"

# Connexion Postgres
DOCKER_HOST="${DOCKER_HOST:-localhost}"
DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres_fcu@${DOCKER_HOST}:5432/postgres}"
pgQuery="PG:host=${DOCKER_HOST} user=postgres dbname=postgres password=postgres_fcu"

# Dossiers
BASE_DIR="${DATA_DIR:-src/data/batenr}"
DOWNLOAD_DIR="${BASE_DIR}/downloads"
EXTRACT_DIR="${BASE_DIR}/extracted"
STATE_DIR="${BASE_DIR}/state"
LOG_DIR="${BASE_DIR}/logs"

mkdir -p "$DOWNLOAD_DIR" "$EXTRACT_DIR" "$STATE_DIR" "$LOG_DIR"

# Dataset BatEnR 2025 (ID fixe)
DATASET_API="https://www.data.gouv.fr/api/1/datasets/6961023b677120c11089c0ea/"
DATASET_JSON="${STATE_DIR}/dataset.json"

echo "Récupération du dataset.json: ${DATASET_API}"
curl -fsSL -L "$DATASET_API" -o "$DATASET_JSON"

# -----------------------------
# Import config
# -----------------------------
GPKG_LAYER="${GPKG_LAYER:-construction_batenr}"

# 1 = importe toutes les colonnes du GPKG dans data.bdnb_batenr
# 0 = importe un sous-ensemble de colonnes dans public.bdnb_batenr
FULL_IMPORT="${FULL_IMPORT:-0}"

if [[ "$FULL_IMPORT" == "1" ]]; then
  TARGET_TABLE="${TARGET_TABLE:-data.bdnb_batenr}"
  OGR_SQL=""
else
  TARGET_TABLE="${TARGET_TABLE:-bdnb_batenr}"
  OGR_SQL="
SELECT
  batiment_construction_id,
  batiment_groupe_id,
  adresse,
  geom,
  gmi_nappe_200, pot_nappe, place_nappe,
  gmi_sonde_200, gis_geo_profonde,
  ac1, ac2, ac3, ac4bis,
  liste_ppa, etat_ppa
FROM ${GPKG_LAYER}
"
fi

# Réimporte même si déjà dans state (ne retélécharge pas si le ZIP/GPKG existe)
FORCE_REIMPORT="${FORCE_REIMPORT:-1}"

# 1 = supprime les lignes existantes pour ce rid avant réimport (évite les doublons)
# 0 = -append (risque de doublons)
REFRESH_MODE="${REFRESH_MODE:-0}"

# State : évite de réimporter
IMPORTED_STATE="${STATE_DIR}/imported_resources.txt"
touch "$IMPORTED_STATE"

already_imported() {
  local rid="$1"
  grep -Fqx "$rid" "$IMPORTED_STATE" 2>/dev/null
}

mark_imported() {
  local rid="$1"
  echo "$rid" >> "$IMPORTED_STATE"
}

zip_is_valid() {
  local zip_path="$1"
  unzip -tq "$zip_path" >/dev/null 2>&1
}

download_zip_atomic() {
  local url="$1"
  local out="$2"
  local tmp="${out}.part"

  # Reprend sur le .part, puis mv atomique
  curl -fL --retry 5 --retry-delay 2 -C - -o "$tmp" "$url"
  mv "$tmp" "$out"
}

# Liste les ressources gpkg.zip (id + latest + title)
mapfile -t RES_LINES < <(
  jq -r '
    .resources[]
    | select((.format // "" | ascii_downcase) == "gpkg.zip")
    | select(.latest != null and .id != null)
    | "\(.id)\t\(.latest)\t\(.title // .id)"
  ' "$DATASET_JSON"
)

if [[ "${#RES_LINES[@]}" -eq 0 ]]; then
  echo "Aucune ressource gpkg.zip trouvée (format==gpkg.zip)."
  exit 0
fi

echo "Ressources gpkg.zip trouvées: ${#RES_LINES[@]}"

# Nombre max de téléchargements simultanés
MAX_PARALLEL="${MAX_PARALLEL:-8}"

# -----------------------------
# Fonctions
# -----------------------------

download_and_extract() {
  local rid="$1"
  local latest_url="$2"
  local title="$3"
  local zip_path="${DOWNLOAD_DIR}/${rid}.gpkg.zip"
  local extract_subdir="${EXTRACT_DIR}/${rid}"
  mkdir -p "$extract_subdir"

  # Télécharge si nécessaire
  if [[ -f "$zip_path" && -s "$zip_path" ]]; then
    if zip_is_valid "$zip_path"; then
      echo "[$rid] ZIP OK (cache)"
    else
      echo "[$rid] ZIP corrompu -> retéléchargement"
      rm -f "$zip_path" "${zip_path}.part"
      download_zip_atomic "$latest_url" "$zip_path"
      zip_is_valid "$zip_path" || { echo "[$rid] ERREUR: ZIP invalide après re-download"; return 1; }
    fi
  else
    echo "[$rid] Téléchargement: $title"
    rm -f "${zip_path}.part" || true
    download_zip_atomic "$latest_url" "$zip_path"
    zip_is_valid "$zip_path" || { echo "[$rid] ERREUR: ZIP invalide après download"; return 1; }
    echo "[$rid] ZIP OK"
  fi

  # Extrait le GPKG
  if ls -1 "$extract_subdir"/*.gpkg >/dev/null 2>&1; then
    echo "[$rid] GPKG déjà extrait"
  else
    echo "[$rid] Décompression"
    unzip -o "$zip_path" -d "$extract_subdir" >/dev/null
    echo "[$rid] Extraction OK"
  fi
}

import_resource() {
  local rid="$1"
  local title="$2"
  local extract_subdir="${EXTRACT_DIR}/${rid}"

  gpkg_count="$(ls -1 "$extract_subdir"/*.gpkg 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$gpkg_count" != "1" ]]; then
    echo "Erreur: attendu 1 fichier .gpkg, trouvé $gpkg_count dans $extract_subdir"
    ls -lah "$extract_subdir" || true
    return 1
  fi

  gpkg_path="$(ls -1 "$extract_subdir"/*.gpkg | head -n1)"
  echo
  echo "=== Import: $title"
  echo "GPKG: $gpkg_path"

  if [[ "$REFRESH_MODE" == "1" ]]; then
    echo "REFRESH_MODE=1 -> nettoyage BDD avant réimport"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "DELETE FROM ${TARGET_TABLE} WHERE batiment_groupe_id LIKE '${rid}:%';"
  fi

  log_file="${LOG_DIR}/${rid}.log"

  ogr2ogr_args=(
    -f "PostgreSQL" "$pgQuery"
    "$gpkg_path"
    -nln "$TARGET_TABLE" -append
    --config PG_USE_COPY YES
    --config GDAL_NUM_THREADS ALL_CPUS
  )
  if [[ -n "$OGR_SQL" ]]; then
    ogr2ogr_args+=(-sql "$OGR_SQL")
  else
    ogr2ogr_args+=("$GPKG_LAYER")
  fi

  ogr2ogr "${ogr2ogr_args[@]}" 2>&1 | tee "$log_file"

  mark_imported "$rid"
  echo "OK: import terminé pour $rid"
}

# Exporte les fonctions et variables pour les sous-shells
export -f download_and_extract download_zip_atomic zip_is_valid
export DOWNLOAD_DIR EXTRACT_DIR

# -----------------------------
# Pipeline: download parallèle -> import séquentiel via FIFO
# -----------------------------
if [[ "$FORCE_REIMPORT" == "1" ]]; then
  echo "FORCE_REIMPORT=1 -> TRUNCATE ${TARGET_TABLE}"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "TRUNCATE ${TARGET_TABLE};"
  # Réinitialise le state
  : > "$IMPORTED_STATE"
fi

echo
echo "=== Téléchargement (max $MAX_PARALLEL en parallèle) + import séquentiel en pipeline"

IMPORT_FIFO="${BASE_DIR}/import_fifo"
rm -f "$IMPORT_FIFO"
mkfifo "$IMPORT_FIFO"

cleanup() {
  trap - EXIT INT TERM  # évite la récursion
  # Tue tout le process group (downloads, curl, ogr2ogr, consumer...)
  kill -TERM 0 2>/dev/null || true
  rm -f "$IMPORT_FIFO"
}
trap cleanup INT TERM
trap 'rm -f "$IMPORT_FIFO"' EXIT

FAIL_FLAG="${STATE_DIR}/download_failed"
rm -f "$FAIL_FLAG"

# Le consumer lit le FIFO et importe séquentiellement (1 ogr2ogr à la fois)
# Il est lancé AVANT l'ouverture du fd 3 pour ne pas hériter du write-end
(
  while IFS=$'\t' read -r rid _ title; do
    import_resource "$rid" "$title" || { echo "ERREUR: import échoué pour $rid"; exit 1; }
  done < "$IMPORT_FIFO"
) &
CONSUMER_PID=$!

# Ouvre le FIFO en écriture (empêche un EOF prématuré côté lecteur)
exec 3>"$IMPORT_FIFO"

DOWNLOAD_PIDS=()
NB_TO_IMPORT=0

for line in "${RES_LINES[@]}"; do
  rid="$(cut -f1 <<<"$line")"
  latest_url="$(cut -f2 <<<"$line")"
  title="$(cut -f3- <<<"$line")"

  if already_imported "$rid" && [[ "$FORCE_REIMPORT" != "1" ]]; then
    echo "Déjà importée (state): $rid -> skip"
    continue
  fi

  NB_TO_IMPORT=$((NB_TO_IMPORT + 1))

  # Lance le download en arrière-plan et envoie la ligne au FIFO si succès
  (
    if download_and_extract "$rid" "$latest_url" "$title"; then
      printf '%s\t%s\t%s\n' "$rid" "$latest_url" "$title" >&3
    else
      touch "$FAIL_FLAG"
    fi
  ) &
  DOWNLOAD_PIDS+=($!)

  # Limite le parallélisme des downloads
  if [[ "${#DOWNLOAD_PIDS[@]}" -ge "$MAX_PARALLEL" ]]; then
    wait "${DOWNLOAD_PIDS[0]}" || true
    DOWNLOAD_PIDS=("${DOWNLOAD_PIDS[@]:1}")
  fi
done

# Attend tous les téléchargements
for pid in "${DOWNLOAD_PIDS[@]}"; do
  wait "$pid" || true
done

# Ferme le write-end -> le consumer reçoit EOF et termine
exec 3>&-

# Attend que le consumer finisse tous les imports
wait "$CONSUMER_PID" || { echo "ERREUR: l'import a échoué"; exit 1; }

if [[ -f "$FAIL_FLAG" ]]; then
  echo "ERREUR: un ou plusieurs téléchargements ont échoué"
  rm -f "$FAIL_FLAG"
  exit 1
fi

echo
echo "Import BatEnR terminé ($NB_TO_IMPORT ressource(s) traitée(s))."
