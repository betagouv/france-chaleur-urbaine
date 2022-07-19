import MarkdownWrapper from '@components/MarkdownWrapper';
import { Accordion, AccordionItem } from '@dataesr/react-dsfr';
import { SectionTitle } from './Accordions.style';

function Accordions({
  data = [],
}: {
  data: {
    label: string;
    body: string;
  }[];
}) {
  return (
    <>
      <SectionTitle>Foire aux questions</SectionTitle>

      <Accordion>
        {data.map((item) => (
          <AccordionItem key={item.label} title={item.label}>
            <MarkdownWrapper value={item.body} />
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}

export default Accordions;
