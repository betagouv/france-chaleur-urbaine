# Import BDNB

Source : https://www.data.gouv.fr/datasets/base-de-donnees-nationale-des-batiments/

Télécharger "BDNB - Export france - pgdump"

Attention il faut avoir de la place sur son disque !
- 36Go d'archive sql compressé
- 150Go de sql non compressé à importer en base
- 200Go après import des tables et indexes dans la BDD.

Il peut être utile de customiser la configuration postgres pour améliorer les performances d'import. Penser à redémarrer le conteneur si la configuration est changée.
- shared_buffers 4GB
- work_mem 64MB
- maintenance_work_mem 4GB
- max_worker_processes 16
- wal_level minimal
- fsync off
- synchronous_commit off
- full_page_writes off
- max_wal_senders 0
- effective_cache_size 16GB


Une fois l'archive extraite, importer le dump avec 
```sh
psql postgres://postgres:postgres_fcu@localhost:5432 -f bdnb.sql
# prend 50min sur une config plutôt beefy
```


Au préalable il faut avoir ajouté un id serial sur la table batiment_groupe de la bdnb afin de pouvoir découper plus facilement pour le script qui va suivre
```sql
ALTER TABLE bdnb_2024_10_a_open_data.batiment_groupe ADD COLUMN id SERIAL;
CREATE INDEX CONCURRENTLY batiment_groupe_id_idx ON bdnb_2024_10_a_open_data.batiment_groupe(id);
```

Lancer la création de la table bdnb-batiments.
```sh
./scripts/bdnb/prepare-bdnb-batiments.sh
```

Créer les indexes manquants sur la nouvelle table :
```sql
CREATE INDEX CONCURRENTLY bdnb_batiments_id_idx ON bdnb_batiments(id);
CREATE INDEX CONCURRENTLY bdnb_batiments_batiment_groupe_id_idx ON bdnb_batiments(batiment_groupe_id);
CREATE INDEX CONCURRENTLY bdnb_batiments_geom_idx ON bdnb_batiments USING gist (geom);
```

Puis enfin générer les tuiles :
```sh
pnpm cli tiles generate bdnb-batiments
```


## Liste des tables

cat bdnb.sql | grep "CREATE TABLE" | grep -Eo '"\w*"\."\w*"'

"bdnb_2024_10_a_open_data"."adresse"
"bdnb_2024_10_a_open_data"."adresse_metrique"
"bdnb_2024_10_a_open_data"."rel_batiment_construction_adresse"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_adresse"
"bdnb_2024_10_a_open_data"."batiment_construction"
"bdnb_2024_10_a_open_data"."batiment_groupe"
"bdnb_2024_10_a_open_data"."batiment_groupe_adresse"
"bdnb_2024_10_a_open_data"."batiment_groupe_argiles"
"bdnb_2024_10_a_open_data"."batiment_groupe_bdtopo_bat"
"bdnb_2024_10_a_open_data"."batiment_groupe_bdtopo_equ"
"bdnb_2024_10_a_open_data"."batiment_groupe_bdtopo_zoac"
"bdnb_2024_10_a_open_data"."batiment_groupe_bpe"
"bdnb_2024_10_a_open_data"."batiment_groupe_dle_elec_multimillesime"
"bdnb_2024_10_a_open_data"."batiment_groupe_dle_gaz_multimillesime"
"bdnb_2024_10_a_open_data"."batiment_groupe_dle_reseaux_multimillesime"
"bdnb_2024_10_a_open_data"."batiment_groupe_dpe_representatif_logement"
"bdnb_2024_10_a_open_data"."batiment_groupe_dpe_statistique_logement"
"bdnb_2024_10_a_open_data"."batiment_groupe_dvf_open_representatif"
"bdnb_2024_10_a_open_data"."batiment_groupe_dvf_open_statistique"
"bdnb_2024_10_a_open_data"."batiment_groupe_ffo_bat"
"bdnb_2024_10_a_open_data"."batiment_groupe_geospx"
"bdnb_2024_10_a_open_data"."batiment_groupe_hthd"
"bdnb_2024_10_a_open_data"."batiment_groupe_indicateur_reseau_chaud_froid"
"bdnb_2024_10_a_open_data"."batiment_groupe_merimee"
"bdnb_2024_10_a_open_data"."batiment_groupe_qpv"
"bdnb_2024_10_a_open_data"."batiment_groupe_radon"
"bdnb_2024_10_a_open_data"."batiment_groupe_rnc"
"bdnb_2024_10_a_open_data"."batiment_groupe_rpls"
"bdnb_2024_10_a_open_data"."batiment_groupe_synthese_propriete_usage"
"bdnb_2024_10_a_open_data"."parcelle"
"bdnb_2024_10_a_open_data"."parcelle_sitadel"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_parcelle"
"bdnb_2024_10_a_open_data"."proprietaire"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_proprietaire"
"bdnb_2024_10_a_open_data"."dpe_logement"
"bdnb_2024_10_a_open_data"."rel_batiment_construction_rnb"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_bdtopo_bat"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_bdtopo_equ"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_bdtopo_zoa"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_bpe"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_dpe_logement"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_dvf_open"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_merimee"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_qpv"
"bdnb_2024_10_a_open_data"."rel_batiment_groupe_rnc"
"bdnb_2024_10_a_open_data"."rel_parcelle_sitadel"
"bdnb_2024_10_a_open_data"."sitadel"



## Requêtes intéressantes


```sql
-- exemple 20 avenue de ségur 
-- id rnb = https://rnb.beta.gouv.fr/carte?q=NHDE2W8HE3X3
-- id bdnb : bdnb-bc-W9BR-67EJ-XGRW (batiment construction)
-- id bdtopo : BATIMENT0000000241926244


-- infos sur un batiment (attention, ne contient pas exactement toutes les jointures des tables secondaires)
SELECT jsonb_build_object(
	'batiment_groupe', bg,
	'batiment_groupe_adresse', (SELECT jsonb_agg(to_jsonb(bga)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_adresse" bga 
		WHERE bga.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_bdtopo_bat', (SELECT jsonb_agg(to_jsonb(bat)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_bdtopo_bat" bat 
		WHERE bat.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_bdtopo_equ', (SELECT jsonb_agg(to_jsonb(equ)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_bdtopo_equ" equ 
		WHERE equ.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_bdtopo_zoac', (SELECT jsonb_agg(to_jsonb(zoa)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_bdtopo_zoac" zoa 
		WHERE zoa.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_bpe', (SELECT jsonb_agg(to_jsonb(bpe)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_bpe" bpe 
		WHERE bpe.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_dle_elec_multimillesime', (SELECT jsonb_agg(to_jsonb(el)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_dle_elec_multimillesime" el 
		WHERE el.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_dle_gaz_multimillesime', (SELECT jsonb_agg(to_jsonb(gz)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_dle_gaz_multimillesime" gz 
		WHERE gz.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_dle_reseaux_multimillesime', (SELECT jsonb_agg(to_jsonb(rs)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_dle_reseaux_multimillesime" rs 
		WHERE rs.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_dpe_representatif_logement', (SELECT jsonb_agg(to_jsonb(dr)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_dpe_representatif_logement" dr 
		WHERE dr.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_dpe_statistique_logement', (SELECT jsonb_agg(to_jsonb(ds)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_dpe_statistique_logement" ds 
		WHERE ds.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_dvf_open_representatif', (SELECT jsonb_agg(to_jsonb(dvr)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_dvf_open_representatif" dvr 
		WHERE dvr.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_dvf_open_statistique', (SELECT jsonb_agg(to_jsonb(dvs)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_dvf_open_statistique" dvs 
		WHERE dvs.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_ffo_bat', (SELECT jsonb_agg(to_jsonb(ffo)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_ffo_bat" ffo 
		WHERE ffo.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_geospx', (SELECT jsonb_agg(to_jsonb(geo)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_geospx" geo 
		WHERE geo.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_hthd', (SELECT jsonb_agg(to_jsonb(hthd)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_hthd" hthd 
		WHERE hthd.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_indicateur_reseau_chaud_froid', (SELECT jsonb_agg(to_jsonb(rcf)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_indicateur_reseau_chaud_froid" rcf 
		WHERE rcf.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_merimee', (SELECT jsonb_agg(to_jsonb(mer)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_merimee" mer 
		WHERE mer.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_qpv', (SELECT jsonb_agg(to_jsonb(qpv)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_qpv" qpv 
		WHERE qpv.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_radon', (SELECT jsonb_agg(to_jsonb(rad)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_radon" rad 
		WHERE rad.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_rnc', (SELECT jsonb_agg(to_jsonb(rnc)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_rnc" rnc 
		WHERE rnc.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_rpls', (SELECT jsonb_agg(to_jsonb(rpls)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_rpls" rpls 
		WHERE rpls.batiment_groupe_id = bg.batiment_groupe_id),
	'batiment_groupe_synthese_propriete_usage', (SELECT jsonb_agg(to_jsonb(spu)) FROM "bdnb_2024_10_a_open_data"."batiment_groupe_synthese_propriete_usage" spu 
		WHERE spu.batiment_groupe_id = bg.batiment_groupe_id)
)
FROM "bdnb_2024_10_a_open_data"."batiment_groupe" bg
WHERE bg.batiment_groupe_id = 'bdnb-bg-3V1V-LZJ9-EEZD';

-- stats d'énergie de chauffage 5M total
SELECT type_energie_chauffage, count(*)
FROM bdnb_2024_10_a_open_data.batiment_groupe_dpe_representatif_logement
GROUP BY type_energie_chauffage;
```
