import cx from '@/utils/cx';

import type { NewsletterLinkSource } from './constants';
import NewsletterLink from './NewsletterLink';

const variantClassNames = {
  accent: 'bg-accent text-white [&_h2]:text-white',
  default: '',
} as const;

type NewsletterFollowProps = {
  title?: string;
  description: string;
  buttonLabel?: string;
  source: NewsletterLinkSource;
  variant?: keyof typeof variantClassNames;
  className?: string;
};

/**
 * DSFR "Lettre d'information" block, button-only variant: no email field, the button leads to the ADEME signup page.
 */
function NewsletterFollow({
  title,
  description,
  buttonLabel = "S'abonner à la newsletter",
  source,
  variant = 'default',
  className,
}: NewsletterFollowProps) {
  return (
    <div className={cx('fr-follow', variantClassNames[variant], className)}>
      <div className="fr-container">
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <div className="fr-follow__newsletter">
              <div>
                {title && <h2 className="fr-h5">{title}</h2>}
                <p className="fr-text--sm">{description}</p>
              </div>
              <div>
                <ul className="fr-btns-group fr-btns-group--inline-md">
                  <li>
                    <NewsletterLink source={source} variant="primary">
                      {buttonLabel}
                    </NewsletterLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsletterFollow;
