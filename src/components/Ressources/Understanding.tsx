import Card from '@/components/ui/Card';

import { type Document, understandings } from './config';

const Understanding = ({ cards }: { cards?: Record<string, Document> }) => {
  return (
    <div className="flex gap-4">
      {Object.entries(cards || understandings).map(([key, understanding]) => (
        <Card
          className="flex-1"
          key={`understanding-${key}`}
          title={cards && understanding.altTitle ? understanding.altTitle : understanding.title}
          desc={understanding.description}
          postHogEventKey="home:article_clicked"
          postHogEventProps={{ element_name: key }}
          linkProps={{
            href: `/ressources/${key}#contenu`,
          }}
          border
          enlargeLink
          size="sm"
          titleAs="h3"
        />
      ))}
    </div>
  );
};

export default Understanding;
