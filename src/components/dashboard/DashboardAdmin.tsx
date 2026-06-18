import { adminPageGroups, adminPages } from '@/components/Admin/adminPages';
import Heading from '@/components/ui/Heading';
import Tile from '@/components/ui/Tile';

export default function DashboardAdmin() {
  return (
    <div className="flex flex-col gap-8 mb-5">
      {adminPageGroups.map(({ id, label }) => {
        const pages = adminPages.filter((page) => page.group === id);
        if (pages.length === 0) {
          return null;
        }
        return (
          <section key={id}>
            <Heading as="h2" size="h5" color="grey" className="mb-4">
              {label}
            </Heading>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {pages.map((page) => (
                <Tile
                  key={page.href}
                  title={page.label}
                  desc={page.desc}
                  linkProps={{ href: page.href }}
                  orientation="horizontal"
                  enlargeLinkOrButton
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
