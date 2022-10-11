import { CardDescription, CardTitle, Icon } from '@dataesr/react-dsfr';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { documentsData } from './Documents.config';
import { Arrow, Container, Document, DocumentsCard } from './Documents.styles';

const Documents = () => {
  const [firstCard, setFirstCard] = useState(0);

  const setNextCard = useCallback(
    (value: number) => {
      setFirstCard(
        (firstCard + value + documentsData.length) % documentsData.length
      );
    },
    [firstCard]
  );
  return (
    <Container>
      <Arrow onClick={() => setNextCard(-1)}>
        <Icon name="ri-arrow-left-line" size="2x" />
      </Arrow>
      <DocumentsCard>
        {documentsData.map((document, index) => (
          <Document
            key={document.title}
            hide={index < firstCard}
            asLink={<Link href={document.link} />}
          >
            <CardTitle>{document.title}</CardTitle>
            <CardDescription>{document.description}</CardDescription>
          </Document>
        ))}
      </DocumentsCard>
      <Arrow onClick={() => setNextCard(1)}>
        <Icon name="ri-arrow-right-line" size="2x" />
      </Arrow>
    </Container>
  );
};

export default Documents;
