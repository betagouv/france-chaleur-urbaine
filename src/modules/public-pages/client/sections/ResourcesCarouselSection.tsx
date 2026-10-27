import Carousel from '@/components/ui/Carousel';
import Link from '@/components/ui/Link';
import Section, { type SectionProps } from '@/components/ui/Section';

import { usePublicPage } from '../PublicPageContext';
import { publicPageResources } from '../resources';
import { CardFrame } from '../ui/CardFrame';
import { CardImage } from '../ui/CardImage';
import { SectionIntro } from '../ui/SectionIntro';

type ResourcesCarouselSectionProps = Pick<SectionProps, 'variant'>;

/**
 * "Ressources pédagogiques" section: a carousel of articles to read before starting a project.
 */
export function ResourcesCarouselSection({ variant }: ResourcesCarouselSectionProps) {
  const { source } = usePublicPage();

  return (
    <Section variant={variant} size="compact">
      <SectionIntro eyebrow="Ressources pédagogiques" title="Tout comprendre avant de se lancer" />
      <Carousel
        items={publicPageResources}
        getItemKey={(resource) => resource.slug}
        previousLabel="Voir l’article précédent"
        nextLabel="Voir l’article suivant"
        renderItem={(resource) => (
          <CardFrame className="flex h-full flex-col justify-between">
            <div>
              {resource.image && <CardImage src={`/img/${resource.image}`} alt="" />}
              <h3 className="fr-h4">{resource.title}</h3>
              <p className="mb-0 line-clamp-2 max-h-12 leading-6">{resource.description}</p>
            </div>
            <Link
              postHogEventKey={`${source}:article_clicked`}
              postHogEventProps={{ article_title: resource.title, element_name: resource.slug }}
              variant="secondary"
              className="mt-6"
              href={`/ressources/${resource.slug}`}
              isExternal
            >
              Lire l’article
            </Link>
          </CardFrame>
        )}
      />
    </Section>
  );
}
