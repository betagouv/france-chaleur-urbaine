import MarkdownWrapper from '@components/MarkdownWrapper';
import { useState } from 'react';
import { BodyAccordionWrapper, SectionTitle } from './Accordions.style';

type accordionData = {
  label: string;
  body: string;
};

function Accordions({ data = [] }: { data: accordionData[] }) {
  const [activeMenu, setActiveMenu] = useState(-1);

  const setAria = (activeMenu: boolean, name: string) => ({
    'aria-expanded': activeMenu,
    'aria-controls': name,
  });

  return (
    <>
      <SectionTitle>Foire aux questions</SectionTitle>
      <ul className="fr-accordions-group">
        {data.map(({ label, body }, i) => (
          <li key={i}>
            <section className="fr-accordion">
              <h3 className="fr-accordion__title">
                <button
                  className="fr-accordion__btn"
                  onClick={() => setActiveMenu(activeMenu === i ? -1 : i)}
                  {...setAria(activeMenu === i, `accordion-${i}`)}
                >
                  {label}
                </button>
              </h3>
              <BodyAccordionWrapper
                activeMenu={activeMenu === i}
                id={`accordion-${i}`}
              >
                <MarkdownWrapper value={body} />
              </BodyAccordionWrapper>
            </section>
          </li>
        ))}
      </ul>
    </>
  );
}

export default Accordions;
