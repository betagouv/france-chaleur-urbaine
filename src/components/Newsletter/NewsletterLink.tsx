import Link from '@/components/ui/Link';

import { getNewsletterLinkTitle, NEWSLETTER_SIGNUP_URL, type NewsletterLinkSource } from './constants';

type NewsletterLinkProps = {
  children: string;
  source: NewsletterLinkSource;
  variant?: 'link' | 'primary' | 'secondary';
  className?: string;
};

/**
 * Link to the ADEME newsletter signup page, opened in a new tab and tracked in PostHog with its placement.
 */
function NewsletterLink({ children, source, variant, className }: NewsletterLinkProps) {
  return (
    <Link
      href={NEWSLETTER_SIGNUP_URL}
      isExternal
      title={getNewsletterLinkTitle(children)}
      variant={variant}
      className={className}
      postHogEventKey="newsletter:signup_link_clicked"
      postHogEventProps={{ source }}
    >
      {children}
    </Link>
  );
}

export default NewsletterLink;
