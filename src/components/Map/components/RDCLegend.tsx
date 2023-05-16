import { Title } from './DPELegend.style';
import {
  LabelLegendHead,
  LabelLegendInputLabel,
  LabelLegendInputLabelWrapper,
  LabelLegendMarker,
} from './LegendEntry.styled';

const RDCLegend = () => {
  return (
    <>
      <Title>Cliquer sur un réseau pour connaître ses caractéristiques</Title>
      <div className="fr-m-1w">
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
      </div>
    </>
  );
};

export default RDCLegend;
