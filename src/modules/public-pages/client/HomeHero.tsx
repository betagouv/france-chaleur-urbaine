import Hero, { HeroContent, HeroSubtitle, HeroTitle } from '@/components/ui/Hero';

import { HomeHeroForm } from './HomeHeroForm';

/**
 * Home page banner: full-bleed photo, title and the address test form in a white card.
 */
export function HomeHero() {
  return (
    <Hero image="/img/banner_accueil.webp" imageType="cover" variant="transparent" size="lg">
      <div className="mx-auto w-full max-w-4xl">
        <HeroTitle>Le chauffage écologique, à prix maîtrisé&nbsp;: testez votre adresse</HeroTitle>
        <HeroSubtitle className="mt-2! text-lg">France Chaleur Urbaine, un service public gratuit, fiable et neutre.</HeroSubtitle>
        <HeroContent className="mt-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <HomeHeroForm />
          </div>
        </HeroContent>
      </div>
    </Hero>
  );
}
