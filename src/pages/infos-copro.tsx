import Advantages from '@/components/Coproprietaire/Advantages';
import Interviews from '@/components/Coproprietaire/Interviews';
import HeadSliceForm from '@/components/HeadSliceForm';
import { GlobalStyle } from '@/components/shared/layout/Global.style';
import SimplePage from '@/components/shared/page/SimplePage';
import Slice from '@/components/Slice';
import SliceForm from '@/components/SliceForm';
import WrappedBlock from '@/components/WrappedBlock';
import WrappedText from '@/components/WrappedText';
import { comparatifRcu } from '@/data/coproprietaire';

export default function InfosCoproPage() {
  return (
    <SimplePage
      title="Le chauffage urbain pour les coprpriétaires"
      description="Maitrisez vos factures en vous raccordant à un réseau de chaleur"
      currentPage="/"
    >
      <GlobalStyle />
      <HeadSliceForm
        bg="/img/banner_infos-copro.png"
        pageBody={`
# Copropriétaires, raccordez-vous aux réseaux de chaleur et maîtrisez vos factures !`}
        formLabel="Vérifiez immédiatement si votre immeuble pourrait être raccordé !"
        checkEligibility
        needGradient
      />
      <Slice padding={8} theme="grey">
        <Interviews from="florence" />
      </Slice>
      <Slice padding={8}>
        <Advantages />
      </Slice>
      <Slice padding={8} theme="grey" className="slice-comparatif-rcu" header={`### La solution de chauffage la plus compétitive`}>
        <WrappedBlock data={comparatifRcu} reverse />
      </Slice>
      <Slice padding={8}>
        <WrappedText
          center
          body={`
Un réseau de chaleur est constitué d’un système de **canalisations** qui permettent d’acheminer vers un ensemble de **bâtiments** de la **chaleur** produite **localement**, avec des **sources d’énergies renouvelables ou de récupération**  (géothermie, biomasse, chaleur issue de l'incinération des déchets...).

Une alternative écologique au fioul et au gaz !`}
          imgSrc="/img/rcu-illustation.svg"
        />
      </Slice>
      <Slice theme="blue-background" padding={5}>
        <SliceForm title="Votre copropriété pourrait-elle être raccordée à un réseau de chaleur ?" colored />
      </Slice>
    </SimplePage>
  );
}
