import Heading from '@/components/ui/Heading';

import type { Document } from './config';

const RessourceContent = ({ content }: { content: Document }) => {
  return content ? (
    <article className="mt-8 md:mt-0">
      <Heading as="h1">{content.title}</Heading>
      <div className="my-8 [&_li]:cursor-pointer">{content.description}</div>
      {content.content}
    </article>
  ) : null;
};

export default RessourceContent;
