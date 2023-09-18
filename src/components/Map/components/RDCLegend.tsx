import { themeDefHeatNetwork } from 'src/services/Map/businessRules';
import {
  LabelLegendHead,
  LabelLegendInputLabel,
  LabelLegendMarker,
} from './LegendEntry.styled';

const RDCLegend = () => {
  return (
    <>
      <LabelLegendInputLabel>
        <LabelLegendMarker className="legend-classed-heat-network-marker" />
        <LabelLegendHead>Réseaux de chaleur classés</LabelLegendHead>
      </LabelLegendInputLabel>
      <LabelLegendInputLabel>
        <LabelLegendMarker className="legend-heat-network-marker" />
        <LabelLegendHead>Réseaux de chaleur non classés</LabelLegendHead>
      </LabelLegendInputLabel>
      <LabelLegendInputLabel>
        <LabelLegendMarker
          className="legend-marker legend-network-marker fr-ml-1w"
          bgColor={themeDefHeatNetwork.outline.color}
        />
        <LabelLegendMarker
          className="legend-marker legend-network-marker fr-mr-3v"
          bgColor={themeDefHeatNetwork.classed.color}
        />
        <LabelLegendHead>Réseaux de chaleur sans tracé</LabelLegendHead>
      </LabelLegendInputLabel>
    </>
  );
};

export default RDCLegend;
