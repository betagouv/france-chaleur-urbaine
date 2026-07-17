import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { isValidElement, useEffect, useRef } from 'react';

import { issues, otherHeatingSystem, understandings } from '@/components/Ressources/config';
import SimplePage from '@/components/shared/page/SimplePage';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Carousel from '@/components/ui/Carousel';
import Link from '@/components/ui/Link';
import Notice from '@/components/ui/Notice';
import { trackPostHogEvent } from '@/modules/analytics/client';
import ChoixChauffageForm from '@/modules/chaleur-renouvelable/client/ChoixChauffageForm';

const BENEFITS = [
  {
    description: 'Prix du gaz et fioul : instables. Énergies renouvelables locales : stables sur le long terme.',
    icon: 'icon-money.png',
    title: 'Protégez-vous des hausses du gaz ou du fioul',
  },
  {
    description: "MaPrimeRénov', CEE, aides locales : des financements publics couvrant une grande partie des travaux.",
    icon: 'icon-immeuble.png',
    title: 'Bénéficiez d’aides pour financer votre projet',
  },
  {
    description: 'Une meilleure classe DPE protège votre bien immobilier des décotes et le maintient compétitif sur le marché.',
    icon: 'icon-graph.png',
    title: "Améliorez l'étiquette DPE de votre bien",
  },
  {
    description:
      'Passer à un système de chauffage écologique peut diviser par deux les émissions de votre chauffage : un geste concret pour la transition écologique.',
    icon: 'icon-feuille.png',
    title: 'Réduisez vos émissions de CO2',
  },
  {
    description: 'Chaleur homogène en hiver, fraîcheur possible en été avec certaines solutions réversibles.',
    icon: 'icon-thermometre.png',
    title: 'Gagnez en confort toute l’année',
  },
  {
    description: 'Les systèmes de chauffage écologiques sont souvent moins chers et plus efficaces que le gaz ou le fioul.',
    icon: 'icon-money.png',
    title: 'Réduisez vos factures d’énergie',
  },
];

const TEMOIGNAGES = [
  {
    image: 'coachcopro-biomasse.webp',
    link: 'https://www.coachcopro.com/projets-realises/87-boulevard-suchet-75016-paris',
    nbLogement: 34,
    title: 'Une expérience de chaufferie biomasse réussie',
    year: 1930,
  },
  {
    image: 'coachcopro-pac.webp',
    link: 'https://www.coachcopro.com/projets-realises/50-avenue-jean-jaures-75019-paris',
    nbLogement: 41,
    title: 'Installation d’une PAC pour l’eau chaude sanitaire',
    year: 1979,
  },
  {
    image: 'coachcopro-rcu.webp',
    link: 'https://www.coachcopro.com/projets-realises/25-rue-de-l-ukraine-31100-toulouse',
    nbLogement: 136,
    title: 'Raccordement au réseau de chaleur urbain à Toulouse',
    year: 1975,
  },
  {
    image: 'temoignage_geothermie.webp',
    link: 'https://www.calameo.com/read/007297783665ca6300ea6?authid=UPbbt4BqJjfT',
    nbLogement: 39,
    title: "Installation d'une PAC eau / eau sur sonde géothermique",
    year: 2018,
  },
];

const STEPS = [
  { text: 'Je découvre les solutions<br /> adaptées à mon bâtiment', title: 'Je simule' },
  { text: "Un conseiller m'aide gratuitement à affiner mon projet", title: 'Je suis accompagné' },
  { text: 'Un DPE ou audit énergétique précise les travaux à envisager', title: 'Je réalise un audit' },
  { text: "Je monte mon dossier MaPrimeRénov', CEE ...", title: 'Je mobilise les aides' },
  { text: 'Vote en<br /> assemblée générale', title: 'Ma copropriété décide' },
  { text: 'Les travaux sont réalisés par un professionnel', title: 'Je fais installer' },
  { text: 'D’un chauffage confortable, écologique et économique', title: 'Je profite' },
];

const FAQS = [
  {
    answer: `Un <strong>réseau de chaleur</strong> est un système qui produit la chaleur de manière centralisée puis la distribue à plusieurs bâtiments grâce à des canalisations enterrées. C’est comparable à un chauffage central… mais à l’échelle d’un quartier entier.<br />
La chaleur est majoritairement produite à partir d’<strong>énergies renouvelables ou de récupération</strong> comme la biomasse, la géothermie ou la chaleur issue d’installations industrielles, ce qui en fait une solution particulièrement écologique.`,
    question: 'Comment fonctionne un réseau de chaleur ?',
  },
  {
    answer:
      "De nombreux dispositifs existent : MaPrimeRénov', les Certificats d'Économies d'Énergie (CEE), l'éco-prêt à taux zéro (éco-PTZ), ou encore des aides locales des collectivités. Les montants varient selon les revenus, le type de système installé et le gain énergétique obtenu.",
    question: 'Quelles aides financières puis-je obtenir pour financer mon projet',
  },
  {
    answer: `Tous les systèmes écologiques ne peuvent pas assurer le rafraichissement, c'est l'un des avantages des pompes à chaleur collectives réversibles : elles peuvent inverser leur cycle pour fonctionner comme une climatisation. Certains systèmes géothermiques permettent également un "free cooling" passif, en faisant simplement circuler l'eau fraîche du sous-sol sans compresseur.`,
    question: 'Les systèmes de chauffage écologiques peuvent-ils aussi assurer le rafraîchissement en été ?',
  },
  {
    answer:
      "Absolument, et c'est même souvent conseillé. Un système hybride associant par exemple une PAC et des panneaux solaires thermiques, ou une chaudière biomasse couplée à du solaire, permet d'optimiser les performances selon les saisons et de réduire la dépendance à une seule source d'énergie.",
    question: 'Peut-on combiner plusieurs systèmes de chauffage ?',
  },

  {
    answer:
      'Le système collectif de chauffage a de nombreux avantages : gain de place, coûts partagés, puissance réduite …\nC’est surtout celui qui permet d’installer plus facilement un chauffage écologique : réseau de chaleur, géothermie, biomasse, solaire thermique, pompe à chaleur… tout est possible !',
    question: 'Quels sont les avantages d’un système de chauffage collectif par rapport à un chauffage individuel',
  },
] satisfies Array<{ answer: string; question: string }>;

function getTextFromNode(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => getTextFromNode(child)).join('');
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextFromNode(node.props.children);
  }

  return '';
}

type ResourceCardProps = {
  title: string;
  description: string;
  image?: string;
  slug: string;
};

const heatingSystemResources: ResourceCardProps[] = [
  { slug: 'avantages', ...understandings.avantages },
  { slug: 'facture', ...understandings.facture },
  { slug: 'reseau', ...issues.reseau },
  ...Object.entries(otherHeatingSystem).map(([slug, article]) => ({
    ...article,
    slug,
  })),
].map(({ slug, title, description, image }) => ({
  description: getTextFromNode(description),
  image,
  slug,
  title,
}));

function CardFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`w-full overflow-hidden rounded-lg border-2 border-[#DDDDDD] bg-[#FEFCFA] p-6 ${className}`}>{children}</div>;
}

function CardImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative fr-mb-3w h-45 w-full rounded-t-lg shrink-0 overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  );
}

function renderStepText(text: ReactNode) {
  if (typeof text !== 'string') {
    return text;
  }

  return text.split('<br />').map((part, index) => (
    <span key={`${part}-${index}`}>
      {index > 0 && <br />}
      {part}
    </span>
  ));
}

function BenefitCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="fr-col-12 fr-col-md-4">
      <CardFrame className="h-full">
        <h5 className="fr-h4">
          <Image src={`/icons/${icon}`} width="24" height="24" alt="" className="inline-block mr-3 mb-1" />
          {title}
        </h5>
        <p>{description}</p>
      </CardFrame>
    </div>
  );
}

function OtherHeatingSystemsCarousel() {
  return (
    <Carousel
      items={heatingSystemResources}
      getItemKey={(resource, index) => `${resource.slug}-${index}`}
      previousLabel="Voir le système précédent"
      nextLabel="Voir le système suivant"
      renderItem={(resource) => (
        <CardFrame className="flex h-full flex-col justify-between">
          <div>
            <CardImage src={`/img/${resource.image}`} alt="" />
            <h5 className="fr-h4">{resource.title}</h5>
            <p className="mb-0 max-h-12 flex-1 overflow-hidden text-ellipsis leading-6 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {resource.description}
            </p>
          </div>
          <Link
            postHogEventKey="fcr_landing:article_clicked"
            postHogEventProps={{ article_title: resource.title, element_name: resource.slug }}
            variant="secondary"
            className="fr-mt-3w"
            href={`/ressources/${resource.slug}`}
            isExternal
          >
            Lire l’article
          </Link>
        </CardFrame>
      )}
    />
  );
}

function StepCard({
  stepNumber,
  title,
  text,
  textBelowNumber = false,
}: {
  stepNumber: number;
  title: string;
  text: ReactNode;
  textBelowNumber?: boolean;
}) {
  const circleBackgroundClassName = stepNumber === 1 ? 'bg-[#000091]' : 'bg-[#6EA8FE]';

  return (
    <div className="flex flex-col items-center text-center">
      {!textBelowNumber && (
        <>
          <h4 className="mb-2 text-lg font-bold">{title}</h4>
          <p className="mb-4 max-w-60 text-sm leading-6 text-[#3A3A3A]">{renderStepText(text)}</p>
        </>
      )}
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl font-bold text-white shadow-[0_0_0_4px_white] ${circleBackgroundClassName} ${textBelowNumber ? 'mb-4' : ''}`}
      >
        {stepNumber}
      </div>
      {textBelowNumber && (
        <>
          <h4 className="mb-2 text-lg font-bold">{title}</h4>
          <p className="mb-0 max-w-60 text-sm leading-6 text-[#3A3A3A]">{renderStepText(text)}</p>
        </>
      )}
    </div>
  );
}

function StepTimeline() {
  const leftPositions = ['6%', '19%', '32%', '45%', '58%', '71%', '84%'];

  return (
    <>
      <div className="mt-8 space-y-6 md:hidden">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex items-start gap-4 rounded-lg border border-[#DDDDDD] bg-white p-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ${
                index === 0 ? 'bg-[#000091]' : 'bg-[#6EA8FE]'
              }`}
            >
              {index + 1}
            </div>
            <div>
              <h4 className="mb-1 text-lg font-bold">{step.title}</h4>
              <p className="mb-0 text-sm leading-6 text-[#3A3A3A]">{renderStepText(step.text)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative my-10 hidden min-h-[360px] md:block">
        <img
          src="/img/chaleur-renouvelable-timeline.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[132px] h-[130px] w-full"
        />

        {STEPS.map((step, index) => {
          const isTop = index % 2 === 0;
          return (
            <div
              key={step.title}
              className={`absolute w-60 -translate-x-1/2 ${isTop ? 'top-0' : 'top-[265px]'}`}
              style={{ left: leftPositions[index] }}
            >
              <StepCard stepNumber={index + 1} title={step.title} text={step.text} textBelowNumber={!isTop} />
            </div>
          );
        })}
      </div>
    </>
  );
}

function TemoignageCard({
  title,
  year,
  image,
  link,
  nbLogement,
}: {
  title: string;
  nbLogement: number;
  year: number;
  image: string;
  link: string;
}) {
  return (
    <CardFrame className="flex h-full flex-col">
      <CardImage src={`/img/${image}`} alt="" />
      <h4>{title}</h4>
      <p className="fr-mb-1w">Type de chauffage: collectif</p>
      <p className="fr-mb-1w">Année de construction: {year}</p>
      <p className="fr-mb-1w">Nombre de logement: {nbLogement}</p>
      <Link
        postHogEventKey="fcr_landing:testimonial_clicked"
        postHogEventProps={{ element_name: title, testimonial_title: title }}
        variant="secondary"
        className="fr-mt-3w"
        href={link}
        isExternal
      >
        Lire le témoignage
      </Link>
    </CardFrame>
  );
}

function TemoignagesCarousel() {
  return (
    <Carousel
      items={TEMOIGNAGES}
      getItemKey={(temoignage, index) => `${temoignage.title}-${index}`}
      previousLabel="Voir le témoignage précédent"
      nextLabel="Voir le témoignage suivant"
      renderItem={(temoignage) => <TemoignageCard {...temoignage} />}
    />
  );
}

function CompareSolutionsButton() {
  return (
    <div className="fr-mt-4w flex justify-center">
      <Button
        priority="primary"
        iconId="fr-icon-arrow-up-line"
        postHogEventKey="fcr_landing:bottom_cta_clicked"
        onClick={() => {
          window.scrollTo({ top: 0 });
        }}
      >
        Comparer les solutions
      </Button>
    </div>
  );
}

function ChaleurRenouvelablePage() {
  const params = useSearchParams();
  const fromPacoupa = params?.get('src') === 'pacoupa';
  const trackedScrollDepthsRef = useRef(new Set<number>());

  useEffect(() => {
    const depths = [25, 50, 75, 100] as const;
    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        return;
      }

      const depthPercent = Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100));
      depths
        .filter((depth) => depthPercent >= depth && !trackedScrollDepthsRef.current.has(depth))
        .forEach((depth) => {
          trackedScrollDepthsRef.current.add(depth);
          trackPostHogEvent('fcr_landing:scroll_depth_reached', { depth_percent: depth });
        });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <SimplePage
      title="Découvrez le chauffage qui vous convient !"
      currentPage="/chaleur-renouvelable"
      description="Découvrez les modes de chauffage renouvelables adaptés à votre logement"
    >
      {fromPacoupa && (
        <Notice onClose={() => null} variant="info">
          Pacoupa est désormais un service intégré à France Chaleur Urbaine, un service de l’ADEME
        </Notice>
      )}
      <div className="fr-p-1w md:fr-p-5w w-full bg-[#C3E4E2] bg-[url('/img/banner_simulateur.webp')] bg-no-repeat bg-cover bg-left-center">
        <div className="fr-container">
          <h1 className="fr-mt-2w md:fr-mt-5w text-white">
            Rejoignez les 13 millions de français
            <br /> qui se chauffent autrement
          </h1>
          <div className="rounded border-2 border-blue-600 bg-white p-6 shadow-sm">
            <h2 className="text-2xl hidden md:block">Trouvez la meilleure solution de chauffage écologique et économique en 3 clics !</h2>
            <h2 className="text-2xl md:hidden">Votre chauffage écologique et économique en 3 clics</h2>
            <ChoixChauffageForm />
          </div>
        </div>
      </div>
      <div className="fr-container fr-py-6w">
        <h3 className="fr-h6 fr-mb-3v font-medium uppercase">Pourquoi choisir un chauffage écologique ?</h3>
        <p className="fr-h2 font-bold">Des arguments concrets, bien au-delà de l’environnement</p>
        <div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
          {BENEFITS.map((benefit, i) => (
            <BenefitCard key={i} {...benefit} />
          ))}
        </div>
      </div>
      <div className="bg-[#F3F6FE]">
        <div className="fr-container fr-py-6w">
          <h3 className="fr-h6 fr-mb-3v font-medium uppercase">Ressources Pédagogiques</h3>
          <p className="fr-h2 font-bold">Tout comprendre avant de se lancer</p>
          <OtherHeatingSystemsCarousel />
        </div>
      </div>
      <div className="fr-container fr-py-6w">
        <h3 className="fr-h6 fr-mb-3v font-medium uppercase">Les différents systèmes de chauffage écologiques (ENR)</h3>
        <p className="fr-h2 font-bold">Quelles solutions concrètes pour votre copropriété ?</p>
        <Image
          src="/img/different-mode-chauffage.webp"
          alt="illustration des différentes modes de chauffage"
          className="w-full"
          width={1600}
          height={750}
        />
        <CompareSolutionsButton />
      </div>
      <div className="bg-[#F3F6FE]">
        <div className="fr-container fr-py-6w">
          <h3 className="fr-h6 fr-mb-3v font-medium uppercase">Le parcours</h3>
          <p className="fr-h2 font-bold">De la simulation à l’installation : 7 étapes claires</p>
          <StepTimeline />
        </div>
      </div>
      <div className="fr-container fr-py-6w">
        <h3 className="fr-h6 fr-mb-3v font-medium uppercase">Témoignages</h3>
        <p className="fr-h2 font-bold">Ces copropriétés ont fait l’expérience de l’ENR</p>
        <TemoignagesCarousel />
        <CompareSolutionsButton />
      </div>
      <div className="bg-[#F3F6FE]">
        <div className="fr-container fr-py-6w">
          <h3 className="fr-h6 fr-mb-3v font-medium uppercase">FAQ</h3>
          <p className="fr-h2 font-bold">Questions fréquentes sur les énergies renouvelables</p>
          <div className="fr-mt-4w">
            {FAQS.map((faq) => (
              <Accordion
                key={faq.question}
                label={faq.question}
                onExpandedChange={(expanded) => {
                  if (expanded) {
                    trackPostHogEvent('fcr_landing:faq_item_opened', { faq_question: faq.question });
                  }
                }}
              >
                <div className="fr-mb-0 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </Accordion>
            ))}
          </div>
          <CompareSolutionsButton />
        </div>
      </div>
    </SimplePage>
  );
}

export default ChaleurRenouvelablePage;
