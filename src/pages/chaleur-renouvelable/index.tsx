import SimplePage from '@/components/shared/page/SimplePage';
import Badge from '@/components/ui/Badge';
import ChoixChauffageForm from '@/modules/chaleur-renouvelable/client/ChoixChauffageForm';

const BENEFITS = [
  {
    badge: 'Prix stables, budget maîtrisé',
    description:
      'Les prix du gaz et du fioul fluctuent au gré des crises mondiales. Les énergies renouvelables locales offrent une stabilité tarifaire sur le long terme.',
    icon: 'fr-icon-money-euro-circle-fill',
    title: 'Protégez-vous des hausses du gaz ou du fioul',
  },
  {
    badge: 'Reste à charge réduit',
    description:
      "MaPrimeRénov', CEE, aides locales… Les dispositifs publics permettent de financer une grande partie des travaux, y compris pour les copropriétés.",
    icon: 'fr-icon-sparkling-2-fill',
    title: 'Jusqu’à 70% de prise en charge pour votre projet',
  },
  {
    badge: 'DPE amélioré = bien valorisé',
    description:
      'Un meilleur diagnostic de performance énergétique valorise votre bien et permet de respecter la réglementation en vigueur.',
    icon: 'fr-icon-award-fill',
    title: 'Améliorez votre étiquette DPE',
  },
  {
    badge: 'Prix stables, budget maîtrisé',
    description:
      'Le passage à une énergie renouvelable peut diviser par deux les émissions liées au chauffage, une contribution concrète à la transition écologique.',
    icon: 'fr-icon-avalanches-fill',
    title: 'Réduisez vos émissions de CO2',
  },
  {
    badge: 'Chauffage et ventilation',
    description: 'Chaleur homogène en hiver, fraîcheur possible en été avec certaines solutions réversibles.',
    icon: 'fr-icon-chat-check-fill',
    title: 'Gagnez en confort toute l’année',
  },
  {
    badge: 'Factures allégées',
    description:
      'Les énergies renouvelables sont souvent moins chères que les combustibles fossiles, et les systèmes de chauffage ENR sont souvent plus efficaces que ceux au gaz ou fioul.',
    icon: 'fr-icon-temp-cold-fill',
    title: 'Réduisez vos factures d’énergie',
  },
];

const STEPS = [
  { text: 'Je découvre les solutions de chauffage adaptées à mon bâtiment', title: 'Je simule' },
  { text: "Un conseiller m'aide gratuitement à affiner mon projet", title: 'Je suis accompagné' },
  { text: 'Un DPE ou audit énergétique précise les travaux à envisager', title: 'Je réalise un audit' },
  { text: "Je monte mon dossier MaPrimeRénov', CEE et autres financements", title: 'Je mobilise les aides' },
  { text: 'Le projet est voté en assemblée générale', title: 'Ma copropriété décide' },
  { text: 'Les travaux sont réalisés et mon nouveau chauffage est en service', title: 'Je fais installer' },
  { text: 'd’un chauffage confortable et écologique !', title: 'Je profite' },
];

function BenefitCard({ icon, title, description, badge }: { icon: string; title: string; description: string; badge: string }) {
  return (
    <div className="w-full max-w-[300px] text-center fr-mb-5w">
      <div className="fr-h5 fr-mb-1w">
        <span className={`${icon} text-(--text-title-blue-france)`} aria-hidden="true" />
      </div>
      <div>
        <h5>{title}</h5>
        <p>{description}</p>
        <Badge severity="error">{badge}</Badge>
      </div>
    </div>
  );
}

function ChaleurRenouvelablePage() {
  return (
    <SimplePage
      title="Découvrez le chauffage qui vous convient !"
      currentPage="/chaleur-renouvelable"
      description="Découvrez les modes de chauffage renouvelables adaptés à votre logement"
    >
      <div className="fr-p-5w w-full bg-[#C3E4E2] bg-[url('/img/banner_simulateur.webp')] bg-no-repeat bg-cover bg-left-center">
        <div className="fr-container">
          <h1 className="fr-mt-5w">
            Rejoignez les <span className="text-[#009081]">13 millions</span> de français
            <br /> qui se chauffent autrement
          </h1>
          <div className="rounded border-2 border-blue-600 bg-white p-6 shadow-sm">
            <h2 className="text-2xl hidden md:block">Trouvez la meilleure solution de chauffage écologique et économique en 3 clics !</h2>
            <h2 className="text-2xl md:hidden">Votre chauffage écologique et économique en 3 clics</h2>
            <ChoixChauffageForm />
          </div>
        </div>
      </div>

      <div className="fr-container fr-pt-6w">
        <h3>Pourquoi choisir un chauffage écologique ?</h3>
        <p className="text-xl">Des arguments concrets, bien au-delà de l’environnement</p>
        <div className="flex justify-center items-center gap-6">
          {BENEFITS.slice(0, 3).map((benefit, i) => (
            <BenefitCard key={i} {...benefit} />
          ))}
        </div>
        <div className="flex justify-center items-center gap-6">
          {BENEFITS.slice(3).map((benefit, i) => (
            <BenefitCard key={i} {...benefit} />
          ))}
        </div>
      </div>
      <div className="bg-light">
        <div className="fr-container fr-py-6w">
          <h3>
            Réseau de chaleur, pompes à chaleur, solaire thermique, biomasse...
            <br /> Les solutions écologiques sont nombreuses !{' '}
          </h3>
          <p>Faites la simulation pour explorer les solutions adaptées à votre bâtiment.</p>
        </div>
      </div>
      <div className="fr-container fr-my-6w">
        <h3>Quelles étapes pour changer mon chauffage ? </h3>
        <ol>
          {STEPS.map((s) => (
            <li key={s.title} className="text-(--text-title-blue-france)">
              <strong>{s.title}</strong> <span className="text-black">— {s.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </SimplePage>
  );
}

export default ChaleurRenouvelablePage;
