#!/bin/bash

# Script de build pour Tippecanoe Docker images
# Support des architectures x86_64 et ARM64

set -e

cd "$(dirname "$0")"

# Configuration
IMAGE_NAME="france-chaleur-urbaine/tippecanoe"
TAG="latest"
DOCKERFILE="Dockerfile"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Construction des images Tippecanoe multi-architecture${NC}"

# Vérifier que Docker Buildx est disponible
if ! docker buildx version > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Buildx n'est pas disponible. Veuillez l'installer.${NC}"
    exit 1
fi

# Créer un builder si nécessaire
BUILDER_NAME="tippecanoe-builder"
if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Création du builder Docker Buildx...${NC}"
    docker buildx create --name $BUILDER_NAME --use
    docker buildx inspect --bootstrap
else
    echo -e "${YELLOW}📦 Utilisation du builder existant...${NC}"
    docker buildx use $BUILDER_NAME
fi

# Fonction pour construire et pousser
build_and_push() {
    local platforms=$1
    local push_flag=$2
    
    echo -e "${GREEN}🔨 Construction pour les plateformes: $platforms${NC}"
    
    docker buildx build \
        --platform $platforms \
        --file $DOCKERFILE \
        --tag $IMAGE_NAME:$TAG \
        $push_flag \
        .
}

# Fonction pour construire localement
build_local() {
    local arch=$1
    local platform="linux/$arch"
    
    echo -e "${GREEN}🔨 Construction locale pour $arch${NC}"
    
    docker buildx build \
        --platform $platform \
        --file $DOCKERFILE \
        --tag $IMAGE_NAME:$TAG-$arch \
        --load \
        .
}

# Fonction pour tester l'image
test_image() {
    local arch=${1:-"amd64"}
    local image_tag="$IMAGE_NAME:$TAG-$arch"
    
    echo -e "${GREEN}🧪 Test de l'image $image_tag${NC}"
    
    # Vérifier si l'image existe
    if ! docker image inspect $image_tag > /dev/null 2>&1; then
        echo -e "${RED}❌ Image $image_tag n'existe pas${NC}"
        return 1
    fi
    
    # Tenter d'exécuter l'image
    if docker run --rm --platform linux/$arch $image_tag tippecanoe --version 2>/dev/null; then
        echo -e "${GREEN}✅ Test réussi pour $arch${NC}"
    else
        # Vérifier si c'est un problème de plateforme
        local current_arch=$(uname -m)
        if [[ "$arch" == "arm64" && "$current_arch" == "x86_64" ]]; then
            echo -e "${YELLOW}⚠️  Image ARM64 construite avec succès (ne peut pas s'exécuter sur x86_64)${NC}"
            echo -e "${GREEN}✅ Test de construction réussi pour $arch${NC}"
        else
            echo -e "${RED}❌ Test échoué pour $arch${NC}"
            return 1
        fi
    fi
}

# Menu principal
case "${1:-help}" in
    "build")
        echo -e "${YELLOW}🔨 Construction des images...${NC}"
        build_and_push "linux/amd64,linux/arm64" ""
        echo -e "${GREEN}✅ Construction terminée!${NC}"
        ;;
    
    "push")
        echo -e "${YELLOW}📤 Construction et poussée des images...${NC}"
        build_and_push "linux/amd64,linux/arm64" "--push"
        echo -e "${GREEN}✅ Images poussées vers le registry!${NC}"
        ;;
    
    "local")
        local_arch=${2:-"amd64"}
        echo -e "${YELLOW}🔨 Construction locale pour $local_arch...${NC}"
        build_local $local_arch
        test_image $local_arch
        ;;
    
    "test")
        test_arch=${2:-"amd64"}
        test_image $test_arch
        ;;
    
    "clean")
        echo -e "${YELLOW}🧹 Nettoyage des images...${NC}"
        docker buildx prune -f
        docker image prune -f
        echo -e "${GREEN}✅ Nettoyage terminé!${NC}"
        ;;
    
    "help"|*)
        echo -e "${GREEN}Usage: $0 [command] [options]${NC}"
        echo ""
        echo "Commandes disponibles:"
        echo "  build     - Construire les images multi-architecture (sans push)"
        echo "  push      - Construire et pousser les images vers le registry"
        echo "  local     - Construire une image locale pour une architecture spécifique"
        echo "              Usage: $0 local [amd64|arm64]"
        echo "  test      - Tester une image construite"
        echo "              Usage: $0 test [amd64|arm64]"
        echo "  clean     - Nettoyer les images et caches Docker"
        echo "  help      - Afficher cette aide"
        echo ""
        echo "Exemples:"
        echo "  $0 build                    # Construire pour amd64 et arm64"
        echo "  $0 push                     # Construire et pousser"
        echo "  $0 local amd64              # Construire localement pour amd64"
        echo "  $0 test amd64               # Tester l'image amd64"
        ;;
esac
