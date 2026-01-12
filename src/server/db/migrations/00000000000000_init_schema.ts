import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE FUNCTION public.immutable_unaccent(text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
      SELECT public.unaccent($1::text);
    $_$;

CREATE SEQUENCE public.besoins_en_chaleur_batiments_ogc_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE public.ign_communes_ogc_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE public.ign_departements_ogc_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE public.ign_regions_ogc_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE public.quartiers_prioritaires_politique_ville_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE public.zone_a_potentiel_chaud_ogc_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE public.zone_a_potentiel_fort_chaud_ogc_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE public.zone_a_potentiel_fort_froid_ogc_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE public.zone_a_potentiel_froid_ogc_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE public.api_accounts (
    key character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    gestionnaires character varying(255)[],
    name character varying(255),
    networks character varying(255)[]
);
CREATE TABLE public.assignment_rules (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    search_pattern character varying(255) NOT NULL,
    result character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE public.batiments_raccordes_reseaux_chaleur_froid_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.bdnb_batiments (
    id integer,
    batiment_groupe_id character varying(22),
    geom public.geometry(MultiPolygon,2154),
    code_commune_insee character varying(5),
    adresse_cle_interop_adr_principale_ban character varying,
    adresse_libelle_adr_principale_ban character varying,
    ffo_bat_nb_log smallint,
    ffo_bat_annee_construction smallint,
    ffo_bat_usage_niveau_1_txt character varying,
    dle_elec_multimillesime_conso_pro real,
    dle_elec_multimillesime_conso_res real,
    dle_elec_multimillesime_conso_tot real,
    dle_gaz_multimillesime_conso_pro real,
    dle_gaz_multimillesime_conso_res real,
    dle_gaz_multimillesime_conso_tot real,
    dle_reseaux_multimillesime_conso_pro real,
    dle_reseaux_multimillesime_conso_res real,
    dle_reseaux_multimillesime_conso_tot real,
    rnc_l_nom_copro character varying[],
    dpe_representatif_logement_classe_bilan_dpe character varying,
    dpe_representatif_logement_classe_emission_ges character varying,
    dpe_representatif_logement_type_energie_chauffage character varying,
    dpe_representatif_logement_type_batiment_dpe character varying,
    dpe_representatif_logement_type_dpe character varying,
    dpe_representatif_logement_type_generateur_chauffage character varying,
    dpe_representatif_logement_surface_habitable_immeuble real,
    dpe_representatif_logement_type_installation_chauffage character varying,
    synthese_propriete_usage character varying,
    constructions jsonb
);
CREATE TABLE public.bdnb_batiments_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.besoins_en_chaleur_batiments (
    ogc_fid integer NOT NULL,
    idbatiment character varying(24),
    com_insee character varying(5),
    secteur character varying(22),
    chauf_mwh numeric(11,0),
    ecs_mwh numeric(11,0),
    froid_mwh numeric(11,0),
    part_ter numeric(11,0),
    en_chauf character varying(18),
    inst_chauf character varying(10),
    en_ecs character varying(18),
    inst_ecs character varying(10),
    sdp_m2 numeric(11,0),
    geom public.geometry(MultiPolygon,2154)
);
CREATE TABLE public.besoins_en_chaleur_industrie_communes_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.besoins_en_chaleur_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.communes (
    id character varying(255) NOT NULL,
    code_postal character varying(255) NOT NULL,
    commune character varying(255) NOT NULL,
    departement_id character varying(255) NOT NULL,
    altitude_moyenne integer NOT NULL,
    temperature_ref_altitude_moyenne numeric(8,2) NOT NULL,
    source character varying(255) NOT NULL
);
CREATE TABLE public.communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.demand_emails (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    airtable_id text,
    demand_id uuid NOT NULL,
    email_key text NOT NULL,
    "to" text NOT NULL,
    cc text,
    reply_to text,
    object text NOT NULL,
    body text NOT NULL,
    signature text,
    user_email text NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE public.demands (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    airtable_id text,
    legacy_values jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    user_id uuid,
    comment_gestionnaire text,
    comment_fcu text
);
CREATE TABLE public.departements (
    id character varying(255) NOT NULL,
    nom_departement character varying(255) NOT NULL,
    dju_chaud_moyen numeric(8,2),
    dju_froid_moyen numeric(8,2),
    zone_climatique character varying(255),
    source character varying(255),
    annee character varying(255) NOT NULL,
    sous_zone_climatique character varying(255)
);
CREATE TABLE public.donnees_de_consos (
    geom public.geometry(Point,2154) NOT NULL,
    code_grand character varying(254) NOT NULL,
    conso_nb double precision NOT NULL,
    adresse character varying(254) NOT NULL,
    pdl_nb integer NOT NULL
);
CREATE TABLE public.donnees_de_consos_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.eligibility_demands (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    eligibility_test_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE public.eligibility_demands_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    source_address text NOT NULL,
    ban_valid boolean,
    ban_address text,
    ban_score integer,
    geom public.geometry(Point,2154),
    eligibility_status jsonb,
    test_id uuid NOT NULL
);
CREATE TABLE public.eligibility_tests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    hash character varying(255) NOT NULL,
    version integer NOT NULL,
    addresses_count integer,
    error_count integer,
    eligibile_count integer,
    result text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    in_error boolean,
    file text DEFAULT 'Not available'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL
);
CREATE TABLE public.email_templates (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE public.enrr_mobilisables_friches_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.enrr_mobilisables_parkings_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.enrr_mobilisables_thalassothermie_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.enrr_mobilisables_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.enrr_mobilisables_zones_geothermie_profonde_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.epci (
    code character varying(255) NOT NULL,
    nom character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    membres jsonb NOT NULL
);
CREATE TABLE public.ept (
    code character varying(255) NOT NULL,
    nom character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    membres jsonb NOT NULL
);
CREATE TABLE public.etudes_en_cours (
    id integer NOT NULL,
    maitre_ouvrage character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    geom public.geometry NOT NULL,
    commune_ids text[] NOT NULL,
    launched_at timestamp with time zone NOT NULL,
    communes character varying(255)
);
CREATE TABLE public.etudes_en_cours_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    author_id uuid,
    type text NOT NULL,
    context_type text,
    context_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE public.ign_communes (
    ogc_fid integer NOT NULL,
    id character varying(24),
    nom character varying(50),
    nom_m character varying(50),
    insee_com character varying(5),
    statut character varying(26),
    population numeric(8,0),
    insee_can character varying(5),
    insee_arr character varying(2),
    insee_dep character varying(3),
    insee_reg character varying(2),
    siren_epci character varying(20),
    geom public.geometry(MultiPolygon,2154),
    geom_150m public.geometry(MultiPolygon,2154)
);
CREATE TABLE public.ign_departements (
    ogc_fid integer NOT NULL,
    geom public.geometry(MultiPolygon,2154),
    id character varying(24),
    nom_m character varying(30),
    nom character varying(30),
    insee_dep character varying(3),
    insee_reg character varying(2)
);
CREATE TABLE public.ign_regions (
    ogc_fid integer NOT NULL,
    id character varying(24),
    nom_m character varying(35),
    nom character varying(35),
    insee_reg character varying(2),
    geom public.geometry(MultiPolygon,2154)
);
CREATE TABLE public.installations_geothermie_profonde_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.installations_geothermie_surface_echangeurs_fermes_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.installations_geothermie_surface_echangeurs_ouverts_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.jobs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type text NOT NULL,
    data jsonb NOT NULL,
    result jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    entity_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE public.matomo_stats (
    method character varying(50) NOT NULL,
    stat_key character varying(50),
    date date NOT NULL,
    period character varying(50) NOT NULL,
    value double precision NOT NULL,
    method_params character varying,
    stat_label character varying
);
CREATE TABLE public.ouvrages_geothermie_surface_echangeurs_fermes_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.ouvrages_geothermie_surface_echangeurs_ouverts_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.perimetres_geothermie_profonde_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.pro_comparateur_configurations (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    situation jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    address character varying
);
CREATE TABLE public.pro_eligibility_addresses_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.pro_eligibility_tests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    user_id uuid NOT NULL,
    has_unseen_results boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    has_unseen_changes boolean DEFAULT false NOT NULL
);
CREATE TABLE public.pro_eligibility_tests_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    source_address text NOT NULL,
    ban_valid boolean NOT NULL,
    ban_address text,
    ban_score integer,
    geom public.geometry(Point,2154),
    eligibility_status jsonb,
    test_id uuid,
    eligibility_history jsonb,
    demand_id uuid
);
CREATE TABLE public.pro_eligibility_tests_addresses_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.quartiers_prioritaires_politique_ville (
    fid integer NOT NULL,
    code_qp character varying,
    lib_qp character varying,
    insee_reg character varying,
    lib_reg character varying,
    insee_dep character varying,
    lib_dep character varying,
    insee_com character varying,
    lib_com character varying,
    siren_epci character varying,
    geom public.geometry(MultiPolygon,2154)
);
CREATE TABLE public.quartiers_prioritaires_politique_ville_2015_anru_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.quartiers_prioritaires_politique_ville_2024_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.raccordements_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.reseaux_de_chaleur (
    id_fcu smallint NOT NULL,
    geom public.geometry,
    "Taux EnR&R" double precision,
    "Identifiant reseau" character varying(254),
    "Gestionnaire" character varying(254),
    communes text[],
    "contenu CO2" double precision,
    "contenu CO2 ACV" double precision,
    "PM" double precision,
    "PV%" double precision,
    "PF%" double precision,
    "PM_L" double precision,
    "PM_T" double precision,
    "Rend%" double precision,
    reseaux_techniques boolean,
    nom_reseau character varying(254),
    region character varying(254),
    "MO" character varying(254),
    adresse_mo character varying(254),
    annee_creation double precision,
    ville_mo character varying(254),
    longueur_reseau double precision,
    nb_pdl double precision,
    "prod_MWh_gaz_naturel" double precision,
    "prod_MWh_charbon" double precision,
    "prod_MWh_fioul_domestique" double precision,
    "prod_MWh_fioul_lourd" double precision,
    "prod_MWh_GPL" double precision,
    "prod_MWh_biomasse_solide" double precision,
    "prod_MWh_dechets_internes" double precision,
    "prod_MWh_UIOM" double precision,
    "prod_MWh_biogaz" double precision,
    "prod_MWh_geothermie" double precision,
    "prod_MWh_PAC" double precision,
    "prod_MWh_solaire_thermique" double precision,
    "prod_MWh_chaleur_industiel" double precision,
    "prod_MWh_autre_chaleur_recuperee" double precision,
    "prod_MWh_chaudieres_electriques" double precision,
    "prod_MWh_autres" double precision,
    "prod_MWh_autres_ENR" double precision,
    "livraisons_tertiaire_MWh" double precision,
    "livraisons_industrie_MWh" double precision,
    "livraisons_agriculture_MWh" double precision,
    "livraisons_autre_MWh" double precision,
    "production_totale_MWh" double precision,
    "livraisons_totale_MWh" double precision,
    "livraisons_residentiel_MWh" double precision,
    "reseaux classes" boolean,
    website_gestionnaire character varying(254),
    "CP_MO" character varying(254),
    has_trace boolean DEFAULT false NOT NULL,
    "informationsComplementaires" text,
    fichiers jsonb,
    eau_chaude character varying,
    eau_surchauffee character varying,
    vapeur character varying,
    "Dev_reseau%" double precision,
    "has_PDP" boolean DEFAULT false NOT NULL,
    "contenu_CO2_2023_tmp" double precision,
    "contenu_CO2_ACV_2023_tmp" double precision,
    "puissance_MW_gaz_naturel" double precision,
    "puissance_MW_charbon" double precision,
    "puissance_MW_fioul_domestique" double precision,
    "puissance_MW_fioul_lourd" double precision,
    "puissance_MW_GPL" double precision,
    "puissance_MW_biomasse_solide" double precision,
    "puissance_MW_dechets_internes" double precision,
    "puissance_MW_UIOM" double precision,
    "puissance_MW_biogaz" double precision,
    "puissance_MW_geothermie" double precision,
    "puissance_MW_PAC" double precision,
    "puissance_MW_solaire_thermique" double precision,
    "puissance_MW_chaleur_industiel" double precision,
    "puissance_MW_autre_chaleur_recuperee" double precision,
    "puissance_MW_chaudieres_electriques" double precision,
    "puissance_MW_autres" double precision,
    "puissance_MW_autres_ENR" double precision,
    "puissance_totale_MW" double precision,
    departement text,
    communes_insee text[],
    date_actualisation_trace timestamp with time zone,
    date_actualisation_pdp timestamp with time zone,
    "Moyenne-annee-DPE" character varying(255),
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    geom_update public.geometry
);
CREATE TABLE public.reseaux_de_chaleur_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.reseaux_de_froid (
    id_fcu smallint NOT NULL,
    geom public.geometry,
    "Taux EnR&R" double precision,
    "Identifiant reseau" character varying(254),
    "Gestionnaire" character varying(254),
    communes text[],
    "contenu CO2" double precision,
    "contenu CO2 ACV" double precision,
    nom_reseau character varying(254),
    region character varying(254),
    "MO" character varying(254),
    adresse_mo character varying(254),
    annee_creation double precision,
    ville_mo character varying(254),
    longueur_reseau double precision,
    nb_pdl double precision,
    "livraisons_tertiaire_MWh" double precision,
    "livraisons_industrie_MWh" double precision,
    "livraisons_agriculture_MWh" double precision,
    "livraisons_autre_MWh" double precision,
    "production_totale_MWh" double precision,
    "livraisons_totale_MWh" double precision,
    "livraisons_residentiel_MWh" double precision,
    "reseaux classes" boolean,
    website_gestionnaire character varying(254),
    "CP_MO" character varying(254),
    has_trace boolean DEFAULT false NOT NULL,
    "informationsComplementaires" text,
    fichiers jsonb,
    "Rend%" double precision,
    "contenu_CO2_2023_tmp" double precision,
    "contenu_CO2_ACV_2023_tmp" double precision,
    "puissance_totale_MW" double precision,
    departement text,
    communes_insee text[],
    date_actualisation_trace timestamp with time zone,
    "Moyenne-annee-DPE" character varying(255),
    geom_update public.geometry
);
CREATE TABLE public.reseaux_de_froid_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.ressources_geothermales_nappes_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.tags (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE public.tags_reminders (
    tag_id text NOT NULL,
    author_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_connection timestamp with time zone,
    reset_token text,
    role character varying(255) DEFAULT 'gestionnaire'::character varying NOT NULL,
    receive_new_demands boolean,
    receive_old_demands boolean,
    gestionnaires character varying(255)[],
    from_api character varying(255),
    active boolean DEFAULT true,
    signature character varying(255),
    activation_token text,
    activated_at timestamp with time zone,
    status text NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    structure_name character varying(255),
    structure_type character varying(100),
    structure_other character varying(255),
    phone character varying(20),
    accepted_cgu_at timestamp without time zone,
    optin_at timestamp without time zone,
    gestionnaires_from_api text[] DEFAULT '{}'::text[]
);
CREATE TABLE public.zone_a_potentiel_chaud (
    ogc_fid integer NOT NULL,
    id_zone character varying(254),
    com_arr character varying(254),
    code_com_i character varying(5),
    chauf_mwh numeric(23,15),
    ecs_mwh numeric(23,15),
    bat_imp numeric(10,0),
    part_ter numeric(23,15),
    sol_moy numeric(23,15),
    part_ecs numeric(23,15),
    rdt_ht numeric(23,15),
    rdt_bt numeric(23,15),
    surf_capt_ numeric(23,15),
    surf_cap_1 numeric(23,15),
    surf_sol_8 numeric(23,15),
    surf_sol_1 numeric(23,15),
    dep character varying(254),
    geothermie numeric(1,0),
    geom public.geometry(MultiPolygon,2154)
);
CREATE TABLE public.zone_a_potentiel_chaud_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.zone_a_potentiel_fort_chaud (
    ogc_fid integer NOT NULL,
    id_zone character varying(254),
    com_arr character varying(254),
    code_com_i character varying(5),
    chauf_mwh numeric(23,15),
    ecs_mwh numeric(23,15),
    bat_imp numeric(10,0),
    part_ter numeric(23,15),
    sol_moy numeric(23,15),
    part_ecs numeric(23,15),
    rdt_ht numeric(23,15),
    rdt_bt numeric(23,15),
    surf_capt_ numeric(23,15),
    surf_cap_1 numeric(23,15),
    surf_sol_8 numeric(23,15),
    surf_sol_1 numeric(23,15),
    dep character varying(254),
    geothermie numeric(1,0),
    geom public.geometry(MultiPolygon,2154)
);
CREATE TABLE public.zone_a_potentiel_fort_chaud_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.zone_a_potentiel_fort_froid (
    ogc_fid integer NOT NULL,
    id_zone character varying(254),
    com_insee character varying(254),
    dist_con character varying(254),
    dens_min character varying(254),
    bes_min character varying(254),
    filere character varying(254),
    froid_mwh numeric(10,0),
    bat_imp numeric(10,0),
    part_ter numeric(23,15),
    dep character varying(254),
    reg character varying(254),
    type_zone character varying(254),
    icu_sensib numeric(10,0),
    icu_val character varying(254),
    geom public.geometry(MultiPolygon,2154)
);
CREATE TABLE public.zone_a_potentiel_fort_froid_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.zone_a_potentiel_froid (
    ogc_fid integer NOT NULL,
    id_zone character varying(254),
    com_insee character varying(254),
    dist_con character varying(254),
    dens_min character varying(254),
    bes_min character varying(254),
    filere character varying(254),
    froid_mwh numeric(10,0),
    bat_imp numeric(10,0),
    part_ter numeric(23,15),
    dep character varying(254),
    reg character varying(254),
    type_zone character varying(254),
    icu_sensib numeric(10,0),
    icu_val character varying(254),
    geom public.geometry(MultiPolygon,2154)
);
CREATE TABLE public.zone_a_potentiel_froid_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.zone_a_urbaniser_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.zone_de_developpement_prioritaire (
    id_fcu smallint NOT NULL,
    geom public.geometry(MultiPolygon,2154),
    "Identifiant reseau" character varying(254),
    communes text[],
    communes_insee text[],
    departement text,
    region text,
    date_actualisation_trace timestamp with time zone,
    reseau_de_chaleur_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    reseau_en_construction_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    geom_update public.geometry
);
CREATE TABLE public.zone_de_developpement_prioritaire_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);
CREATE TABLE public.zones_et_reseaux_en_construction (
    id_fcu smallint NOT NULL,
    geom public.geometry,
    mise_en_service character varying(254),
    gestionnaire character varying(250),
    communes text[],
    is_zone boolean DEFAULT false NOT NULL,
    communes_insee text[],
    departement text,
    region text,
    date_actualisation_trace timestamp with time zone,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    nom_reseau character varying(255),
    geom_update public.geometry
);
CREATE TABLE public.zones_et_reseaux_en_construction_tiles (
    x bigint NOT NULL,
    y bigint NOT NULL,
    z bigint NOT NULL,
    tile bytea NOT NULL
);

CREATE INDEX bdnb_batiments_batiment_groupe_id_idx ON public.bdnb_batiments USING btree (batiment_groupe_id);
CREATE INDEX bdnb_batiments_geom_idx ON public.bdnb_batiments USING gist (geom);
CREATE INDEX bdnb_batiments_id_idx ON public.bdnb_batiments USING btree (id);
CREATE INDEX besoins_en_chaleur_batiments_geom_geom_idx ON public.besoins_en_chaleur_batiments USING gist (geom);
CREATE INDEX donnees_de_consos_geom_idx ON public.donnees_de_consos USING gist (geom);
CREATE INDEX email_templates_user_id_index ON public.email_templates USING btree (user_id);
CREATE INDEX idx_demand_emails_demand_id ON public.demand_emails USING btree (demand_id);
CREATE INDEX idx_demand_emails_email_key ON public.demand_emails USING btree (email_key);
CREATE INDEX idx_demands_date_demande ON public.demands USING btree (((legacy_values ->> 'Date de la demande'::text)));
CREATE INDEX idx_demands_email ON public.demands USING btree (lower((legacy_values ->> 'Mail'::text)));
CREATE INDEX idx_demands_gestionnaires_gin ON public.demands USING gin (((legacy_values -> 'Gestionnaires'::text)));
CREATE INDEX idx_demands_gestionnaires_valides ON public.demands USING btree (((legacy_values ->> 'Gestionnaires validés'::text))) WHERE ((legacy_values ->> 'Gestionnaires validés'::text) = 'true'::text);
CREATE INDEX idx_demands_notification_envoye ON public.demands USING btree (((legacy_values ->> 'Notification envoyé'::text)));
CREATE INDEX idx_demands_relance_a_activer ON public.demands USING btree (((legacy_values ->> 'Relance à activer'::text))) WHERE ((legacy_values ->> 'Relance à activer'::text) = 'true'::text);
CREATE INDEX idx_demands_relance_id ON public.demands USING btree (((legacy_values ->> 'Relance ID'::text))) WHERE ((legacy_values ->> 'Relance ID'::text) IS NOT NULL);
CREATE INDEX idx_demands_status ON public.demands USING btree (((legacy_values ->> 'Status'::text))) WHERE ((legacy_values ->> 'Status'::text) IS NOT NULL);
CREATE INDEX idx_demands_user_id ON public.demands USING btree (user_id);
CREATE INDEX idx_events_author_id ON public.events USING btree (author_id);
CREATE INDEX idx_events_context ON public.events USING btree (context_type, context_id);
CREATE INDEX idx_events_created_at ON public.events USING btree (created_at);
CREATE INDEX idx_events_type ON public.events USING btree (type);
CREATE INDEX idx_ign_communes_unaccent ON public.ign_communes USING gin (public.immutable_unaccent((nom)::text) public.gin_trgm_ops);
CREATE INDEX idx_pro_eligibility_tests_addresses_demand_id ON public.pro_eligibility_tests_addresses USING btree (demand_id);
CREATE INDEX idx_pro_eligibility_tests_addresses_id ON public.pro_eligibility_tests_addresses USING hash (id);
CREATE INDEX idx_pro_eligibility_tests_addresses_test_id ON public.pro_eligibility_tests_addresses USING btree (test_id);
CREATE INDEX idx_pro_eligibility_tests_has_unseen_changes ON public.pro_eligibility_tests USING btree (has_unseen_changes) WHERE (has_unseen_changes = true);
CREATE INDEX idx_tags_reminders_author_id ON public.tags_reminders USING btree (author_id);
CREATE INDEX idx_users_first_name ON public.users USING btree (first_name);
CREATE INDEX idx_users_last_name ON public.users USING btree (last_name);
CREATE INDEX idx_users_optin_at ON public.users USING btree (optin_at);
CREATE INDEX idx_users_structure ON public.users USING btree (structure_name);
CREATE INDEX ign_communes_geom_150m_idx ON public.ign_communes USING gist (geom_150m);
CREATE INDEX ign_communes_geom_geom_idx ON public.ign_communes USING gist (geom);
CREATE INDEX ign_communes_insee_com_idx ON public.ign_communes USING gin (insee_com public.gin_trgm_ops);
CREATE INDEX ign_departements_geom_geom_idx ON public.ign_departements USING gist (geom);
CREATE INDEX ign_regions_geom_geom_idx ON public.ign_regions USING gist (geom);
CREATE INDEX pro_comparateur_configurations_user_id_index ON public.pro_comparateur_configurations USING btree (user_id);
CREATE INDEX quartiers_prioritaires_politique_ville_code_qp_idx ON public.quartiers_prioritaires_politique_ville USING btree (code_qp);
CREATE INDEX quartiers_prioritaires_politique_ville_geom_geom_idx ON public.quartiers_prioritaires_politique_ville USING gist (geom);
CREATE INDEX sidx_reseaux_de_chaleur_geom ON public.reseaux_de_chaleur USING gist (geom);
CREATE INDEX sidx_reseaux_de_froid_geom ON public.reseaux_de_froid USING gist (geom);
CREATE INDEX sidx_zone_de_developpement_prioritaire_new_geom ON public.zone_de_developpement_prioritaire USING gist (geom);
CREATE INDEX sidx_zones_et_reseaux_en_construction_geom ON public.zones_et_reseaux_en_construction USING gist (geom);
CREATE INDEX zone_a_potentiel_chaud_geom_geom_idx ON public.zone_a_potentiel_chaud USING gist (geom);
CREATE INDEX zone_a_potentiel_fort_chaud_geom_geom_idx ON public.zone_a_potentiel_fort_chaud USING gist (geom);
CREATE INDEX zone_a_potentiel_fort_froid_geom_geom_idx ON public.zone_a_potentiel_fort_froid USING gist (geom);
CREATE INDEX zone_a_potentiel_froid_geom_geom_idx ON public.zone_a_potentiel_froid USING gist (geom);
CREATE UNIQUE INDEX tags_name_unicity ON public.tags USING btree (public.immutable_unaccent(lower(TRIM(BOTH FROM name))));

ALTER TABLE ONLY public.api_accounts
    ADD CONSTRAINT api_accounts_pkey PRIMARY KEY (key);
ALTER TABLE ONLY public.assignment_rules
    ADD CONSTRAINT assignment_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.batiments_raccordes_reseaux_chaleur_froid_tiles
    ADD CONSTRAINT batiments_raccordes_reseaux_chaleur_froid_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.bdnb_batiments_tiles
    ADD CONSTRAINT bdnb_batiments_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.besoins_en_chaleur_batiments
    ADD CONSTRAINT besoins_en_chaleur_batiments_pkey PRIMARY KEY (ogc_fid);
ALTER TABLE ONLY public.besoins_en_chaleur_batiments ALTER COLUMN ogc_fid SET DEFAULT nextval('public.besoins_en_chaleur_batiments_ogc_fid_seq'::regclass);
ALTER TABLE ONLY public.besoins_en_chaleur_industrie_communes_tiles
    ADD CONSTRAINT besoins_en_chaleur_industrie_communes_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.besoins_en_chaleur_tiles
    ADD CONSTRAINT besoins_en_chaleur_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.communes
    ADD CONSTRAINT communes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles
    ADD CONSTRAINT communes_fort_potentiel_pour_creation_reseaux_chaleur_tiles_pke PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.demand_emails
    ADD CONSTRAINT demand_emails_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.demands
    ADD CONSTRAINT demands_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.departements
    ADD CONSTRAINT departements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.donnees_de_consos_tiles
    ADD CONSTRAINT donnees_de_consos_tiles_pkey PRIMARY KEY (z, y, x);
ALTER TABLE ONLY public.eligibility_demands
    ADD CONSTRAINT eligibility_demands_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.eligibility_tests
    ADD CONSTRAINT eligibility_tests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.enrr_mobilisables_friches_tiles
    ADD CONSTRAINT enrr_mobilisables_friches_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.enrr_mobilisables_parkings_tiles
    ADD CONSTRAINT enrr_mobilisables_parkings_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.enrr_mobilisables_thalassothermie_tiles
    ADD CONSTRAINT enrr_mobilisables_thalassothermie_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.enrr_mobilisables_tiles
    ADD CONSTRAINT enrr_mobilisables_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.enrr_mobilisables_zones_geothermie_profonde_tiles
    ADD CONSTRAINT enrr_mobilisables_zones_geothermie_profonde_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.epci
    ADD CONSTRAINT epci_pkey PRIMARY KEY (code);
ALTER TABLE ONLY public.ept
    ADD CONSTRAINT ept_pkey PRIMARY KEY (code);
ALTER TABLE ONLY public.etudes_en_cours
    ADD CONSTRAINT etudes_en_cours_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.etudes_en_cours_tiles
    ADD CONSTRAINT etudes_en_cours_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ign_communes
    ADD CONSTRAINT ign_communes_pkey PRIMARY KEY (ogc_fid);
ALTER TABLE ONLY public.ign_communes
    ADD CONSTRAINT ign_communes_unique UNIQUE (insee_com);
ALTER TABLE ONLY public.ign_communes ALTER COLUMN ogc_fid SET DEFAULT nextval('public.ign_communes_ogc_fid_seq'::regclass);
ALTER TABLE ONLY public.ign_departements
    ADD CONSTRAINT ign_departements_pkey PRIMARY KEY (ogc_fid);
ALTER TABLE ONLY public.ign_departements ALTER COLUMN ogc_fid SET DEFAULT nextval('public.ign_departements_ogc_fid_seq'::regclass);
ALTER TABLE ONLY public.ign_regions
    ADD CONSTRAINT ign_regions_pkey PRIMARY KEY (ogc_fid);
ALTER TABLE ONLY public.ign_regions ALTER COLUMN ogc_fid SET DEFAULT nextval('public.ign_regions_ogc_fid_seq'::regclass);
ALTER TABLE ONLY public.installations_geothermie_profonde_tiles
    ADD CONSTRAINT installations_geothermie_profonde_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.installations_geothermie_surface_echangeurs_fermes_tiles
    ADD CONSTRAINT installations_geothermie_surface_echangeurs_fermes_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.installations_geothermie_surface_echangeurs_ouverts_tiles
    ADD CONSTRAINT installations_geothermie_surface_echangeurs_ouverts_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.matomo_stats
    ADD CONSTRAINT matomo_stats_unique UNIQUE (method, stat_key, date, stat_label, period);
ALTER TABLE ONLY public.ouvrages_geothermie_surface_echangeurs_fermes_tiles
    ADD CONSTRAINT ouvrages_geothermie_surface_echangeurs_fermes_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.ouvrages_geothermie_surface_echangeurs_ouverts_tiles
    ADD CONSTRAINT ouvrages_geothermie_surface_echangeurs_ouverts_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.perimetres_geothermie_profonde_tiles
    ADD CONSTRAINT perimetres_geothermie_profonde_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.pro_comparateur_configurations
    ADD CONSTRAINT pro_comparateur_configurations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pro_eligibility_tests
    ADD CONSTRAINT pro_eligibility_tests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pro_eligibility_tests_addresses
    ADD CONSTRAINT pro_eligibility_tests_addresses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pro_eligibility_tests_addresses_tiles
    ADD CONSTRAINT pro_eligibility_tests_addresses_tiles_pkey PRIMARY KEY (z, x, y);
ALTER TABLE ONLY public.quartiers_prioritaires_politique_ville
    ADD CONSTRAINT quartiers_prioritaires_politique_ville_pkey PRIMARY KEY (fid);
ALTER TABLE ONLY public.quartiers_prioritaires_politique_ville ALTER COLUMN fid SET DEFAULT nextval('public.quartiers_prioritaires_politique_ville_fid_seq'::regclass);
ALTER TABLE ONLY public.quartiers_prioritaires_politique_ville_2015_anru_tiles
    ADD CONSTRAINT quartiers_prioritaires_politique_ville_2015_anru_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.quartiers_prioritaires_politique_ville_2024_tiles
    ADD CONSTRAINT quartiers_prioritaires_politique_ville_2024_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.raccordements_tiles
    ADD CONSTRAINT raccordements_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.reseaux_de_chaleur
    ADD CONSTRAINT reseaux_de_chaleur_pkey PRIMARY KEY (id_fcu);
ALTER TABLE ONLY public.reseaux_de_chaleur_tiles
    ADD CONSTRAINT reseaux_de_chaleur_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.reseaux_de_froid
    ADD CONSTRAINT reseaux_de_froid_pkey PRIMARY KEY (id_fcu);
ALTER TABLE ONLY public.reseaux_de_froid_tiles
    ADD CONSTRAINT reseaux_de_froid_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.ressources_geothermales_nappes_tiles
    ADD CONSTRAINT ressources_geothermales_nappes_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tags_reminders
    ADD CONSTRAINT tags_reminders_pkey PRIMARY KEY (tag_id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unicity UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.zone_a_potentiel_chaud
    ADD CONSTRAINT zone_a_potentiel_chaud_pkey PRIMARY KEY (ogc_fid);
ALTER TABLE ONLY public.zone_a_potentiel_chaud ALTER COLUMN ogc_fid SET DEFAULT nextval('public.zone_a_potentiel_chaud_ogc_fid_seq'::regclass);
ALTER TABLE ONLY public.zone_a_potentiel_chaud_tiles
    ADD CONSTRAINT zone_a_potentiel_chaud_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.zone_a_potentiel_fort_chaud
    ADD CONSTRAINT zone_a_potentiel_fort_chaud_pkey PRIMARY KEY (ogc_fid);
ALTER TABLE ONLY public.zone_a_potentiel_fort_chaud ALTER COLUMN ogc_fid SET DEFAULT nextval('public.zone_a_potentiel_fort_chaud_ogc_fid_seq'::regclass);
ALTER TABLE ONLY public.zone_a_potentiel_fort_chaud_tiles
    ADD CONSTRAINT zone_a_potentiel_fort_chaud_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.zone_a_potentiel_fort_froid
    ADD CONSTRAINT zone_a_potentiel_fort_froid_pkey PRIMARY KEY (ogc_fid);
ALTER TABLE ONLY public.zone_a_potentiel_fort_froid ALTER COLUMN ogc_fid SET DEFAULT nextval('public.zone_a_potentiel_fort_froid_ogc_fid_seq'::regclass);
ALTER TABLE ONLY public.zone_a_potentiel_fort_froid_tiles
    ADD CONSTRAINT zone_a_potentiel_fort_froid_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.zone_a_potentiel_froid
    ADD CONSTRAINT zone_a_potentiel_froid_pkey PRIMARY KEY (ogc_fid);
ALTER TABLE ONLY public.zone_a_potentiel_froid ALTER COLUMN ogc_fid SET DEFAULT nextval('public.zone_a_potentiel_froid_ogc_fid_seq'::regclass);
ALTER TABLE ONLY public.zone_a_potentiel_froid_tiles
    ADD CONSTRAINT zone_a_potentiel_froid_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.zone_a_urbaniser_tiles
    ADD CONSTRAINT zone_a_urbaniser_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.zone_de_developpement_prioritaire
    ADD CONSTRAINT zone_de_developpement_prioritaire_new_pkey PRIMARY KEY (id_fcu);
ALTER TABLE ONLY public.zone_de_developpement_prioritaire_tiles
    ADD CONSTRAINT zone_de_developpement_prioritaire_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE ONLY public.zones_et_reseaux_en_construction
    ADD CONSTRAINT zones_et_reseaux_en_construction_pkey PRIMARY KEY (id_fcu);
ALTER TABLE ONLY public.zones_et_reseaux_en_construction_tiles
    ADD CONSTRAINT zones_et_reseaux_en_construction_tiles_pkey PRIMARY KEY (x, y, z);
ALTER TABLE public.pro_eligibility_tests_addresses_tiles CLUSTER ON pro_eligibility_tests_addresses_tiles_pkey;

ALTER TABLE ONLY public.communes
    ADD CONSTRAINT communes_departement_id_foreign FOREIGN KEY (departement_id) REFERENCES public.departements(id);
ALTER TABLE ONLY public.demand_emails
    ADD CONSTRAINT demand_emails_demand_id_fkey FOREIGN KEY (demand_id) REFERENCES public.demands(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.demands
    ADD CONSTRAINT demands_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.eligibility_demands
    ADD CONSTRAINT eligibility_demands_eligibility_test_id_foreign FOREIGN KEY (eligibility_test_id) REFERENCES public.eligibility_tests(id);
ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.pro_comparateur_configurations
    ADD CONSTRAINT pro_comparateur_configurations_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.pro_eligibility_tests
    ADD CONSTRAINT pro_eligibility_tests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.pro_eligibility_tests_addresses
    ADD CONSTRAINT pro_eligibility_tests_addresses_demand_id_fkey FOREIGN KEY (demand_id) REFERENCES public.demands(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.pro_eligibility_tests_addresses
    ADD CONSTRAINT pro_eligibility_tests_addresses_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.pro_eligibility_tests(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tags_reminders
    ADD CONSTRAINT tags_reminders_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.tags_reminders
    ADD CONSTRAINT tags_reminders_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
    `.execute(db);
}

export async function down(): Promise<void> {}
