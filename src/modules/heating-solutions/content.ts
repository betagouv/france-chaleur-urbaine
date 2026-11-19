import { CollectiveAirToWaterHeatPumpArticle } from './content/CollectiveAirToWaterHeatPumpArticle';
import { CollectiveBiomassBoilerArticle } from './content/CollectiveBiomassBoilerArticle';
import { CollectiveGeothermalHeatPumpArticle } from './content/CollectiveGeothermalHeatPumpArticle';
import { CollectiveHotWaterHeatPumpArticle } from './content/CollectiveHotWaterHeatPumpArticle';
import { CollectiveHybridHeatPumpArticle } from './content/CollectiveHybridHeatPumpArticle';
import { CollectiveSolarHotWaterArticle } from './content/CollectiveSolarHotWaterArticle';
import { CombinedSolarSystemArticle } from './content/CombinedSolarSystemArticle';
import { HeatNetworkArticle } from './content/HeatNetworkArticle';
import { IndividualAirToAirHeatPumpArticle } from './content/IndividualAirToAirHeatPumpArticle';
import { IndividualAirToWaterHeatPumpArticle } from './content/IndividualAirToWaterHeatPumpArticle';
import { IndividualBiomassBoilerArticle } from './content/IndividualBiomassBoilerArticle';
import { IndividualGeothermalHeatPumpArticle } from './content/IndividualGeothermalHeatPumpArticle';
import { IndividualSolarHotWaterArticle } from './content/IndividualSolarHotWaterArticle';
import { ThermodynamicWaterHeaterArticle } from './content/ThermodynamicWaterHeaterArticle';
import { WoodStoveArticle } from './content/WoodStoveArticle';

export const heatingSolutionContent = {
  'chaudiere-biomasse-collective': CollectiveBiomassBoilerArticle,
  'chaudiere-biomasse-individuelle': IndividualBiomassBoilerArticle,
  'chauffe-eau-thermodynamique': ThermodynamicWaterHeaterArticle,
  'pac-air-air-individuelle': IndividualAirToAirHeatPumpArticle,
  'pac-air-eau-collective': CollectiveAirToWaterHeatPumpArticle,
  'pac-air-eau-collective-eau-chaude-sanitaire': CollectiveHotWaterHeatPumpArticle,
  'pac-air-eau-hybride-gaz-collective': CollectiveHybridHeatPumpArticle,
  'pac-air-eau-individuelle': IndividualAirToWaterHeatPumpArticle,
  'pac-geothermique-collective': CollectiveGeothermalHeatPumpArticle,
  'pac-geothermique-individuelle': IndividualGeothermalHeatPumpArticle,
  'poele-insert-bois': WoodStoveArticle,
  'reseau-de-chaleur': HeatNetworkArticle,
  'solaire-thermique-eau-chaude-collective': CollectiveSolarHotWaterArticle,
  'solaire-thermique-eau-chaude-maison': IndividualSolarHotWaterArticle,
  'systeme-solaire-combine': CombinedSolarSystemArticle,
};
