import React from 'react';

function ResourceSection({
  title,
  children,
  columnNumberDesktop,
  columnNumberResponsive,
}) {
  return (
    <div className="fr-container fr-container--fluid fr-my-8w">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <h3>{title}</h3>
        </div>
        {children?.map((child, index) => (
          <div
            key={index}
            className={`fr-col-lg-${columnNumberDesktop} fr-col-md-${columnNumberResponsive}`}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResourceSection;
