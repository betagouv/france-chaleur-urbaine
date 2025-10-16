# Tippecanoe Docker

Image Docker pour [le fork actif de Tippecanoe](https://github.com/felt/tippecanoe) avec support multi-architecture (x86_64 et ARM64).

## Utilisation

### Commandes Tippecanoe directes
```bash
# Version
docker run --rm ghcr.io/france-chaleur-urbaine/tippecanoe:latest --version

# Aide
docker run --rm ghcr.io/france-chaleur-urbaine/tippecanoe:latest --help

# Créer des tuiles
docker run --rm -v $(pwd)/data:/data ghcr.io/france-chaleur-urbaine/tippecanoe:latest \
  -o output.mbtiles input.geojson
```

### Autres outils Tippecanoe
```bash
# tippecanoe-decode
docker run --rm ghcr.io/france-chaleur-urbaine/tippecanoe:latest tippecanoe-decode file.mbtiles

# tippecanoe-enumerate
docker run --rm ghcr.io/france-chaleur-urbaine/tippecanoe:latest tippecanoe-enumerate file.mbtiles

# tippecanoe-json-tool
docker run --rm ghcr.io/france-chaleur-urbaine/tippecanoe:latest tippecanoe-json-tool

# tippecanoe-overzoom
docker run --rm ghcr.io/france-chaleur-urbaine/tippecanoe:latest tippecanoe-overzoom
```

### Shell interactif
```bash
# Accéder au shell
docker run -it --rm ghcr.io/france-chaleur-urbaine/tippecanoe:latest sh
```

### Build local
```bash
# Construire l'image localement
./build.sh local amd64
```

## Images disponibles

- `ghcr.io/france-chaleur-urbaine/tippecanoe:latest`
- `ghcr.io/france-chaleur-urbaine/tippecanoe:main`
- `ghcr.io/france-chaleur-urbaine/tippecanoe:dev`

## Outils inclus

- `tippecanoe` - Création de tuiles vectorielles
- `tippecanoe-decode` - Décodage des tuiles
- `tippecanoe-enumerate` - Énumération des tuiles
- `tippecanoe-json-tool` - Traitement de données GeoJSON
- `tippecanoe-overzoom` - Création de tuiles à partir de tuiles parentes
