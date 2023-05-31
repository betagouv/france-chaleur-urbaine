import {
  LabelLegend,
  LabelLegendHead,
  LabelLegendInputLabel,
  LabelLegendMarker,
  MultipleLabelLegendMarkerWrapper,
} from './LegendEntry.styled';

const FuturRDCLegend = () => {
  return (
    <LabelLegendInputLabel>
      <MultipleLabelLegendMarkerWrapper>
        <LabelLegendMarker className="legend-futur-heat-network-marker" />
        <LabelLegendMarker className="legend-futur-heat-network-zone-marker" />
      </MultipleLabelLegendMarkerWrapper>
      <div>
        <LabelLegendHead>Réseaux de chaleur en construction</LabelLegendHead>
        <LabelLegend>(tracé ou zone si tracé non disponible)</LabelLegend>
      </div>
    </LabelLegendInputLabel>
  );
};

export default FuturRDCLegend;
