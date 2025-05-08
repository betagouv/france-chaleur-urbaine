#!/bin/bash -e

echo "> Suppressions du frontmatter des articles"

find "src/data/contents" -type f -name "*.md" | while IFS= read -r fichier; do
    # Contenu original du fichier
    original=$(cat "$fichier")

    # Supprime le frontmatter (entre deux lignes ---) et les lignes vides au début
    nettoye=$(awk '
        BEGIN { in_frontmatter = 0; first_line = 1 }
        /^---$/ {
            in_frontmatter = !in_frontmatter
            next
        }
        in_frontmatter { next }
        first_line && /^$/ { next }
        {
            first_line = 0
            print
        }
    ' "$fichier")

    # Remplace les liens absolus par des liens relatifs
    nettoye_modifie=$(echo "$nettoye" | sed 's#](https://france-chaleur-urbaine\.beta\.gouv\.fr/#](/#g')

    # Écrase le fichier seulement si du contenu a été modifié
    if [ "$original" != "$nettoye_modifie" ]; then
        echo "$nettoye_modifie" > "$fichier"
        echo "Nettoyage effectué sur : $fichier"
    fi
done
