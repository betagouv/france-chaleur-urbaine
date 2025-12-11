import SEO from '@/components/SEO';
import './globals.css';

import Link from 'next/link';

type LinkCardProps = {
  href: string;
  title: string;
  description: string;
};

function LinkCard({ href, title, description }: LinkCardProps) {
  return (
    <Link
      href={href}
      className="flex-1 bg-gray-100 p-4 rounded-lg no-underline text-inherit border border-gray-200 hover:border-primary hover:bg-blue-50 transition-all group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-primary">{title}</span>
        <span className="text-primary text-xl transition-transform group-hover:translate-x-1">→</span>
      </div>
      <p className="text-sm text-faded leading-snug">{description}</p>
    </Link>
  );
}

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <SEO title="Page non trouvée" description="Désolé, la page que vous cherchiez n'a pas été trouvée." noIndex />
      <body className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-4xl text-center">
          <img src="/logo-fcu-with-typo.jpg" alt="France Chaleur Urbaine" className="max-w-[280px] mx-auto mb-8" />

          <h1 className="text-2xl font-bold text-primary mb-4">Page non trouvée</h1>

          <p className="text-base text-faded leading-relaxed mb-8">
            France Chaleur Urbaine est un service public gratuit qui facilite le raccordement des bâtiments aux réseaux de chaleur. Nous
            accompagnons copropriétaires, collectivités et professionnels dans la transition énergétique.
          </p>

          <div className="flex flex-col md:flex-row gap-4 text-left">
            <LinkCard
              href="/"
              title="Accueil"
              description="Testez l'éligibilité de votre adresse au raccordement et découvrez nos services."
            />
            <LinkCard
              href="/carte"
              title="Carte des réseaux"
              description="Visualisez les réseaux de chaleur existants en France et vérifiez la proximité de votre bâtiment."
            />
            <LinkCard
              href="/comparateur-couts-performances"
              title="Comparateur de coûts"
              description="Comparez les coûts et performances des différents modes de chauffage pour votre bâtiment."
            />
          </div>
        </div>
      </body>
    </html>
  );
}
