#!/usr/bin/env bash
# Déchiffre un dossier produit par backup-prod.sh : vérifie les sha256 puis déchiffre chaque fichier .age avec la clé
# secrète age (demandée au prompt, ou lue dans le fichier FCU_BACKUP_AGE_IDENTITY_FILE), sans jamais l'écrire sur disque.
# Usage : pnpm backup:decrypt <dossier-sauvegarde> <dossier-destination>
set -euo pipefail

log() { printf '\e[1;34m==>\e[0m %s\n' "$*" >&2; }
die() { printf '\e[1;31mErreur :\e[0m %s\n' "$*" >&2; exit 1; }

[[ $# -eq 2 ]] || die "usage : $0 <dossier-sauvegarde> <dossier-destination>"
src_dir="$1"
dest_dir="$2"
[[ -d "$src_dir" ]] || die "dossier introuvable : $src_dir"
compgen -G "$src_dir/*.age" >/dev/null || die "aucun fichier .age dans $src_dir"
for tool in age sha256sum; do
  command -v "$tool" >/dev/null || die "outil manquant : $tool"
done

if [[ -n "${FCU_BACKUP_AGE_IDENTITY_FILE:-}" ]]; then
  [[ -f "$FCU_BACKUP_AGE_IDENTITY_FILE" ]] || die "fichier de clé introuvable : $FCU_BACKUP_AGE_IDENTITY_FILE"
  decrypt() { age --decrypt --identity "$FCU_BACKUP_AGE_IDENTITY_FILE" "$@"; }
else
  read -rs -p "Clé secrète age (AGE-SECRET-KEY-1…) : " identity; echo >&2
  [[ "$identity" == AGE-SECRET-KEY-1* ]] || die "clé secrète age invalide"
  # la clé passe par un pipe (process substitution), jamais par un fichier ni par la ligne de commande
  decrypt() { age --decrypt --identity <(printf '%s\n' "$identity") "$@"; }
fi

mkdir -p "$dest_dir"
for file in "$src_dir"/*.age; do
  name="$(basename "$file")"
  if [[ -f "$file.sha256" ]]; then
    [[ "$(sha256sum "$file" | cut -d' ' -f1)" == "$(cat "$file.sha256")" ]] || die "sha256 invalide, fichier corrompu : $name"
  fi
  decrypt --output "$dest_dir/${name%.age}" "$file"
  log "déchiffré ${name%.age}"
done
[[ -f "$src_dir/manifest.json" ]] && cp "$src_dir/manifest.json" "$dest_dir/"
log "terminé : $dest_dir"
