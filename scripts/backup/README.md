# Sauvegarde hors Scalingo de la production

Copie manuelle et chiffrée de la production sur un stockage personnel (règle 3-2-1), en complément des sauvegardes
automatiques Scalingo. Lancée de temps en temps, sans rétention automatique.

## Prérequis

- CLI `scalingo`, [`age`](https://age-encryption.org) (`mise use -g age` ou `apt install age`), `curl`, `jq`, `git`
- Un jeton d'API Scalingo (dashboard, Profile, API tokens), mis dans `scripts/backup/.env` : la CLI s'en sert pour les
  métadonnées (pas de `scalingo login` nécessaire), et l'API pour lister les sauvegardes en JSON et télécharger la dernière
- Une paire de clés age (voir ci-dessous)
- `scripts/backup/.env` créé depuis `.env.example` (chemin cible, clé publique, jeton Scalingo, clé API Grist)

## Générer la clé de chiffrement (une seule fois)

```bash
age-keygen
```

La commande affiche deux lignes, et rien n'est écrit sur disque :

```
# public key: ageXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AGE-SECRET-KEY-XXXXXXXXXXXXXXXXXXXXXXXXXXX
```

1. **Clé publique** (`age1…`) : à copier dans `scripts/backup/.env` (`FCU_BACKUP_AGE_PUBLIC_KEY`). Elle ne sert qu'à chiffrer et n'est pas secrète.
2. **Clé secrète** (`AGE-SECRET-KEY-1…`) : à enregistrer dans un gestionnaire de mots de passe, avec la clé publique à côté pour les retrouver ensemble. Elle ne sert qu'à déchiffrer, elle n'est jamais écrite sur le poste ni dans le dépôt. **Sans elle, aucune sauvegarde n'est déchiffrable.**
3. Fermer le terminal (ou `clear`) une fois la clé enregistrée.

Vérifier que la clé secrète enregistrée correspond bien à la clé publique configurée :

```bash
age-keygen -y <(read -rs -p 'Clé secrète : ' k; echo >&2; printf '%s\n' "$k")
```

Changer de clé plus tard revient à relancer `age-keygen` et mettre à jour `.env` : les sauvegardes déjà faites restent déchiffrables avec l'ancienne clé secrète, à conserver.

## Sauvegarder

```bash
pnpm backup:prod
```

Aucun secret n'est demandé : le chiffrement n'utilise que la clé publique. Un dossier `<date>_<heure>` est créé dans `FCU_BACKUP_DIR` avec :

| Fichier | Contenu |
|---------|---------|
| `db-<id>.tar.gz.age` | Dernière sauvegarde Scalingo de la base (archive Scalingo, dump `pg_dump` au format custom), chiffrée en flux : aucun clair sur disque |
| `scalingo-meta.tar.age` | Variables d'environnement, déploiements (hash git déployé), formation, domaines, add-ons, liste des sauvegardes (JSON) |
| `grist-<workspace>-<doc>-<id>.grist.age` | Fichier `.grist` complet (SQLite) de chaque doc des workspaces de l'organisation Grist, réimportable dans Grist |
| `repo.bundle.age` | `git bundle` du dépôt, toutes branches et tags (`git clone repo.bundle`) |
| `*.sha256` | Empreinte de chaque fichier chiffré, pour vérifier l'intégrité sans déchiffrer |
| `manifest.json` | En clair : date, id et date de la sauvegarde Scalingo, hash déployé, docs Grist, empreintes |

Run interrompu : `pnpm backup:prod <dossier-du-run>` reprend dans ce dossier et ne refait pas les fichiers déjà complets
(un fichier n'est renommé sans `.part` qu'à la fin de son écriture). Ne pas modifier le script pendant qu'un run tourne.

## Déchiffrer

```bash
pnpm backup:decrypt <dossier-sauvegarde> <dossier-destination>
```

Vérifie les empreintes puis déchiffre tous les fichiers vers la destination (à choisir sur un disque local, pas sur le stockage de sauvegarde).
La clé secrète est demandée au prompt et ne touche jamais le disque ; `FCU_BACKUP_AGE_IDENTITY_FILE=<fichier>` pour la lire depuis un fichier.
À la main : `age -d -i cle.txt fichier.age > fichier`.

Restauration de la base : extraire l'archive puis `pg_restore` (voir `scripts/db_sync_common.sh` pour l'image Docker PostGIS utilisée dans le projet).
