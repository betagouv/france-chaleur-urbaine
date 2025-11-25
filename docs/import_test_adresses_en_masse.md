# Tests d'adresses en masse

Le but est déafficher sur la carte la liste de toutes les adresses testées en masse et qui ont on score de retour de la BAN suffisant pour être considérées comme valide.
L'idée finale non implémentée étant de faire des groupes d'adresses à proximité et demettre en relation les testeurs avec les constructeurs de réseaux.


## Import de données legacy
Données récupérées depuis la table `eligibility_demands` et `eligibility_tests` qui ont été dépréciées.

Le but ici est de les convertir dans un format affichable facilement sur le layer des tests d'adresses

```sh
# recuperer les dernières versions
pnpm db:pull:dev eligibility_tests
pnpm db:pull:dev eligibility_demands_addresses

# Recréer une table eligibility_demands_addresses harmonisée avec pro_eligibility_tests_adresses
# ⚠️ Il est nécessaire, pour recréer correctement from scratch cette table de passer toutes les adresses de eligibility_tests à 'pending'
# il y a 1 400 000 adresses qui vont etre recalculées par la BAN donc ca peut etre long
pnpm cli data import tests-adresses-legacy

# Ces bdd peuvent etre poussées sur dev pour partager avec d'autres membres de l'équipe
pnpm db:push:dev eligibility_tests
pnpm db:push:dev eligibility_demands_addresses

```

## Génération des tuiles

Les tuiles seront donc générées depuis `eligibility_demands_addresses` et `pro_eligibility_tests_adresses`

💡 Ce layer n'est destiné qu'aux admin pour le moment

```sh
pnpm cli tiles:generate tests-adresses
```
