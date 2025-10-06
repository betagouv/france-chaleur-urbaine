import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';
import Section from '@/components/ui/Section';

const webinaires = [
  {
    desc: "Ce webinaire présente en détail les différents outils et services proposés par France Chaleur Urbaine : test d'adresse (simple et en masse), mise en relation avec les gestionnaires des réseaux, carte des réseaux et potentiels, fiches techniques des réseaux, comparateur de coûts et émissions de C02 des modes de chauffage, iframes, supports de communication…",
    footer: (
      <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--inline-lg">
        <li>
          <Button priority="secondary" href="/webinaire/2025/presentation-france-chaleur-urbaine">
            Présentation
          </Button>
        </li>
        <li>
          <Link isExternal className="fr-btn" href="/webinaire/2025/replay-presentation-france-chaleur-urbaine">
            Replay
          </Link>
        </li>
      </ul>
    ),
    imageAlt: 'Page de garde de la présentation de France Chaleur Urbaine',
    imageUrl: '/img/webinaires/vignette_prezFCU.png',
    linkProps: { href: '/webinaire/2025/presentation-france-chaleur-urbaine' },
    start: 'Juin 2025',
    title: 'Présentation de France Chaleur Urbaine',
  },
  {
    desc: "Organisé en partenariat avec l'Association Amorce et avec la participation du bureau d'étude Elcimaï, ce webinaire offre une présentation détaillée du comparateur de coûts et émissions de CO2 des modes de chauffage et de refroidissement en ligne sur France Chaleur Urbaine : périmètre de l'outil, interface, méthodologie de calculs…",
    footer: (
      <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--inline-lg">
        <li>
          <Button priority="secondary" href="/webinaire/2025/presentation-comparateur">
            Présentation
          </Button>
        </li>
        <li className="flex items-center gap-2">
          <Link isExternal className="fr-btn" href="/webinaire/2025/replay-presentation-comparateur">
            Replay
          </Link>
          <span className="mb-4 tracking-tight text-faded text-sm font-bold">(mot de passe : WebRRCF0625)</span>
        </li>
      </ul>
    ),
    imageAlt: 'Page de garde de la présentation du comparateur de coûts et émissions de CO2',
    imageUrl: '/img/webinaires/vignette_comparateur.png',
    linkProps: { href: '/webinaire/2025/presentation-comparateur' },
    start: 'Juin 2025',
    title: 'Comparateur de coûts et émissions de CO2 des modes de chauffage',
  },
  {
    desc: "Ce webinaire rappelle ce qu'est le classement, quels sont les réseaux concernés et obligations associées, avec l'intervention du Cerema. Il montre comment les outils France Chaleur Urbaine peuvent être utilisés dans le cadre de la mise en œuvre du classement. Des retours d'expériences de collectivités sont également présentés (Rennes métropole, Lyon métropole…).",
    footer: (
      <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--inline-lg">
        <li>
          <Button priority="secondary" href="/webinaire/2025/presentation-classement">
            Présentation
          </Button>
        </li>
        <li>
          <Link isExternal className="fr-btn" href="/webinaire/2025/replay-classement">
            Replay
          </Link>
        </li>
      </ul>
    ),
    imageAlt: 'Page de garde de la présentation du classement des réseaux de chaleur',
    imageUrl: '/img/webinaires/vignette_classement.png',
    linkProps: { href: '/webinaire/2025/presentation-classement' },
    start: 'Avril 2025',
    title: 'Classement des réseaux de chaleur',
  },
  {
    desc: "Ce webinaire, organisé en partenariat avec l'Association Amorce et le Cerema, s'adresse aux collectivités qui souhaitent envisager la mise en place d'un réseau de chaleur sur leur territoire. Il rappelle le fonctionnement d'un réseau de chaleur, montre comment identifier les opportunités de création de réseau sur un territoire, présente les étapes d'un projet de réseau, les modes de gestion envisageables et les aides financières mobilisables.",
    footer: (
      <ul className="fr-btns-group fr-btns-group--inline-reverse fr-btns-group--inline-lg">
        <li>
          <Button priority="secondary" href="/webinaire/2025/presentation-initier-un-reseau">
            Présentation
          </Button>
        </li>
        <li>
          <Link isExternal className="fr-btn" href="/webinaire/2025/replay-initier-un-reseau">
            Replay
          </Link>
        </li>
      </ul>
    ),
    imageAlt: "Page de garde de la présentation de la mise en place d'un projet de réseau de chaleur",
    imageUrl: '/img/webinaires/vignette_initier.png',
    linkProps: { href: '/webinaire/2025/presentation-initier' },
    start: 'Janvier 2025',
    title: 'Initier un projet de réseau de chaleur',
  },
];

const WebinairesPage = () => {
  return (
    <SimplePage
      title="Nos replays et présentations"
      description="Accédez aux replays et présentations de nos webinaires, sur les réseaux de chaleur et sur les outils France Chaleur Urbaine"
    >
      <Hero variant="ressource" image="/img/ressources_header.webp" imagePosition="right" imageType="inline">
        <HeroTitle>Nos replays et présentations</HeroTitle>
        <HeroSubtitle>
          Accédez aux replays et présentations de nos webinaires, sur les réseaux de chaleur et sur les outils France Chaleur Urbaine
        </HeroSubtitle>
      </Hero>
      <Section>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {webinaires.map((webinaire) => (
            <Card
              key={webinaire.title}
              title={webinaire.title}
              titleAs="h3"
              background
              border
              start={<span className="uppercase text-faded text-sm font-bold tracking-wide">{webinaire.start}</span>}
              desc={webinaire.desc}
              footer={webinaire.footer}
              imageAlt={webinaire.imageAlt}
              imageUrl={webinaire.imageUrl}
              linkProps={webinaire.linkProps}
            />
          ))}
        </div>
      </Section>
    </SimplePage>
  );
};

export default WebinairesPage;
