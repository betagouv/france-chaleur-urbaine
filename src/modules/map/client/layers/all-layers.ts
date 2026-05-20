import type { MapSourceLayersSpecification } from '../core/common';
import { adressesEligiblesLayersSpec } from './specs/adressesEligibles';
import { batimentsRaccordesReseauxChaleurFroidLayersSpec } from './specs/batimentsRaccordesReseauxChaleurFroid';
import { caracteristiquesBatimentsLayersSpec } from './specs/bdnb/caracteristiquesBatiments';
import { typeChauffageBatimentsCollectifsLayersSpec } from './specs/bdnb/typeChauffageBatimentsCollectifs';
import { besoinsEnChaleurLayersSpec } from './specs/besoinsEnChaleur';
import { besoinsEnChaleurIndustrieCommunesLayersSpec } from './specs/besoinsEnChaleurIndustrieCommunes';
import { communesFortPotentielPourCreationReseauxChaleurLayersSpec } from './specs/communesFortPotentielPourCreationReseauxChaleur';
import { consommationsGazLayersSpec } from './specs/consommationsGaz';
import { customGeojsonLayersSpec } from './specs/customGeojson';
import { demandesEligibiliteLayersSpec } from './specs/demandesEligibilite';
import { enrrMobilisablesChaleurFataleLayersSpec } from './specs/enrr-mobilisables/chaleurFatale';
import { enrrMobilisablesFrichesLayersSpec } from './specs/enrr-mobilisables/friches';
import { enrrMobilisablesParkingsLayersSpec } from './specs/enrr-mobilisables/parkings';
import { enrrMobilisablesThalassothermieLayersSpec } from './specs/enrr-mobilisables/thalassothermie';
import { enrrMobilisablesZonesGeothermieProfondeLayersSpec } from './specs/enrr-mobilisables/zonesGeothermieProfonde';
import { etudesEnCoursLayersSpec } from './specs/etudesEnCours';
import { geomUpdateLayersSpec } from './specs/geomUpdate';
import { installationsGeothermieProfondeLayersSpec } from './specs/geothermie/installationsGeothermieProfonde';
import { installationsGeothermieSurfaceLayersSpec } from './specs/geothermie/installationsGeothermieSurface';
import { ouvragesGeothermieSurfaceLayersSpec } from './specs/geothermie/ouvragesGeothermieSurface';
import { perimetresGeothermieProfondeLayersSpec } from './specs/geothermie/perimetresGeothermieProfonde';
import { perimetresDeDeveloppementPrioritaireLayersSpec } from './specs/perimetresDeDeveloppementPrioritaire';
import { quartiersPrioritairesPolitiqueVilleLayersSpec } from './specs/quartiersPrioritairesPolitiqueVille';
import { reseauxDeChaleurLayersSpec } from './specs/reseauxDeChaleur';
import { reseauxDeFroidLayersSpec } from './specs/reseauxDeFroid';
import { reseauxEnConstructionLayersSpec } from './specs/reseauxEnConstruction';
import { ressourcesGeothermalesNappesLayersSpec } from './specs/ressourcesGeothermalesNappes';
import { testsAdressesLayersSpec } from './specs/testsAdresses';
import { buildingsDataExtractionLayersSpec } from './specs/tools/buildingsDataExtraction';
import { distancesMeasurementLayersSpec } from './specs/tools/distancesMeasurement';
import { linearHeatDensityLayersSpec } from './specs/tools/linearHeatDensity';
import { zonesAUrbaniserLayersSpec } from './specs/zonesAUrbaniser';
import { zonesPotentielChaudLayersSpec } from './specs/zonesPotentielChaud';
import { zonesPotentielFroidLayersSpec } from './specs/zonesPotentielFroid';

/** Built-in layer specs in MapLibre paint order (last-rendered on top). */
export const allLayers = [
  ...customGeojsonLayersSpec,
  ...geomUpdateLayersSpec,
  ...enrrMobilisablesZonesGeothermieProfondeLayersSpec,
  ...ressourcesGeothermalesNappesLayersSpec,
  ...zonesPotentielChaudLayersSpec,
  ...zonesPotentielFroidLayersSpec,
  ...zonesAUrbaniserLayersSpec,
  ...caracteristiquesBatimentsLayersSpec,
  ...besoinsEnChaleurIndustrieCommunesLayersSpec,
  ...quartiersPrioritairesPolitiqueVilleLayersSpec,
  ...perimetresDeDeveloppementPrioritaireLayersSpec,
  ...perimetresGeothermieProfondeLayersSpec,
  ...reseauxEnConstructionLayersSpec,
  ...besoinsEnChaleurLayersSpec,
  ...enrrMobilisablesFrichesLayersSpec,
  ...enrrMobilisablesParkingsLayersSpec,
  ...enrrMobilisablesThalassothermieLayersSpec,
  ...batimentsRaccordesReseauxChaleurFroidLayersSpec,
  ...typeChauffageBatimentsCollectifsLayersSpec,
  ...consommationsGazLayersSpec,
  ...demandesEligibiliteLayersSpec,
  ...testsAdressesLayersSpec,
  ...reseauxDeChaleurLayersSpec,
  ...reseauxDeFroidLayersSpec,
  ...enrrMobilisablesChaleurFataleLayersSpec,
  ...ouvragesGeothermieSurfaceLayersSpec,
  ...installationsGeothermieSurfaceLayersSpec,
  ...installationsGeothermieProfondeLayersSpec,
  ...communesFortPotentielPourCreationReseauxChaleurLayersSpec,
  ...etudesEnCoursLayersSpec,
  ...adressesEligiblesLayersSpec,
  // Tools — appended last so they paint above the data layers.
  ...distancesMeasurementLayersSpec,
  ...linearHeatDensityLayersSpec,
  ...buildingsDataExtractionLayersSpec,
] as const satisfies readonly MapSourceLayersSpecification[];

export type LayerId = (typeof allLayers)[number]['layers'][number]['id'];
