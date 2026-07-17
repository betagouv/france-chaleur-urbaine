#!/bin/bash -e

source "$(dirname "$0")/../db_sync_common.sh"

echo "Lancement du script d'import BatEnr (auto data.gouv.fr) - reprise robuste + validation ZIP"

# Connexion Postgres pour ogr2ogr et psql
BATENR_DB_HOST="${BATENR_DB_HOST:-localhost}"
BATENR_DB_PORT="${BATENR_DB_PORT:-5432}"
BATENR_DB_USER="${BATENR_DB_USER:-postgres}"
BATENR_DB_NAME="${BATENR_DB_NAME:-postgres}"
BATENR_DB_PASSWORD="${BATENR_DB_PASSWORD:-}"

if [[ -z "${BATENR_DATABASE_URL:-}" ]]; then
  if [[ -n "$BATENR_DB_PASSWORD" ]]; then
    BATENR_DATABASE_URL="postgresql://${BATENR_DB_USER}:${BATENR_DB_PASSWORD}@${BATENR_DB_HOST}:${BATENR_DB_PORT}/${BATENR_DB_NAME}"
  else
    BATENR_DATABASE_URL="postgresql://${BATENR_DB_USER}@${BATENR_DB_HOST}:${BATENR_DB_PORT}/${BATENR_DB_NAME}"
  fi
fi

pgQuery="PG:host=${BATENR_DB_HOST} port=${BATENR_DB_PORT} user=${BATENR_DB_USER} dbname=${BATENR_DB_NAME}"
if [[ -n "$BATENR_DB_PASSWORD" ]]; then
  pgQuery="${pgQuery} password=${BATENR_DB_PASSWORD}"
fi

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
DEPARTEMENT_FILTER="${DEPARTEMENT_FILTER:-}"

# Réimport même si déjà dans state (ne redownload pas si le ZIP/GPKG existe)
FORCE_REIMPORT="${FORCE_REIMPORT:-0}"

# Si 1: vide la table cible avant l'import complet.
# Incompatible avec DEPARTEMENT_FILTER pour éviter d'effacer les autres départements.
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
  liste_ppa, etat_ppa,
  categorie_majoritaire, propri_uni, classe_bilan_dpe, couv_st_ecs_2025, couv_sondes_200_2025, prod_st_mwh_an,
  type_installation_chauffage, type_energie_chauffage, type_installation_ecs, type_energie_ecs
FROM ${GPKG_LAYER}
"

validate_identifier() {
  local identifier="$1"
  local label="$2"

  if [[ ! "$identifier" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
    echo "Erreur: ${label} invalide: ${identifier}"
    exit 1
  fi
}

validate_identifier "$TARGET_TABLE" "TARGET_TABLE"
validate_identifier "$GPKG_LAYER" "GPKG_LAYER"

# State (évite de réimporter)
IMPORTED_STATE="${STATE_DIR}/imported_resources.txt"
touch "$IMPORTED_STATE"

already_imported() {
  local rid="$1"
  grep -Fqx "$rid" "$IMPORTED_STATE" 2>/dev/null
}

mark_imported() {
  local rid="$1"
  already_imported "$rid" || echo "$rid" >> "$IMPORTED_STATE"
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

run_psql() {
  psql "$BATENR_DATABASE_URL" "$@"
}

drop_table_if_exists() {
  local table_name="$1"

  run_psql --set=ON_ERROR_STOP=1 --set=table_name="$table_name" <<'SQL'
DROP TABLE IF EXISTS :"table_name";
SQL
}

truncate_target_table() {
  run_psql --set=ON_ERROR_STOP=1 --set=target_table="$TARGET_TABLE" <<'SQL'
TRUNCATE TABLE :"target_table";
SQL
}

ensure_staging_has_no_null_ids() {
  local staging_table="$1"
  local null_count

  null_count="$(run_psql --set=ON_ERROR_STOP=1 --set=staging_table="$staging_table" -At <<'SQL'
SELECT COUNT(*) FROM :"staging_table" WHERE batiment_construction_id IS NULL;
SQL
)"

  if [[ "$null_count" != "0" ]]; then
    echo "Erreur: ${staging_table} contient ${null_count} ligne(s) sans batiment_construction_id."
    exit 1
  fi
}

merge_staging_table() {
  local staging_table="$1"

  run_psql --set=ON_ERROR_STOP=1 --set=target_table="$TARGET_TABLE" --set=staging_table="$staging_table" <<'SQL'
BEGIN;

DELETE FROM :"staging_table" AS duplicate
USING :"staging_table" AS kept
WHERE duplicate.batiment_construction_id = kept.batiment_construction_id
  AND duplicate.ctid > kept.ctid;

INSERT INTO :"target_table" (
  batiment_construction_id,
  batiment_groupe_id,
  adresse,
  geom,
  gmi_nappe_200,
  pot_nappe,
  place_nappe,
  gmi_sonde_200,
  gis_geo_profonde,
  ac1,
  ac2,
  ac3,
  ac4bis,
  liste_ppa,
  etat_ppa,
  categorie_majoritaire,
  propri_uni,
  classe_bilan_dpe,
  couv_st_ecs_2025,
  couv_sondes_200_2025,
  prod_st_mwh_an,
  type_installation_chauffage,
  type_energie_chauffage,
  type_installation_ecs,
  type_energie_ecs
)
SELECT
  batiment_construction_id,
  batiment_groupe_id,
  adresse,
  geom,
  gmi_nappe_200,
  pot_nappe,
  place_nappe,
  gmi_sonde_200,
  gis_geo_profonde,
  ac1,
  ac2,
  ac3,
  ac4bis,
  liste_ppa,
  etat_ppa,
  categorie_majoritaire,
  propri_uni,
  classe_bilan_dpe,
  couv_st_ecs_2025,
  couv_sondes_200_2025,
  prod_st_mwh_an,
  type_installation_chauffage,
  type_energie_chauffage,
  type_installation_ecs,
  type_energie_ecs
FROM :"staging_table"
ON CONFLICT (batiment_construction_id) WHERE batiment_construction_id IS NOT NULL DO UPDATE SET
  batiment_groupe_id = EXCLUDED.batiment_groupe_id,
  adresse = EXCLUDED.adresse,
  geom = EXCLUDED.geom,
  gmi_nappe_200 = EXCLUDED.gmi_nappe_200,
  pot_nappe = EXCLUDED.pot_nappe,
  place_nappe = EXCLUDED.place_nappe,
  gmi_sonde_200 = EXCLUDED.gmi_sonde_200,
  gis_geo_profonde = EXCLUDED.gis_geo_profonde,
  ac1 = EXCLUDED.ac1,
  ac2 = EXCLUDED.ac2,
  ac3 = EXCLUDED.ac3,
  ac4bis = EXCLUDED.ac4bis,
  liste_ppa = EXCLUDED.liste_ppa,
  etat_ppa = EXCLUDED.etat_ppa,
  categorie_majoritaire = EXCLUDED.categorie_majoritaire,
  propri_uni = EXCLUDED.propri_uni,
  classe_bilan_dpe = EXCLUDED.classe_bilan_dpe,
  couv_st_ecs_2025 = EXCLUDED.couv_st_ecs_2025,
  couv_sondes_200_2025 = EXCLUDED.couv_sondes_200_2025,
  prod_st_mwh_an = EXCLUDED.prod_st_mwh_an,
  type_installation_chauffage = EXCLUDED.type_installation_chauffage,
  type_energie_chauffage = EXCLUDED.type_energie_chauffage,
  type_installation_ecs = EXCLUDED.type_installation_ecs,
  type_energie_ecs = EXCLUDED.type_energie_ecs;

COMMIT;
SQL
}

# Lister ressources gpkg.zip (id + latest + title)
mapfile -t RES_LINES < <(
  DEPARTEMENT_FILTER="$DEPARTEMENT_FILTER" jq -r '
    def matches_departement_filter($filter):
      ($filter == "")
      or ((.title // "") | startswith("d" + $filter + "_"));

    .resources[]
    | select((.format // "" | ascii_downcase) == "gpkg.zip")
    | select(.latest != null and .id != null)
    | select(matches_departement_filter(env.DEPARTEMENT_FILTER))
    | "\(.id)\t\(.latest)\t\(.title // .id)"
  ' "$DATASET_JSON"
)

if [[ "${#RES_LINES[@]}" -eq 0 ]]; then
  echo "Aucune ressource gpkg.zip trouvée (format==gpkg.zip)."
  exit 0
fi

if [[ -n "$DEPARTEMENT_FILTER" ]]; then
  echo "Filtre département: ${DEPARTEMENT_FILTER}"
fi

echo "Ressources gpkg.zip trouvées: ${#RES_LINES[@]}"

if [[ "$REFRESH_MODE" == "1" ]]; then
  if [[ -n "$DEPARTEMENT_FILTER" ]]; then
    echo "Erreur: REFRESH_MODE=1 est incompatible avec DEPARTEMENT_FILTER."
    exit 1
  fi

  echo "REFRESH_MODE=1 -> vidage complet de ${TARGET_TABLE} avant import"
  truncate_target_table
fi

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
    if [[ "$FORCE_REIMPORT" == "1" || "$REFRESH_MODE" == "1" ]]; then
      echo "Déjà importée (state) mais réimport demandé -> réimport sans retéléchargement"
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

  # 4) Import ogr2ogr dans une table de staging, puis fusion idempotente
  staging_table="${TARGET_TABLE}_staging_${rid//-/}"
  validate_identifier "$staging_table" "staging_table"

  echo "Import ogr2ogr -> ${staging_table}"
  log_file="${LOG_DIR}/${rid}.log"
  drop_table_if_exists "$staging_table"

  ogr2ogr -f "PostgreSQL" "$pgQuery" \
    "$gpkg_path" \
    -nln "$staging_table" -overwrite \
    -sql "$OGR_SQL" \
    --config PG_USE_COPY YES \
    --config GDAL_NUM_THREADS ALL_CPUS \
    2>&1 | tee "$log_file"

  echo "Fusion staging -> ${TARGET_TABLE}"
  ensure_staging_has_no_null_ids "$staging_table"
  merge_staging_table "$staging_table"
  drop_table_if_exists "$staging_table"

  # 5) Marquer importé seulement après succès
  mark_imported "$rid"
  echo "OK: import terminé pour $rid"
done

echo
echo "Import BatEnR terminé."
