import { useRouter } from 'next/router';

import SimplePage from '@/components/shared/page/SimplePage';
import Link from '@/components/ui/Link';
import { DocArticle } from '@/modules/doc/client/DocArticle';
import { docPages, docThemes } from '@/modules/doc/doc.config';
import { withAuthentication } from '@/server/authentication';
import cx from '@/utils/cx';

/**
 * Renders one business workflow documentation page with a navigation sidebar grouped by theme.
 */
export default function AdminDocPage() {
  const router = useRouter();
  const currentDoc = docPages.find((docPage) => docPage.slug === router.query.slug);
  if (!currentDoc) {
    return null; // unknown slugs are redirected server-side
  }

  return (
    <SimplePage title={`${currentDoc.title} - Documentation des workflows`} mode="authenticated" layout="center">
      <div className="py-4w flex flex-col md:flex-row gap-8">
        <aside className="md:w-72 shrink-0">
          <nav className="flex flex-col gap-4">
            <Link href="/admin/doc" className="text-sm self-start">
              ← Documentation des workflows
            </Link>
            {docThemes.map((theme) => (
              <div key={theme.id}>
                <div className="text-xs font-bold uppercase text-faded mb-2 tracking-wider px-3">{theme.label}</div>
                <div className="flex flex-col">
                  {docPages
                    .filter((docPage) => docPage.theme === theme.id)
                    .map((docPage) => (
                      <Link
                        key={docPage.slug}
                        href={`/admin/doc/${docPage.slug}`}
                        className={cx(
                          'px-3 py-2 border-l-2 !bg-none',
                          docPage.slug === currentDoc.slug
                            ? 'bg-(--background-action-low-blue-france) border-(--border-active-blue-france) font-medium'
                            : 'border-transparent hover:bg-(--background-alt-grey)'
                        )}
                      >
                        {docPage.title}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <article className="flex-1 min-w-0 max-w-4xl">
          <DocArticle doc={currentDoc} />
        </article>
      </div>
    </SimplePage>
  );
}

export const getServerSideProps = withAuthentication(['admin'], async ({ context }) => {
  const isKnownSlug = docPages.some((docPage) => docPage.slug === context.params?.slug);
  return isKnownSlug ? { props: {} } : { redirect: { destination: '/admin/doc', permanent: false } };
});
