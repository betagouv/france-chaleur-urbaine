import { HighlightCard } from '@components/adventage/adventage.style';
type highlight = {
  title: string;
  subTitle: string;
  description: string;
  icon: string;
  altIcon: string;
};
function Highlight({ title, subTitle, description, icon, altIcon }: highlight) {
  return (
    <HighlightCard>
      <img src={icon} alt={altIcon} />
      <div className="fr-highlight fr-mx-4w fr-my-2w">
        <h4>{title}</h4>
        <strong>{subTitle}</strong>
        <p>{description}</p>
      </div>
    </HighlightCard>
  );
}

export default Highlight;
