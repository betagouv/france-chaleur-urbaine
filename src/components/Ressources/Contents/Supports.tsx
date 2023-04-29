import Link from 'next/link';
import { Subtitle, SupportImages } from './Contents.styles';

const Supports = () => {
  return (
    <>
      <Subtitle>Infographies</Subtitle>
      <SupportImages>
        <div>
          <Link href="/img/FCU_Infographie.jpg" target="_blank">
            <img src="/img/support_FCU_Infographie.png" alt="" />
            <p>Les réseaux de chaleur : une solution d’avenir</p>
          </Link>
        </div>
        <div>
          <Link href="/img/FCU_Infographie_Classement.jpg" target="_blank">
            <img src="/img/support_FCU_Infographie5.png" alt="" />
            <p>Le classement automatique des réseaux de chaleur</p>
          </Link>
        </div>
        <div>
          <Link href="/img/FCU_Infographie_Menage.jpg" target="_blank">
            <img src="/img/support_FCU_Infographie4.png" alt="" />
            <p>Les ménages français et le chauffage</p>
          </Link>
        </div>
        <div>
          <Link href="/img/FCU_Infographie_Cout.jpg" target="_blank">
            <img src="/img/support_FCU_Infographie3.png" alt="" />
            <p>Combien coûte la chaleur ?</p>
          </Link>
        </div>
        <div>
          <Link href="/img/FCU_Infographie_Enrr.jpg" target="_blank">
            <img src="/img/support_FCU_Infographie2.png" alt="" />
            <p>Les énergies renouvelables et de récupération</p>
          </Link>
        </div>
        <div>
          <Link href="/img/FCU_Infographie_Enrr.jpg" target="_blank">
            <img src="/img/support_geothermie.png" alt="" />
            <p>La géothermie</p>
          </Link>
        </div>
        <div>
          <Link href="/img/FCU_Infographie_Enrr.jpg" target="_blank">
            <img src="/img/support_biomasse.png" alt="" />
            <p>La biomasse</p>
          </Link>
        </div>
      </SupportImages>
      <Subtitle>Dossier de presse</Subtitle>
      <SupportImages>
        <div>
          <Link href="/documentation/dossier-presse.pdg" target="_blank">
            <img src="/img/support_dossier_presse.png" alt="" />
          </Link>
        </div>
      </SupportImages>
      <Subtitle>Videos</Subtitle>
      <SupportImages>
        <div>
          <Link href="/videos/FCU-accueil.mp4" target="_blank">
            <img src="/img/support_video1.png" alt="" />
            <p>Reportage à Evry-Courcouronnes (91)</p>
          </Link>
        </div>
        <div>
          <Link href="/videos/FCU-RC.mp4" target="_blank">
            <img src="/img/support_video2.jpeg" alt="" />
            <p>Les réseaux de chaleur : comment ça fonctionne ?</p>
          </Link>
        </div>
      </SupportImages>
      <Subtitle>Campagne de pub</Subtitle>
      <SupportImages>
        <div>
          <img src="/img/support_pub1.png" alt="" />
          <p>Affiche abribus</p>
        </div>
        <div>
          <img src="/img/support_pub2.png" alt="" />
          <p>Pub Facebook</p>
        </div>
        <div>
          <img src="/img/support_pub3.png" alt="" />
          <p>Pub Facebook</p>
        </div>
      </SupportImages>
      <Subtitle>Visuels de promotion</Subtitle>
      <SupportImages>
        <div>
          <img src="/img/support_affiche1.png" alt="" />
          <p>Affiche d’information</p>
        </div>
        <div>
          <img src="/img/support_video2.jpeg" alt="" />
          <p>Post LinkedIn ou Facebook</p>
        </div>
        <div>
          <img src="/img/support_video3.png" alt="" />
          <p>Post LinkedIn ou Facebook</p>
        </div>
      </SupportImages>
      <Subtitle>Guide de raccordement pour les copros</Subtitle>
      <SupportImages>
        <div>
          <Link href="/guide_raccordement_des_coproprietes.pdf" target="_blank">
            <img src="/img/support_guide.png" alt="" />
          </Link>
        </div>
      </SupportImages>
    </>
  );
};

export default Supports;
