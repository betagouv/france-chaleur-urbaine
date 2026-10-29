import { HeroContent, HeroSubtitle, HeroTitle } from '@/components/ui/Hero';

import { HomeHeroForm } from './HomeHeroForm';

/**
 * Home page banner: full-bleed photo, title and the address test form in a white card.
 */
export function HomeHero() {
  return (
    <div className="fr-p-1w md:fr-p-5w w-full bg-[#C3E4E2] bg-[url('/img/banner_simulateur.webp')] bg-no-repeat bg-cover bg-left-center">
      <div className="mx-auto w-full max-w-4xl">
        <HeroTitle>
          <span className="text-white">
            Le chauffage écologique, à prix maîtrisé :<br /> testez votre adresse
          </span>
        </HeroTitle>
        <HeroSubtitle className="mt-2! text-lg text-white">
          France Chaleur Urbaine, un service public gratuit, fiable et neutre.
        </HeroSubtitle>
        <HeroContent className="mt-6">
          <HomeHeroForm />
        </HeroContent>
      </div>
    </div>
  );
}
