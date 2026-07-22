import { useQueryState } from 'nuqs';

import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Tile from '@/components/ui/Tile';
import { DocSearch } from '@/modules/doc/client/DocSearch';
import { docPages, docThemes } from '@/modules/doc/doc.config';
import { withAuthentication } from '@/server/authentication';

/**
 * Table of contents of the business workflow documentation for admins, grouped by theme.
 * A full-text search replaces the table of contents while a query is entered.
 */
export default function AdminDocIndexPage() {
  const [query] = useQueryState('q', { defaultValue: '' });
  const isSearching = query.trim().length >= 2;

  return (
    <SimplePage title="Documentation des workflows" mode="authenticated" layout="center">
      <div className="py-4w">
        <Heading as="h1" color="blue-france">
          Documentation des workflows
        </Heading>
        <p className="mb-6 max-w-3xl">
          Ces pages décrivent le fonctionnement métier de l'application : les étapes de chaque parcours, les emails envoyés, les règles de
          gestion et leurs cas particuliers. Elles sont maintenues par l'équipe de développement à chaque évolution du comportement.
        </p>
        <DocSearch />
        <div className={isSearching ? 'hidden' : 'flex flex-col gap-8'}>
          {docThemes.map((theme) => (
            <section key={theme.id}>
              <Heading as="h2" size="h5" color="grey" className="mb-4">
                {theme.label}
              </Heading>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {docPages
                  .filter((docPage) => docPage.theme === theme.id)
                  .map((docPage) => (
                    <Tile
                      key={docPage.slug}
                      title={docPage.title}
                      desc={docPage.description}
                      linkProps={{ href: `/admin/doc/${docPage.slug}` }}
                      orientation="horizontal"
                      enlargeLinkOrButton
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
