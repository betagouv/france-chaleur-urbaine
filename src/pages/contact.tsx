import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';
import Section, { SectionContent } from '@/components/ui/Section';
import ContactForm from '@/modules/app/client/components/ContactForm';

function contact() {
  return (
    <SimplePage title="Contactez-nous" description="Une question sur les réseaux de chaleur et de froid ? N'hésitez pas à nous contacter.">
      <Hero variant="ressource">
        <HeroTitle>Nous contacter</HeroTitle>
        <HeroSubtitle>
          Vous avez une question suite à votre demande sur France Chaleur Urbaine ? Vous souhaitez nous faire part de suggestions pour
          améliorer notre service ? Vous êtes intéressé par un partenariat avec France Chaleur Urbaine ? Pour ces questions ou toute autre,
          n'hésitez pas à nous contacter via le formulaire ci-dessous : nous reviendrons rapidement vers vous.
        </HeroSubtitle>
        <HeroSubtitle>
          Pour nous transmettre un tracé ou des informations sur votre réseau,{' '}
          <Link href="/contribution" className="fr-link">
            utilisez plutôt notre formulaire de contribution dédié
          </Link>
          .
        </HeroSubtitle>
      </Hero>
      <Section size="sm">
        <SectionContent>
          <ContactForm />
        </SectionContent>
      </Section>
    </SimplePage>
  );
}

export default contact;
