# Etudes en cours

Données récupérées depuis le [Ficher Excel](https://docs.google.com/spreadsheets/d/11MJDXja4Od1tmYUM7a4d2EqiaGjlQiUM/edit?gid=1515069000#gid=1515069000)

Télécharger le fichier comme un CSV et lancer

```sh
pnpm cli data:import etudes-en-cours --file fichier.csv

pnpm db:push:dev --data-only etudes_en_cours_tiles
pnpm db:push:prod --data-only etudes_en_cours_tiles
```
