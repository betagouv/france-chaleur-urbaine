import SimplePage from '@/components/shared/page/SimplePage';
import Alert from '@/components/ui/Alert';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';

function contact() {
  return (
    <SimplePage title="Contactez-nous" description="Une question sur les réseaux de chaleur et de froid ? N'hésitez pas à nous contacter.">
      <Hero variant="ressource">
        <HeroTitle>Nous contacter</HeroTitle>
        <Alert variant="info">
          Avant de nous écrire, votre réponse se trouve peut-être dans notre{' '}
          <Link href="/faq" postHogEventKey="faq:click" postHogEventProps={{ source: 'contact' }}>
            FAQ
          </Link>
          .
        </Alert>
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
      <div className="fr-container">
        {/* Marges négatives pour supprimer les marges dans l'iframe et 1250 hauteur max */}
        <iframe
          src="https://cloud.contact.ademe.fr/franceChaleurUrbaine"
          title="Formulaire de contact France Chaleur Urbaine"
          className="h-[1250px] w-[calc(100%+3rem)] fr-mx-n3w"
          loading="lazy"
        />
      </div>
    </SimplePage>
  );
}

export default contact;
