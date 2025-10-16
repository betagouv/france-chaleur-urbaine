# Git Workflow

<!-- Source: /CLAUDE.md -->

## Deployment

- **Main branch** → Production on Scalingo : no dev on it
- **Dev branch** → Development environment
- Pull requests create review apps automatically
- Clock container runs scheduled tasks (see `scripts/`)

<!-- Source: /README.md -->

## Hook pre-commit

Un hook pre-commit Git permet de vérifier que le code est correctement linté avec [lint-staged](https://github.com/lint-staged/lint-staged), et [talisman](https://github.com/thoughtworks/talisman/) est un outil qui permet de détecter les fuites de secrets dans les commits.
À noter que [GitGuardian](https://www.gitguardian.com/) est configuré sur l'organisation beta.gouv et fait la même chose, mais le secret a alors été rendu public et il faut alors l'invalider.


Si talisman détecte une erreur au moment d'un commit, 2 options sont possibles :
- soit corriger l'erreur pour supprimer l'alerte ;
- soit ajouter une exception via la commande `pnpm talisman:add-exception`.

