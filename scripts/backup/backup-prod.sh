#!/usr/bin/env bash
# Sauvegarde hors Scalingo de la production FCU, chiffrée avec age vers la clé publique configurée (la clé secrète ne sert
# qu'au déchiffrement : scripts/backup/decrypt-backup.sh). Contenu d'un run : dernière sauvegarde Scalingo de la base,
# métadonnées Scalingo (variables d'env, déploiements…), tous les docs Grist de l'organisation, bundle git du dépôt.
# La base est téléchargée par l'URL directe de l'API Scalingo (même débit que `scalingo backups-download`, mesuré
# vers 60 Mo/s dans les deux cas) : l'API donne la liste des sauvegardes en JSON et ne dépend pas d'une session CLI.
# Configuration : scripts/backup/.env (voir .env.example).
# Usage : pnpm backup:prod [dossier-de-run-existant]  (reprise : les fichiers déjà présents ne sont pas refaits)
# Ne pas modifier ce fichier pendant qu'un run tourne : bash le lit au fil de l'exécution.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd "$script_dir/../.." && pwd)"

# shellcheck disable=SC1091
[[ -f "$script_dir/.env" ]] && source "$script_dir/.env"

: "${FCU_BACKUP_DIR:?FCU_BACKUP_DIR manquant (dossier cible, ex: le partage NAS monté)}"
: "${FCU_BACKUP_AGE_PUBLIC_KEY:?FCU_BACKUP_AGE_PUBLIC_KEY manquant (clé publique age, générée par age-keygen)}"
: "${SCALINGO_API_TOKEN:?SCALINGO_API_TOKEN manquant (dashboard Scalingo > Profile > API tokens)}"
scalingo_app="${FCU_BACKUP_SCALINGO_APP:-france-chaleur-urbaine}"
scalingo_region="${FCU_BACKUP_SCALINGO_REGION:-osc-fr1}"
grist_url="${FCU_BACKUP_GRIST_URL:-https://grist.numerique.gouv.fr}"
grist_org="${FCU_BACKUP_GRIST_ORG:-fcu}"
grist_workspaces="${FCU_BACKUP_GRIST_WORKSPACES:-}"
git_bundle="${FCU_BACKUP_GIT_BUNDLE:-true}"

log() { printf '\e[1;34m==>\e[0m %s\n' "$*" >&2; }
die() { printf '\e[1;31mErreur :\e[0m %s\n' "$*" >&2; exit 1; }

for tool in scalingo age curl git jq tar sha256sum; do
  command -v "$tool" >/dev/null || die "outil manquant : $tool"
done

[[ -d "$FCU_BACKUP_DIR" && -w "$FCU_BACKUP_DIR" ]] || die "dossier cible absent ou non inscriptible (NAS monté ?) : $FCU_BACKUP_DIR"
export SCALINGO_API_TOKEN # la CLI l'utilise aussi, pas besoin de scalingo login
scalingo self >/dev/null 2>&1 || die "jeton Scalingo refusé (SCALINGO_API_TOKEN)"

# Chiffre stdin vers $1 (.part puis renommage), écrit le sha256 du fichier chiffré dans $1.sha256.
# $2 = progress : affiche en continu le volume écrit et le débit (pour les gros flux).
# L'écriture passe par dd en blocs de 4 Mo : sur un partage monté via gvfs/fuse, chaque écriture est un aller-retour
# SMB et les petits blocs sortis d'un pipe plafonnent vers 1 Mo/s (mesuré : 0,9 Mo/s contre 21 Mo/s avec dd).
encrypt_to() {
  local dest="$1" dd_status="${2:-none}" fifo sha_pid
  fifo="$(mktemp -u -p "$tmp_dir")"
  mkfifo "$fifo"
  sha256sum <"$fifo" | cut -d' ' -f1 >"$dest.sha256" &
  sha_pid=$!
  age --recipient "$FCU_BACKUP_AGE_PUBLIC_KEY" | tee "$fifo" | dd bs=4M iflag=fullblock status="$dd_status" of="$dest.part"
  wait "$sha_pid"
  rm -f "$fifo"
  mv "$dest.part" "$dest"
  log "écrit $(basename "$dest") ($(stat -c %s "$dest" | numfmt --to=iec-i --suffix=o))"
}

# Un fichier chiffré n'est renommé (sans .part) qu'une fois complet : présent avec son sha256 = rien à refaire
already_done() { [[ -f "$1" && -f "$1.sha256" ]] && log "déjà présent : $(basename "$1")"; }

strip_ansi() { sed 's/\x1b\[[0-9;]*m//g'; }
# Les tableaux de la CLI Scalingo n'ont pas de sortie JSON : on extrait une cellule (séparateur │) de la première ligne
# qui matche, sans exit anticipé (il enverrait SIGPIPE au producteur et déclencherait pipefail)
cell() { awk -F'│' -v col="$1" -v pattern="$2" '!found && $0 ~ pattern { gsub(/^ +| +$/, "", $col); print $col; found = 1 }'; }
safe_name() { iconv -f UTF-8 -t ASCII//TRANSLIT | tr -c 'A-Za-z0-9._-' '_' | tr -s '_' | sed 's/_*$//'; }

# --- Dernière sauvegarde Scalingo (API bases de données : jeton d'API → bearer → jeton d'add-on) ---
addon_id="$(scalingo --app "$scalingo_app" addons 2>/dev/null | strip_ansi | cell 3 PostgreSQL)"
[[ -n "$addon_id" ]] || die "add-on PostgreSQL introuvable pour $scalingo_app"
bearer="$(curl --fail --silent --show-error --user ":$SCALINGO_API_TOKEN" --request POST https://auth.scalingo.com/v1/tokens/exchange | jq -r '.token // empty')"
[[ -n "$bearer" ]] || die "échange du jeton Scalingo échoué"
addon_token="$(curl --fail --silent --show-error --header "Authorization: Bearer $bearer" --request POST \
  "https://api.$scalingo_region.scalingo.com/v1/apps/$scalingo_app/addons/$addon_id/token" | jq -r '.addon.token // empty')"
[[ -n "$addon_token" ]] || die "jeton d'add-on Scalingo introuvable"
db_api="https://db-api.$scalingo_region.scalingo.com/api/databases/$addon_id"
backups_json="$(curl --fail --silent --show-error --header "Authorization: Bearer $addon_token" "$db_api/backups")"
last_backup="$(jq -c '[.database_backups[] | select(.status == "done")] | sort_by(.created_at) | last // empty' <<<"$backups_json")"
[[ -n "$last_backup" ]] || die "aucune sauvegarde Scalingo en statut done"
backup_id="$(jq -r .id <<<"$last_backup")"
backup_date="$(jq -r .created_at <<<"$last_backup")"
backup_size="$(jq -r .size <<<"$last_backup" | numfmt --to=iec-i --suffix=o)"
deployed_ref="$(scalingo --app "$scalingo_app" deployments 2>/dev/null | strip_ansi | cell 6 success)"

if [[ $# -ge 1 ]]; then
  run_dir="$1"
  [[ -d "$run_dir" ]] || die "dossier de reprise introuvable : $run_dir"
  log "reprise dans $run_dir"
else
  run_dir="$FCU_BACKUP_DIR/$(date +%Y-%m-%d_%H%M)"
  mkdir -p "$run_dir"
  log "sauvegarde dans $run_dir"
fi
log "base : sauvegarde Scalingo $backup_id du $backup_date ($backup_size), déploiement $deployed_ref"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir" "$run_dir"/*.part' EXIT

# --- Métadonnées Scalingo (variables d'env incluses : secrets, donc chiffrées) ---
log "métadonnées Scalingo"
for cmd in env deployments apps-info scale domains addons; do
  scalingo --app "$scalingo_app" "$cmd" 2>/dev/null | strip_ansi >"$tmp_dir/$cmd.txt"
done
jq . <<<"$backups_json" >"$tmp_dir/backups.json"
tar -C "$tmp_dir" -cf - . | encrypt_to "$run_dir/scalingo-meta.tar.age"
rm -f "$tmp_dir"/*.txt

# --- Base de données : flux direct URL signée → age → cible, aucun clair sur disque ---
db_file="$run_dir/db-$backup_id.tar.gz.age"
if ! already_done "$db_file"; then
  download_url="$(curl --fail --silent --show-error --header "Authorization: Bearer $addon_token" "$db_api/backups/$backup_id/archive" | jq -r '.download_url // empty')"
  [[ -n "$download_url" ]] || die "URL de téléchargement de la sauvegarde introuvable"
  log "téléchargement de la base ($backup_size attendus, volume chiffré équivalent)"
  curl --fail --silent --show-error "$download_url" | encrypt_to "$db_file" progress
fi

# --- Grist : fichier .grist complet (SQLite, réimportable tel quel) de chaque doc des workspaces de l'organisation ---
grist_docs=()
if [[ -n "${GRIST_API_KEY:-}" ]]; then
  grist_auth=(--header "Authorization: Bearer $GRIST_API_KEY")
  while IFS=$'\t' read -r workspace doc_id doc_name; do
    [[ -z "$grist_workspaces" || " $grist_workspaces " == *" $workspace "* ]] || continue
    grist_docs+=("$workspace / $doc_name ($doc_id)")
    grist_file="$run_dir/grist-$(safe_name <<<"$workspace")-$(safe_name <<<"$doc_name")-$doc_id.grist.age"
    already_done "$grist_file" && continue
    log "doc Grist « $workspace / $doc_name »"
    curl --fail --silent --show-error "${grist_auth[@]}" "$grist_url/api/docs/$doc_id/download?nohistory=true" \
      | encrypt_to "$grist_file"
  done < <(curl --fail --silent --show-error "${grist_auth[@]}" "$grist_url/api/orgs/$grist_org/workspaces" \
    | jq -r '.[] | .name as $ws | .docs[] | [$ws, .id, .name] | @tsv')
else
  log "GRIST_API_KEY absente : docs Grist ignorés"
fi

# --- Dépôt git (toutes les branches et tags) ---
if [[ "$git_bundle" == "true" ]] && ! already_done "$run_dir/repo.bundle.age"; then
  log "bundle git du dépôt"
  git -C "$repo_dir" bundle create - --all 2>/dev/null | encrypt_to "$run_dir/repo.bundle.age"
fi

# --- Manifeste en clair : quoi, quand, et empreintes des fichiers chiffrés ---
files_json="$(
  for sha_file in "$run_dir"/*.sha256; do
    file="${sha_file%.sha256}"
    jq -n --arg name "$(basename "$file")" --arg sha256 "$(cat "$sha_file")" --argjson bytes "$(stat -c %s "$file")" \
      '{name: $name, sha256: $sha256, bytes: $bytes}'
  done | jq -s .
)"
jq -n \
  --arg created_at "$(date -Iseconds)" --arg app "$scalingo_app" --arg deployed_ref "$deployed_ref" \
  --arg backup_id "$backup_id" --arg backup_date "$backup_date" --arg backup_size "$backup_size" \
  --arg public_key "$FCU_BACKUP_AGE_PUBLIC_KEY" --argjson files "$files_json" \
  --args '{created_at: $created_at, scalingo_app: $app, deployed_git_ref: $deployed_ref,
    scalingo_backup: {id: $backup_id, created_at: $backup_date, size: $backup_size},
    grist_docs: $ARGS.positional, age_public_key: $public_key, files: $files}' "${grist_docs[@]}" \
  >"$run_dir/manifest.json"

log "terminé : $run_dir"
