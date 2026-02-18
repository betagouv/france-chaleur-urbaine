# OpenData

Documentation pour générer et publier l'archive OpenData de France Chaleur Urbaine sur data.gouv.fr.

L'archive OpenData contient les données géographiques des réseaux de chaleur et de froid au format Shapefile et GeoJSON.
Elle est publiée sur le dataset [Tracés des réseaux de chaleur et de froid](https://www.data.gouv.fr/fr/datasets/traces-des-reseaux-de-chaleur-et-de-froid/) de data.gouv.fr.


## Prérequis pour la publication

- Obtenir une clé API data.gouv.fr configurée dans `.env.local` :
  ```bash
  DATA_GOUV_FR_API_KEY=votre_cle_api
  DATA_GOUV_FR_DATASET_ID=id_dataset_fcu
  ```
  
  La clé API peut être générée sur [data.gouv.fr](https://www.data.gouv.fr/admin/me/profile).


## Récupérer les données de production

Avant de générer l'archive OpenData, il faut récupérer les dernières données FCU de production.

```bash
pnpm db:pull:prod --data-only reseaux_de_chaleur reseaux_de_froid zone_de_developpement_prioritaire zones_et_reseaux_en_construction
```


## Génération de l'archive

Pour générer l'archive OpenData, utilisez la commande CLI :

```bash
pnpm cli opendata create-archive
```

Cette commande :

1. Crée un schéma temporaire `opendata` dans la base de données
2. Génère des vues SQL préparant les données pour l'export :
   - `reseaux_de_chaleur` (GeoJSON) et `reseaux_de_chaleur_shp` (Shapefile)
   - `reseaux_de_froid` (GeoJSON) et `reseaux_de_froid_shp` (Shapefile)
   - `zone_de_developpement_prioritaire` (PDP)
   - `zones_et_reseaux_en_construction`
3. Exporte les données au format GeoJSON :
   - `reseaux_de_chaleur.geojson` (tracés)
   - `reseaux_de_chaleur_sans_traces.geojson` (points)
   - `reseaux_de_froid.geojson` (tracés)
   - `reseaux_de_froid_sans_traces.geojson` (points)
   - `pdp.geojson` (zones de développement prioritaire)
   - `zones_et_reseaux_en_construction.geojson`
4. Exporte les données au format Shapefile (via GDAL/OGR) :
   - `reseaux_de_chaleur.shp` (tracés)
   - `reseaux_de_chaleur_sans_traces.shp` (points)
   - `reseaux_de_froid.shp` (tracés)
   - `reseaux_de_froid_sans_traces.shp` (points)
   - `pdp.shp` (zones de développement prioritaire)
   - `reseaux_en_construction_traces.shp` (tracés en construction)
   - `reseaux_en_construction_zones.shp` (zones en construction)
5. Inclut le fichier de nomenclature : `nomenclature_shapefile_des_reseaux_de_chaleur_et_froid.xlsx`
6. Crée l'archive ZIP nommée `DDMMYY-opendata-fcu.zip` (format de date : jour/mois/année)

L'archive est créée dans le répertoire courant.


## Publication de l'archive

### Option 1 : Publication automatique (recommandée)

Pour publier automatiquement l'archive sur data.gouv.fr :

```bash
pnpm cli opendata publish <chemin-vers-archive.zip>
```

Cette commande :
1. Crée une ressource de type "mise à jour" sur data.gouv.fr avec le fichier
2. Met à jour le fichier principal du dataset avec la nouvelle archive


### Option 2 : Publication manuelle

Si vous préférez publier manuellement :

1. Aller sur le [jeu de données Tracés des réseaux de chaleur et de froid](https://www.data.gouv.fr/admin/datasets/64f05d3568e4d575eb454ffe)
2. Ajouter une mise à jour avec l'archive en précisant :
   - Le nom du fichier
   - Une description détaillée du contenu de la mise à jour dans le champ "Description"
3. Modifier le fichier principal (`opendata-fcu.zip`) avec la nouvelle archive


## Contenu de l'archive

L'archive contient :

### Fichiers GeoJSON

- **reseaux_de_chaleur.geojson** : Tracés des réseaux de chaleur (MultiLineString)
- **reseaux_de_chaleur_sans_traces.geojson** : Réseaux de chaleur sans tracés géométriques (Point)
- **reseaux_de_froid.geojson** : Tracés des réseaux de froid (MultiLineString)
- **reseaux_de_froid_sans_traces.geojson** : Réseaux de froid sans tracés géométriques (Point)
- **pdp.geojson** : Zones de développement prioritaire (MultiPolygon)
- **zones_et_reseaux_en_construction.geojson** : Zones et réseaux en construction

### Fichiers Shapefile

- **reseaux_de_chaleur.shp** : Tracés des réseaux de chaleur
- **reseaux_de_chaleur_sans_traces.shp** : Réseaux de chaleur sans tracés
- **reseaux_de_froid.shp** : Tracés des réseaux de froid
- **reseaux_de_froid_sans_traces.shp** : Réseaux de froid sans tracés
- **pdp.shp** : Zones de développement prioritaire
- **reseaux_en_construction_traces.shp** : Tracés des réseaux en construction
- **reseaux_en_construction_zones.shp** : Zones des réseaux en construction

### Documentation

- **nomenclature_shapefile_des_reseaux_de_chaleur_et_froid.xlsx** : Fichier Excel décrivant la nomenclature des champs des fichiers Shapefile


## Notes techniques

- Les exports utilisent le système de coordonnées **EPSG:2154** (Lambert-93)
- Les Shapefiles sont encodés en **UTF-8** et ne permettent qu'un seul type de géométrie par fichier, d'où la séparation des points et des lignes
- Les vues SQL transforment les types de données pour garantir la compatibilité avec le format Shapefile (notamment les valeurs nulles dans les fichiers DBF)
