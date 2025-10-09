# syntax=docker/dockerfile:1
# Multi-stage build pour Tippecanoe
# Support des architectures x86_64 et ARM64

# Stage 1: Build
FROM --platform=$BUILDPLATFORM alpine:3.22 AS builder

# Installer les dépendances de build
RUN apk add --no-cache \
    build-base \
    cmake \
    git \
    zlib-dev \
    sqlite-dev \
    curl-dev \
    sqlite \
    python3 \
    py3-pip \
    bash

# Cloner le repository Tippecanoe
WORKDIR /src
RUN git clone --depth 1 https://github.com/felt/tippecanoe.git .

# Compiler Tippecanoe
RUN make -j

# Stage 2: Runtime (image finale minimale)
FROM alpine:3.22 AS runtime

# Installer uniquement les dépendances runtime nécessaires
RUN apk add --no-cache \
    libstdc++ \
    sqlite \
    sqlite-libs \
    zlib

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S tippecanoe && \
    adduser -u 1001 -S tippecanoe -G tippecanoe

# Copier les binaires compilés depuis le stage builder
COPY --from=builder /src/tippecanoe /usr/local/bin/tippecanoe
COPY --from=builder /src/tippecanoe-enumerate /usr/local/bin/tippecanoe-enumerate
COPY --from=builder /src/tippecanoe-decode /usr/local/bin/tippecanoe-decode
COPY --from=builder /src/tippecanoe-json-tool /usr/local/bin/tippecanoe-json-tool
COPY --from=builder /src/tippecanoe-overzoom /usr/local/bin/tippecanoe-overzoom

# Rendre les binaires exécutables
RUN chmod +x /usr/local/bin/tippecanoe*

# Définir le répertoire de travail
WORKDIR /data

# Changer les permissions du répertoire de travail
RUN chown -R tippecanoe:tippecanoe /data

# Changer vers l'utilisateur non-root
USER tippecanoe

# Point d'entrée par défaut
CMD ["tippecanoe"]

# Labels pour la documentation
LABEL maintainer="France Chaleur Urbaine" \
      description="Tippecanoe - Build vector tilesets from large collections of GeoJSON features" \
      version="latest" \
      source="https://github.com/felt/tippecanoe"
