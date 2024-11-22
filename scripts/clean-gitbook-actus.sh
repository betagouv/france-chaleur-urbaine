#!/bin/bash -e

echo "> Suppressions du frontmatter des articles"

while IFS= read -r fichier; do
    sed -i '/^---$/,/^---$/d;' "$fichier"
    # supprime les lignes vides avant le titre
    sed -i '1{/^$/d}' "$fichier"
    sed -i '1{/^$/d}' "$fichier"
    echo "Frontmatter supprimé de : $fichier"
done < <(find "src/data/contents" -maxdepth 1 -type f -name "*.md")
