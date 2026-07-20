import type { MDXComponents } from 'mdx/types';

import type { DocPage } from '../doc.config';
import { CronsInventory } from './inventories/CronsInventory';
import { DemandStatuses } from './inventories/DemandStatuses';
import { EmailsInventory } from './inventories/EmailsInventory';
import { EventsInventory } from './inventories/EventsInventory';
import { FcrDemandStatuses } from './inventories/FcrDemandStatuses';
import { tableClasses } from './inventories/table-classes';
import { Mermaid } from './Mermaid';
import { Rule } from './Rule';

type DocArticleProps = {
  doc: DocPage;
};

/**
 * Renders a workflow documentation page from its MDX content, exposing the
 * Mermaid component, the generated inventories and styled tables to the MDX.
 */
export function DocArticle({ doc }: DocArticleProps) {
  return <doc.Content components={mdxComponents} />;
}

const mdxComponents: MDXComponents = {
  CronsInventory,
  DemandStatuses,
  EmailsInventory,
  EventsInventory,
  FcrDemandStatuses,
  Mermaid,
  Rule,
  table: (props) => (
    <div className={tableClasses.wrapper}>
      <table className={tableClasses.table} {...props} />
    </div>
  ),
  td: (props) => <td className={tableClasses.cell} {...props} />,
  th: (props) => <th className={tableClasses.header} {...props} />,
};
