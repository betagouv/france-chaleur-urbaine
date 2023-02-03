import {
  LabelLegendHead,
  LabelLegendInputLabel,
  LabelLegendInputLabelWrapper,
  LabelLegendMarker,
} from './LegendEntry.styled';

const RDCLegend = () => {
  return (
    <div className="fr-my-1w">
      <LabelLegendInputLabelWrapper>
        <LabelLegendInputLabel>
          <LabelLegendMarker className="legend-classed-heat-network-marker" />
          <LabelLegendHead>Classés</LabelLegendHead>
        </LabelLegendInputLabel>
      </LabelLegendInputLabelWrapper>
      <LabelLegendInputLabelWrapper>
        <LabelLegendInputLabel>
          <LabelLegendMarker className="legend-heat-network-marker" />
          <LabelLegendHead>Non classés</LabelLegendHead>
        </LabelLegendInputLabel>
      </LabelLegendInputLabelWrapper>
      <LabelLegendInputLabelWrapper>
        <LabelLegendInputLabel>
          <LabelLegendMarker className="legend-futur-heat-network-marker" />
          <LabelLegendHead>En construction</LabelLegendHead>
        </LabelLegendInputLabel>
      </LabelLegendInputLabelWrapper>
    </div>
  );
};

export default RDCLegend;
