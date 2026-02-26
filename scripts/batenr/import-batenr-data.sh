#!/bin/bash -e

source "$(dirname "$0")/../db_sync_common.sh"

echo "Lancement du script d'import BatEnr (auto data.gouv.fr) - reprise robuste + validation ZIP"

# Connexion Postgres pour ogr2ogr
DOCKER_HOST="${DOCKER_HOST:-localhost}"
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
TARGET_TABLE="${TARGET_TABLE:-bdnb_batenr}"
GPKG_LAYER="${GPKG_LAYER:-construction_batenr}"

# Réimport même si déjà dans state (ne redownload pas si le ZIP/GPKG existe)
FORCE_REIMPORT="${FORCE_REIMPORT:-1}"

# Si 1: supprime les lignes existantes pour ce rid avant réimport (évite les doublons)
# Si 0: -append (risque de doublons)
REFRESH_MODE="${REFRESH_MODE:-0}"

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

# State (évite de réimporter)
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

  # Reprise sur le .part, puis mv atomique
  curl -fL --retry 5 --retry-delay 2 -C - -o "$tmp" "$url"
  mv "$tmp" "$out"
}

# Lister ressources gpkg.zip (id + latest + title)
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

# -----------------------------
# Boucle download -> unzip -> import
# -----------------------------
for line in "${RES_LINES[@]}"; do
  rid="$(cut -f1 <<<"$line")"
  latest_url="$(cut -f2 <<<"$line")"
  title="$(cut -f3- <<<"$line")"

  echo
  echo "=== Ressource: $title"
  echo "ID: $rid"
  echo "LATEST: $latest_url"

  if already_imported "$rid"; then
    if [[ "$FORCE_REIMPORT" == "1" ]]; then
      echo "Déjà importée (state) mais FORCE_REIMPORT=1 -> réimport sans retéléchargement"
    else
      echo "Déjà importée (state): $rid -> skip"
      continue
    fi
  fi

  zip_path="${DOWNLOAD_DIR}/${rid}.gpkg.zip"
  extract_subdir="${EXTRACT_DIR}/${rid}"
  mkdir -p "$extract_subdir"

  # Si déjà importée et force reimport: on ne télécharge pas, on réutilise le ZIP existant
  if already_imported "$rid" && [[ "$FORCE_REIMPORT" == "1" ]]; then
    if [[ ! -f "$zip_path" || ! -s "$zip_path" ]]; then
      echo "Erreur: FORCE_REIMPORT=1 mais ZIP local absent: $zip_path"
      echo "-> soit mettre FORCE_REIMPORT=0, soit supprimer la ligne du state, soit laisser télécharger."
      exit 1
    fi
  fi

  # 1) S'assurer d'avoir un ZIP valide (sinon purge + redownload)
  if [[ -f "$zip_path" && -s "$zip_path" ]]; then
    if zip_is_valid "$zip_path"; then
      echo "ZIP OK: $zip_path"
    else
      echo "ZIP invalide/corrompu: $zip_path -> suppression + retéléchargement"
      rm -f "$zip_path" "${zip_path}.part"
      download_zip_atomic "$latest_url" "$zip_path"
      zip_is_valid "$zip_path" || { echo "Erreur: ZIP toujours invalide après re-download: $zip_path"; exit 1; }
      echo "ZIP re-téléchargé OK: $zip_path"
    fi
  else
    echo "Téléchargement -> $zip_path"
    rm -f "${zip_path}.part" || true
    download_zip_atomic "$latest_url" "$zip_path"
    zip_is_valid "$zip_path" || { echo "Erreur: ZIP invalide après download: $zip_path"; exit 1; }
    echo "ZIP téléchargé OK: $zip_path"
  fi

  # 2) Extraction (si pas déjà de .gpkg)
  gpkg_existing="$(ls -1 "$extract_subdir"/*.gpkg 2>/dev/null | head -n1 || true)"
  if [[ -n "$gpkg_existing" ]]; then
    echo "GPKG déjà extrait: $gpkg_existing"
  else
    echo "Décompression -> $extract_subdir"
    unzip -o "$zip_path" -d "$extract_subdir" >/dev/null
  fi

  # 3) Trouver le vrai fichier .gpkg
  gpkg_count="$(ls -1 "$extract_subdir"/*.gpkg 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$gpkg_count" != "1" ]]; then
    echo "Erreur: attendu 1 fichier .gpkg, trouvé $gpkg_count dans $extract_subdir"
    ls -lah "$extract_subdir" || true
    exit 1
  fi

  gpkg_path="$(ls -1 "$extract_subdir"/*.gpkg | head -n1)"
  echo "GPKG: $gpkg_path"

  if [[ "$REFRESH_MODE" == "1" ]]; then
    echo "REFRESH_MODE=1 -> nettoyage BDD avant réimport"
    psql -v ON_ERROR_STOP=1 -c "DELETE FROM ${TARGET_TABLE} WHERE batiment_groupe_id LIKE '${rid}:%';"
  fi

  # 4) Import ogr2ogr
  echo "Import ogr2ogr -> ${TARGET_TABLE}"
  log_file="${LOG_DIR}/${rid}.log"

  ogr2ogr -f "PostgreSQL" "$pgQuery" \
    "$gpkg_path" \
    -nln "$TARGET_TABLE" -append \
    -sql "$OGR_SQL" \
    --config PG_USE_COPY YES \
    --config GDAL_NUM_THREADS ALL_CPUS \
    2>&1 | tee "$log_file"

  # 5) Marquer importé seulement après succès
  mark_imported "$rid"
  echo "OK: import terminé pour $rid"
done

echo
echo "Import BatEnR terminé."