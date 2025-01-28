# Procédure pour exporter les batiments et logements à proximité pour les quartiers prioritaires de la ville (QPV)

[Ticket trello](https://trello.com/c/RY9S6K8Q/1414-extraction-de-donn%C3%A9es-pour-lanru)

Ce script reprend globalement les étapes de la [1ère extraction des données BDNB](../readme.md), mais le format est meilleur car on récupère les distances.
On pourra également vérifier que les batiments sont inclus dans une zone à potentiel etc pour être complet sur la fournitude de métadonnées autour des batiments.


## Étapes

Prérequis :
- posséder les tables à jour :
  - public.bdnb_registre_2022 (provenance Sébastien)
  - public.reseaux_de_chaleur
  - public.reseaux_de_froid
  - public.zone_de_developpement_prioritaire
  - public.zones_et_reseaux_en_construction
  - public.zone_a_potentiel_chaud
  - public.zone_a_potentiel_fort_chaud
  - data.quartiers_prioritaires
- psql (CLI postgresql)
- [parallel](https://www.gnu.org/software/parallel/) (Pour macOS : `brew install parallel`)
- probablement avoir tuné la configuration postgresql pour augmenter la taille des buffers

```sh
cd scripts/bdnb/qpv

# précalcul de toutes les données de proximité dans des tables prêtes à être exploitées
# noter que tous les batiments ne sont pas pris en compte, ils sont préfiltrés selon leur mode de chauffage + proximité aux QPV
./prepare-batiments-summary-qpv.sh

# export des métriques en CSV
./export-qpv.sh
```
