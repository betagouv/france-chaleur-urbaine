#!/bin/bash
set -euo pipefail

# Swaps the @betagouv/france-chaleur-urbaine-publicodes npm dependency for a
# development branch of the publicodes repository, built from source.
# Runs at Scalingo build time (scalingo-postbuild) and in GitHub Actions CI,
# before `pnpm build`.
#
# Branch resolution:
# 1. PUBLICODES_BRANCH env var if set (the build fails if the branch does not exist)
# 2. The current fcu branch (GITHUB_REF_NAME in GitHub Actions, the PR branch
#    resolved from the app name via the GitHub API on review apps), if a branch
#    with the same name exists on the publicodes repository (dev/main/tags excluded)
# Otherwise the script is a no-op and the published npm version is kept.

PUBLICODES_REPO_URL="https://github.com/betagouv/france-chaleur-urbaine-publicodes.git"
PUBLICODES_DIR="france-chaleur-urbaine-publicodes"

publicodes_branch_exists() {
  git ls-remote --exit-code --heads "$PUBLICODES_REPO_URL" "$1" > /dev/null
}

branch="${PUBLICODES_BRANCH:-}"

if [ -n "$branch" ]; then
  if ! publicodes_branch_exists "$branch"; then
    echo "PUBLICODES_BRANCH=$branch does not exist on $PUBLICODES_REPO_URL" >&2
    exit 1
  fi
else
  candidate=""
  if [ "${GITHUB_ACTIONS:-}" = "true" ] && [ "${GITHUB_REF_TYPE:-}" = "branch" ]; then
    candidate="${GITHUB_REF_NAME:-}"
  elif [ "${IS_REVIEW_APP:-}" = "true" ] && [[ "${APP:-}" =~ -pr([0-9]+)$ ]]; then
    pr_number="${BASH_REMATCH[1]}"
    candidate=$(curl --fail --silent "https://api.github.com/repos/betagouv/france-chaleur-urbaine/pulls/$pr_number" \
      | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).head.ref" || true)
    if [ -z "$candidate" ]; then
      echo "Could not resolve the PR branch from the GitHub API, keeping the published publicodes version"
      exit 0
    fi
  fi
  case "$candidate" in
    "" | dev | main) candidate="" ;;
  esac
  if [ -n "$candidate" ] && publicodes_branch_exists "$candidate"; then
    branch="$candidate"
  fi
fi

if [ -z "$branch" ]; then
  echo "No matching publicodes branch, keeping the published version"
  exit 0
fi

echo "Using publicodes branch $branch"
rm -rf "$PUBLICODES_DIR"
git clone --branch "$branch" --depth 1 "$PUBLICODES_REPO_URL" "$PUBLICODES_DIR"
pnpm -C "$PUBLICODES_DIR" install
pnpm -C "$PUBLICODES_DIR" run build
pnpm add "file:$PUBLICODES_DIR"
