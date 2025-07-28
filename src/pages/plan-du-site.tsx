import { type NextPage } from 'next';
import Link from 'next/link';

import SimplePage, { publicNavigationMenu } from '@/components/shared/page/SimplePage';

const PlanDuSite: NextPage = () => {
  return (
    <SimplePage title="Plan du site" boxed>
      <h1>Plan du site</h1>
      <nav aria-label="Plan du site">
        <ul className="list-disc pl-6">
          {publicNavigationMenu.map(({ text, linkProps, menuLinks }) => (
            <li key={(linkProps?.href as string) ?? text}>
              <Link href={linkProps?.href ?? '#'}>{text}</Link>

              {menuLinks && menuLinks.length > 0 && (
                <ul className="list-disc pl-6">
                  {(menuLinks || []).map((subItem) => (
                    <li key={(subItem?.linkProps?.href as string) ?? subItem.text}>
                      <Link href={subItem?.linkProps?.href ?? '#'}>{subItem.text}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </SimplePage>
  );
};

export default PlanDuSite;
