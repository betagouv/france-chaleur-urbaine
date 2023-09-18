import {
  LabelLegend,
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
        <div>
          <LabelLegendHead>Réseaux de chaleur non classés</LabelLegendHead>
          <LabelLegend>(tracé ou point si tracé non disponible)</LabelLegend>
        </div>
      </LabelLegendInputLabel>
    </>
  );
};

export default RDCLegend;
