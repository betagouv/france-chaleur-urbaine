type ResourceSection = {
  children?: React.ReactNode[];
  title: string;
};

function ResourceSection({ title, children }: ResourceSection) {
  return (
    <div className="fr-container fr-my-5w">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <h2>{title}</h2>
        </div>
        {children?.map((child: React.ReactNode, index: number) => (
          <div key={index} className="fr-col-lg-4 fr-col-sm-6">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResourceSection;
