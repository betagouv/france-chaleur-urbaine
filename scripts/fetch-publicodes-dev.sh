#!/bin/bash
set -e

rm -rf france-chaleur-urbaine-publicodes
git clone --branch dev --depth 1 https://github.com/betagouv/france-chaleur-urbaine-publicodes.git france-chaleur-urbaine-publicodes
cd france-chaleur-urbaine-publicodes
pnpm install
pnpm build
cd ..
pnpm install @betagouv/france-chaleur-urbaine-publicodes@file:france-chaleur-urbaine-publicodes
