import ChoixChauffageForm from '@/components/choix-chauffage/ChoixChauffageForm';
import SimplePage from '@/components/shared/page/SimplePage';
import { ResponsiveRow } from '@/components/ui/Box';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';
import { NewsletterSection } from '@/components/ui/Newsletter';
import Section, { SectionContent, SectionHeading, SectionTwoColumns } from '@/components/ui/Section';

function ChaleurRenouvelablePage() {
  return (
    <SimplePage
      title="Comprendre la chaleur renouvelable"
      description="Découvrez les modes de chauffage renouvelables adaptés à votre logement"
    >
      <Hero image="/img/landing_chaleur_renouvelable.jpg" variant="light" imageType="inline" imagePosition="right">
        <HeroTitle>Découvez le chauffage qui vous convient&nbsp;!</HeroTitle>
        <HeroSubtitle>
          Pas toujours simple de s’y retrouver entre <strong>les différents chauffages écologiques</strong>, leurs coûts et leur
          fonctionnement&nbsp;?
          <br />
          <strong>France Chaleur Urbaine</strong> vous aide à comparer les solutions décarbonées et à faire un choix adapté, en quelques
          clics.
        </HeroSubtitle>
      </Hero>

      <ChoixChauffageForm />

      <Section variant="gray">
        <SectionContent className="!mt-0">
          <ResponsiveRow>
            <div className="flex-1">
              <div className="fr-h5 fr-mb-1w">Je me renseigne sur les performances thermiques de mon bâtiment.</div>
              <div className="text-sm">
                Mon bâtiment est mal isolé ? Le changement de chauffage doit s'inscrire dans une démarche de rénovation globale !
              </div>
            </div>

            <div className="flex-1">
              <div className="fr-h5 fr-mb-1w">J'identifie les modes de chauffage adaptés à mon bâtiment.</div>
              <div className="text-sm">
                Les modes de chauffage ne sont pas tous interchangeables : chacun a ses spécificités et ses contraintes techniques.
              </div>
            </div>

            <div className="flex-1">
              <div className="fr-h5 fr-mb-1w">Je compare attentivement les avantages et inconvénients de chacun.</div>
              <div className="text-sm">
                Différents critères sont à prendre en compte : coût, émissions de CO2, impact sonore et visuel, maintenance…
              </div>
            </div>
          </ResponsiveRow>
        </SectionContent>
      </Section>

      <Section variant="light">
        <SectionContent className="!mt-0">
          <SectionHeading as="h2">Bien choisir son chauffage c’est important&nbsp;!</SectionHeading>
          <p className="text-lg">
            75% des Français restreignent leur chauffage pour limiter le montant de leurs factures. Le chauffage est aussi responsable de
            15% des émissions de gaz à effet de serre nationales.
          </p>
          <p className="text-lg font-bold fr-mb-4w">Opter pour un mode de chauffage décarboné, c’est :</p>
          <ResponsiveRow>
            <div className="flex-1">
              <img src="/img/picto_facture.svg" alt="" className="d-block img-object-contain" />
              <div className="text-lg fr-mt-2w">Une facture en moyenne moins élevée et plus stable</div>
            </div>

            <div className="flex-1">
              <img src="/img/picto_emissions.svg" alt="" className="d-block img-object-contain" />
              <div className="text-lg fr-mt-2w">Des émissions de gaz à effet de serre et particules fines réduites</div>
            </div>

            <div className="flex-1">
              <img src="/img/picto_independance.svg" alt="" className="d-block img-object-contain" />
              <div className="text-lg fr-mt-2w">Une indépendance énergétique renforcée</div>
            </div>
          </ResponsiveRow>
        </SectionContent>
      </Section>

      <Section>
        <SectionContent className="!mt-0">
          <SectionTwoColumns className="!mt-0">
            <div className="!flex-[2]">
              <SectionHeading as="h2">Affinez votre projet avec notre comparateur</SectionHeading>
              <p className="text-lg">Comparez les coûts et les émissions de CO2 pour chaque mode de chauffage.</p>
              <ul className="text-lg font-bold">
                <li>un comparateur unique évaluant les performances des équipements sur toute leur durée de vie</li>
                <li>prise en compte de l'ensemble des coûts (installation, exploitation, entretien)</li>
                <li>un mode avancé pour retrouver l'ensemble des modes de chauffage écologiques (pompes à chaleur...)</li>
              </ul>

              <Link variant="primary" href="/comparateur-couts-performances" mt="2w">
                Accéder au comparateur
              </Link>
            </div>
            <div className="!flex-1">
              <img src="/img/preview_comparateur.webp" alt="Comparateur de coûts et performances des équipements de chauffage" />
            </div>
          </SectionTwoColumns>
        </SectionContent>
      </Section>

      <Section size="sm" variant="light">
        <NewsletterSection
          title="Vous avez besoin de plus d’informations…"
          subtitle="sur les aides financières disponibles, l’accompagnement mobilisable, les montages juridiques… ?"
          buttonText="Envoyer"
        />
      </Section>
    </SimplePage>
  );
}

export default ChaleurRenouvelablePage;
