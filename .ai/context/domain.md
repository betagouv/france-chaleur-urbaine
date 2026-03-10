# Domain

## What this application does

France Chaleur Urbaine is a French government platform (beta.gouv.fr) that accelerates the adoption of district heating networks (réseaux de chaleur urbains). District heating delivers heat from a centralized plant to buildings through underground pipes, often using renewable energy sources.

The platform serves three main audiences:
1. **Citizens (particuliers)** — test if their address is near a heating network and request a connection.
2. **Professionals (professionnels)** — bulk-test address eligibility for building portfolios.
3. **Network operators (gestionnaires)** — manage connection demands, track network data.
4. **Administrators** — manage users, networks, jobs, assignment rules.

## Glossary

| French term | Code entity | Definition |
|------------|-------------|-----------|
| Réseau de chaleur | `reseaux_de_chaleur` | A district heating network: underground pipes delivering heat to buildings |
| Réseau de froid | `reseaux_de_froid` | A district cooling network |
| Gestionnaire | `gestionnaire` (user role) | Network operator (e.g., ENGIE, Dalkia) who manages a heating network |
| Demande | `demands` | A connection request from a citizen or professional |
| Raccordement | — | The act of connecting a building to a heating network |
| Éligibilité | eligibility test | Whether an address is close enough to an existing network |
| Tracé | `has_trace`, `geom` | The geographic route/path of a network's pipes |
| PDP | `zone_de_developpement_prioritaire` | Priority Development Perimeter: zone where connection to the network may be mandatory |
| Réseau classé | `reseaux_classes` | A "classified" network with legal connection obligations in its zone |
| EnR&R | `Taux EnR&R` | Percentage of renewable and recovered energy in the network's heat mix |
| BDNB | `bdnb_batiments` | Base de Données Nationale des Bâtiments: national building database |
| BAN | `ban` module | Base Adresse Nationale: national address database (geocoding) |
| DPE | `Moyenne-annee-DPE` | Diagnostic de Performance Énergétique: building energy rating |
| Commune | `ign_communes` | French municipality |
| EPCI | `ign_epci` | Intercommunal cooperation establishment (group of municipalities) |
| Publicodes | publicodes library | French rule engine for regulatory/financial calculations |

## Domain rules

- A demand can be submitted by anyone (logged in or anonymous via form).
- Demands are automatically matched to the nearest network based on address geolocation.
- Gestionnaires only see demands related to their assigned networks.
- Admin can assign demands to gestionnaires via assignment rules (pattern-based).
- Eligibility is determined by geographic proximity: distance from address to nearest network trace.
- Networks have an energy mix (solar, geothermal, biomass, gas, etc.) and an EnR&R percentage.
- Classified networks (`reseaux_classes`) have PDPs where buildings may be legally required to connect.
- Network data includes technical specs: length, capacity (MW), production (MWh), delivery by sector.
- Invoice/cost comparisons use Publicodes rules (`@betagouv/france-chaleur-urbaine-publicodes`).

## User roles and permissions

| Role | Can do | Cannot do |
|------|--------|----------|
| Admin | Everything: manage users, networks, demands, jobs, impersonate users | — |
| Gestionnaire | View/manage demands for assigned networks, update network data | Access other networks' demands, manage users |
| Professionnel | Submit demands, run bulk eligibility tests, view own demands | Access admin features, manage other users |
| Particulier | Submit single demand, test eligibility | Bulk testing, dashboard features |
| Demo | Pseudo-anonymized UI view (admin previews the app as anonymous user) | Real data access, admin features |

## Key workflows

**Eligibility test (citizen):**
1. Citizen enters address on `/carte` or homepage.
2. System geocodes via BAN API.
3. PostGIS calculates distance to nearest network trace.
4. Result: eligible (close to network) or not, with network details.
5. Citizen can submit a connection demand (form → `demands` table).

**Demand lifecycle:**
1. Citizen submits demand (status: pending).
2. System matches demand to nearest network.
3. Assignment rules route demand to appropriate gestionnaire.
4. Gestionnaire contacts citizen (status: contacted, email tracked in `demand_emails`).
5. Demand progresses through status updates until resolved.
6. Admin can monitor all demands and reassign.

**Bulk eligibility (professional):**
1. Professional uploads CSV/Excel with addresses.
2. System creates a `pro_eligibility_tests` job.
3. Job queue processes: geocode each address, calculate proximity.
4. Results stored in `pro_eligibility_tests_addresses`.
5. Professional can download results with eligibility status per address.
6. Change notifications sent when network data updates affect results.

**Tile generation:**
1. Admin or cron triggers tile build job.
2. `tiles` module extracts data from PostGIS.
3. Tippecanoe generates vector tiles.
4. Tiles served to MapLibre GL frontend.
5. 30+ layers available (networks, buildings, potential zones, etc.).

## External integrations

| Service | Purpose | Code location |
|---------|---------|---------------|
| BAN (Base Adresse Nationale) | Address geocoding/autocomplete | `src/modules/ban/` |
| BDNB (Base de Données Nationale des Bâtiments) | Building energy data | `src/modules/bdnb/` |
| data.gouv.fr | Open data publishing (API registration) | `src/modules/opendata/` |
| Airtable | Legacy CRM data sync (demands, networks) | `src/server/db/airtable.ts` |
| Pipedrive | Sales/deal tracking (iframe stats) | `src/server/services/` |
| Matomo | Web analytics | `src/modules/analytics/` |
| PostHog | Product analytics | PostHog JS SDK |
| Sentry | Error tracking | Sentry SDK |
| SMTP (Mailpit local) | Email sending | `src/modules/email/` |

## Geographic data context

- All spatial data stored in PostGIS with Lambert 93 (EPSG:2154) projection.
- WGS84 (EPSG:4326) used for API input/output (GPS coordinates).
- GDAL/ogr2ogr used for geographic file conversions (shapefiles → GeoJSON → PostGIS).
- Tippecanoe generates vector tiles for performant map rendering.
- Map supports 30+ toggleable layers (networks, buildings, potential zones, etc.).
