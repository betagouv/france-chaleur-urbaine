import {
  LabelLegend,
  LabelLegendHead,
  LabelLegendInputLabel,
  LabelLegendInputLabelWrapper,
  LabelLegendMarker,
  MultipleLabelLegendMarkerWrapper,
} from './LegendEntry.styled';

const FuturRDCLegend = () => {
  return (
    <LabelLegendInputLabelWrapper className="fr-mt-1w">
      <LabelLegendInputLabel>
        <MultipleLabelLegendMarkerWrapper>
          <LabelLegendMarker className="legend-futur-heat-network-marker" />
          <LabelLegendMarker className="legend-futur-heat-network-zone-marker" />
        </MultipleLabelLegendMarkerWrapper>
        <div>
          <LabelLegendHead>
            En Construction ou en cours de mise en service
          </LabelLegendHead>
          <LabelLegend>(tracé ou zone si tracé non disponible)</LabelLegend>
        </div>
      </LabelLegendInputLabel>
    </LabelLegendInputLabelWrapper>
  );
};

export default FuturRDCLegend;
