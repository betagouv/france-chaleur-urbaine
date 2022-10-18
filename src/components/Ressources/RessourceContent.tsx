import { Document } from './config';
import { Container, Description, Title } from './RessourceContent.styles';

const RessourceContent = ({ content }: { content: Document }) => {
  return content ? (
    <Container>
      <Title>{content.title}</Title>
      <Description>{content.description}</Description>
      {content.content}
    </Container>
  ) : null;
};

export default RessourceContent;
