# Mise à jour annuelle des données réglementaires (arrêté DPE)

Le taux d'EnR&R, les contenus CO2 (direct et ACV) et l'année de référence des réseaux de chaleur et de froid sont les valeurs de l'annexe « Données des réseaux de chaleur et de froid » de l'**arrêté modifiant l'arrêté du 15 septembre 2006 relatif au DPE**, publié chaque année sur Légifrance (généralement au printemps, sur les données de l'année N-2). Ces champs ne viennent plus d'Airtable : ils sont importés directement en base par la procédure ci-dessous, et la synchronisation Airtable → Postgres les ignore (`src/modules/reseaux/server/download-network.ts`).

Ne pas confondre avec l'**arrêté relatif au classement des réseaux**, publié séparément (`dataSourcesVersions.arreteClassement`).

## Procédure

1. Ouvrir la page Légifrance de l'arrêté dans un navigateur et l'enregistrer en HTML (Ctrl+S, « page web, HTML uniquement »). Légifrance refuse les requêtes hors navigateur, la récupération automatique n'est pas possible.
2. Extraire l'annexe vers un CSV versionné :

   ```sh
   pnpm cli data arrete-dpe:html-to-csv ~/Downloads/arrete_dpe.html src/data/arrete-dpe/<année>.csv
   ```

   Vérifier le nombre de réseaux extraits (≈ 1 000 réseaux de chaleur, ≈ 50 de froid) et les valeurs d'année de référence (`2024` ou `Moyenne`).
3. Simuler l'import et relire le rapport `import-arrete-dpe-<date>.log` généré dans le répertoire courant :

   ```sh
   pnpm cli data import arrete-dpe --file src/data/arrete-dpe/<année>.csv --dry-run
   ```

   - « réinitialisés » : réseaux présents en base avec des valeurs mais absents du nouvel arrêté, ils passent à vide (choix assumé : ne jamais afficher des valeurs d'un arrêté précédent sous la référence du nouveau) ;
   - « identifiants absents de la base » : réseaux de l'arrêté sans réseau correspondant en base (identifiant SNCU manquant ou différent), à créer ou corriger dans l'admin si besoin, puis relancer.
4. Appliquer sur l'environnement cible (même commande sans `--dry-run`, avec la `DATABASE_URL` de l'environnement). La transaction remet les quatre champs à vide sur toute la table puis écrit les réseaux de l'arrêté, et les tuiles `reseaux-de-chaleur` et `reseaux-de-froid` sont régénérées.
5. Mettre à jour la référence affichée sur le site dans `dataSourcesVersions.arreteDpe` (`src/modules/app/constants.ts`) : lien, date de l'arrêté, année de référence et années de la moyenne. Tous les textes (fiches réseau, liste des réseaux, page données, exports et infobulles des tests pro) lisent cette constante.
6. Vérifier une fiche réseau (`/reseaux/<id_sncu>`), la page `/donnees` et le PDF `public/documentation/carto_sources.pdf` s'il cite l'arrêté.

## Détails

- Import : `src/modules/data/server/imports/arrete-dpe.ts` (parseur HTML, CSV, diff, application, rapport), tests unitaires et d'intégration à côté.
- Le CSV est versionné dans `src/data/arrete-dpe/` pour garder la trace de ce qui a été importé chaque année.
- Doc produit : section « Données réglementaires : l'arrêté DPE » de `/admin/doc/gestion-reseaux`.
