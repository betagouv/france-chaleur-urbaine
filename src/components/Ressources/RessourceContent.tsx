import { Document } from './Documents.config';
import { Description, Title } from './RessourceContent.styles';

const RessourceContent = ({ content }: { content: Document }) => {
  return content ? (
    <>
      <Title>{content.title}</Title>
      <Description>{content.description}</Description>
      {content.content}
    </>
  ) : null;
};

export default RessourceContent;
