import Image from 'next/image';

import SimplePage from '@/components/shared/page/SimplePage';
import ChoixChauffageForm from '@/modules/chaleur-renouvelable/client/ChoixChauffageForm';

const BENEFITS = [
  {
    badge: 'Prix stables, budget maîtrisé',
    description:
      'Les prix du gaz et du fioul fluctuent au gré des crises mondiales. Les énergies renouvelables locales offrent une stabilité tarifaire sur le long terme.',
    icon: 'icon-money.png',
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
    icon: 'icon-graph.png',
    title: 'Améliorez votre étiquette DPE',
  },
  {
    badge: 'Empreinte carbone réduite',
    description:
      'Le passage à une énergie renouvelable peut diviser par deux les émissions liées au chauffage, une contribution concrète à la transition écologique.',
    icon: 'icon-feuille.png',
    title: 'Réduisez vos émissions de CO2',
  },
  {
    badge: 'Chauffage et fraîcheur',
    description: 'Chaleur homogène en hiver, fraîcheur possible en été avec certaines solutions réversibles.',
    icon: 'icon-thermometre.png',
    title: 'Gagnez en confort toute l’année',
  },
  {
    badge: 'Factures allégées',
    description:
      'Les énergies renouvelables sont souvent moins chères que les combustibles fossiles, et les systèmes de chauffage ENR sont souvent plus efficaces que ceux au gaz ou fioul.',
    icon: 'icon-money.png',
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
    <div className="w-full fr-mb-5w rounded-lg border-2 border-[#DDDDDD] bg-[#FEFCFA] fr-p-3w">
      <Image src={`/icons/${icon}`} width="32" height="32" alt="icone" className="inline-block fr-mb-3w" />
      <h5>{title}</h5>
      <p>{description}</p>
      <span className="rounded-[50] fr-px-2w fr-py-1w bg-[#FCBFB7] text-[#755348]">{badge}</span>
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
        <h3 className="text-xl uppercase font-normal">Pourquoi choisir un chauffage écologique ?</h3>
        <p className="fr-h3 font-bold">Des arguments concrets, bien au-delà de l’environnement</p>
        <div className="flex justify-center items-stretch gap-6">
          {BENEFITS.slice(0, 3).map((benefit, i) => (
            <BenefitCard key={i} {...benefit} />
          ))}
        </div>
        <div className="flex justify-center items-stretch gap-6">
          {BENEFITS.slice(3).map((benefit, i) => (
            <BenefitCard key={i} {...benefit} />
          ))}
        </div>
      </div>
      <div className="bg-[#F3F6FE]">
        <div className="fr-container fr-py-6w">
          <h3 className="text-xl uppercase font-normal">Ressources Pédagogiques</h3>
          <p className="fr-h3 font-bold">Tout comprendre avant de se lancer</p>
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
