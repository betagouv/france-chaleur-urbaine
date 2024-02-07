import {
  LabelLegend,
  LabelLegendHead,
  LabelLegendInputLabel,
  LabelLegendMarker,
} from './LegendEntry.styled';

const RDColdLegend = () => {
  return (
    <>
      <LabelLegendInputLabel>
        <LabelLegendMarker className="legend-cold-network-marker" />
        <div>
          <LabelLegendHead>Réseaux de froid</LabelLegendHead>
          <LabelLegend>
            (tracé ou cercle au centre de la commune si tracé non disponible)
          </LabelLegend>
        </div>
      </LabelLegendInputLabel>
    </>
  );
};

export default RDColdLegend;
