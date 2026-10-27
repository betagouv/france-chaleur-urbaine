import Hero, { HeroContent, HeroSubtitle, HeroTitle } from '@/components/ui/Hero';

import { HomeHeroForm } from './HomeHeroForm';

/**
 * Home page banner: full-bleed photo, title and the address test form in a white card.
 */
export function HomeHero() {
  return (
    // min height = banner with the comparator fields unfolded, so the cover photo does not jump when they appear
    <Hero
      image="/img/bandeau_accueil.webp"
      imageType="cover"
      variant="transparent"
      size="lg"
      className="lg:min-h-[758px] 2xl:min-h-[790px]"
    >
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
