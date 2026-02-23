import ChoixChauffageForm from '@/components/choix-chauffage/ChoixChauffageForm';
import SimplePage from '@/components/shared/page/SimplePage';
import { ResponsiveRow } from '@/components/ui/Box';

const BENEFITS = [
  { icon: 'fr-icon-temp-cold-fill', lines: ['Gagnez en confort', "toute l'année"] },
  { icon: 'fr-icon-sparkling-2-fill', lines: ['Diminuez les émission de gaz à', 'effet de serre de votre chauffage'] },
  { icon: 'fr-icon-award-fill', lines: ['Améliorez votre', 'classe DPE'] },
  { icon: 'fr-icon-avalanches-fill', lines: ['Protégez-vous des hausses', 'imprévisibles du gaz et du fioul'] },
  { icon: 'fr-icon-chat-check-fill', lines: ['Un service public gratuit,', 'fiable et neutre'] },
  { icon: 'fr-icon-money-euro-circle-fill', lines: ["Jusqu'à 70% de prise en charge", 'pour les copropriétés'] },
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

function BenefitCard({ icon, lines }: { icon: string; lines: readonly string[] }) {
  return (
    <div className="w-full max-w-[300px] text-center fr-mb-5w">
      <div className="fr-h5 fr-mb-1w">
        <span className={`${icon} text-(--text-title-blue-france)`} aria-hidden="true" />
      </div>
      <div>
        {lines.map((l, i) => (
          <span key={i}>
            {l}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
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
      <div
        className="fr-p-5w w-full"
        style={{
          background: 'url("/img/banner_chauffage_gaz.png") no-repeat left center #C3E4E2',
        }}
      >
        <div className="fr-container rounded border-2 border-blue-600 bg-white p-6 shadow-sm">
          <h2 className="text-2xl hidden md:block">Trouvez la meilleure solution de chauffage écologique et économique en 3 clics !</h2>
          <h2 className="text-2xl md:hidden">Votre chauffage écologique et économique en 3 clics</h2>
          <ChoixChauffageForm />
        </div>
      </div>

      <div className="fr-container fr-pt-6w">
        <h3>Pourquoi choisir un chauffage écologique ?</h3>
        <ResponsiveRow className="justify-center items-center gap-6">
          {BENEFITS.slice(0, 3).map((b) => (
            <BenefitCard key={b.icon} icon={b.icon} lines={b.lines} />
          ))}
        </ResponsiveRow>
        <ResponsiveRow className="justify-center items-center gap-6">
          {BENEFITS.slice(3).map((b) => (
            <BenefitCard key={b.icon} icon={b.icon} lines={b.lines} />
          ))}
        </ResponsiveRow>
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
