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
    </>
  );
};

export default RDCLegend;
