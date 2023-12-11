import Link from 'next/link';
import { Subtitle, SupportImages } from './Contents.styles';

const Supports = () => {
  return (
    <>
      <Subtitle>Infographies</Subtitle>
      <SupportImages>
        <div>
          <Link href="/img/FCU_Infographie_Avenir.jpg" target="_blank">
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
          <Link href="/img/FCU_Infographie_Geo.jpg" target="_blank">
            <img src="/img/support_geothermie.png" alt="" />
            <p>La géothermie</p>
          </Link>
        </div>
        <div>
          <Link href="/img/FCU_Infographie_Biomasse.jpg" target="_blank">
            <img src="/img/support_biomasse.png" alt="" />
            <p>La biomasse</p>
          </Link>
        </div>
        <div>
          <Link href="/img/FCU_Infographie_fatale.jpg" target="_blank">
            <img src="/img/FCU_Infographie_fatale.jpg" alt="" width={150} />
            <p>La chaleur fatale</p>
          </Link>
        </div>
        <div>
          <Link href="/contents/FCU_Infographie-Solaire.jpg" target="_blank">
            <img
              src="/contents/FCU_Infographie-Solaire.jpg"
              alt=""
              width={150}
            />
            <p>Solaire thermique</p>
          </Link>
        </div>
        <div>
          <Link href="/img/FCU_Infographie_Froid.jpg" target="_blank">
            <img src="/img/FCU_Infographie_Froid.jpg" alt="" width={150} />
            <p>Les réseaux de froid</p>
          </Link>
        </div>
      </SupportImages>
      <Subtitle>Reportages</Subtitle>
      <SupportImages>
        <div>
          <Link href="/documentation/geothermie_champigny.pdf" target="_blank">
            <img src="/img/geothermie_champigny.jpeg" alt="" />
            <p>Forage géothermique de Champigny-sur-Marne</p>
          </Link>
        </div>
        <div>
          <Link href="/documentation/chaufferie_surville.pdf" target="_blank">
            <img src="/img/chaufferie_surville.jpeg" alt="" />
            <p>Chaufferie biomasse de Surville</p>
          </Link>
        </div>
        <div>
          <Link href="/documentation/datacenter_equinix.pdf" target="_blank">
            <img src="/img/datacenter_equinix.jpeg" alt="" />
            <p>Datacenter Equinix à Saint-Denis</p>
          </Link>
        </div>
        <div>
          <Link href="/documentation/reseau_froid_annecy.pdf" target="_blank">
            <img src="/img/reseau_froid_annecy.jpeg" alt="" />
            <p>Réseau de froid d’Annecy</p>
          </Link>
        </div>
        <div>
          <Link href="/documentation/FCU_Isseane.pdf" target="_blank">
            <img src="/img/FCU_Isseane.jpg" alt="" width={150} />
            <p>Unité de valorisation énergétique d'Issy-les-Moulineaux</p>
          </Link>
        </div>
      </SupportImages>
      <Subtitle>Dossier de presse</Subtitle>
      <SupportImages>
        <div className="fr-mb-4w">
          <Link href="/documentation/dossier-presse.pdf" target="_blank">
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
      <Subtitle id="campagnes-de-pub">Campagne de pub</Subtitle>
      <SupportImages>
        <div>
          <Link href="/img/PUB-PANNEAU.pdf" target="_blank">
            <img src="/img/support_pub1.png" alt="" />
            <p>Affiche abribus</p>
          </Link>
        </div>
        <div>
          <Link href="/img/support_pub1_big.jpg" target="_blank">
            <img src="/img/support_pub2.png" alt="" />
            <p>Pub Facebook</p>
          </Link>
        </div>
        <div>
          <Link href="/img/support_pub3_big.jpg" target="_blank">
            <img src="/img/support_pub3.png" alt="" />
            <p>Pub Facebook</p>
          </Link>
        </div>
      </SupportImages>
      <Subtitle>Visuels de promotion</Subtitle>
      <SupportImages>
        <div>
          <Link href="/img/FCU-Affiche.pdf" target="_blank">
            <img src="/img/support_affiche1.png" alt="" />
            <p>Affiche d’information</p>
          </Link>
        </div>
        <div>
          <Link href="/img/LINKED.jpg" target="_blank">
            <img src="/img/support_video2.jpeg" alt="" />
            <p>Post LinkedIn ou Facebook</p>
          </Link>
        </div>
        <div>
          <Link href="/img/support_affiche3_big.jpg" target="_blank">
            <img src="/img/support_video3.png" alt="" />
            <p>Post LinkedIn ou Facebook</p>
          </Link>
        </div>
      </SupportImages>
      <Subtitle>Guide de raccordement pour les copros</Subtitle>
      <SupportImages>
        <div>
          <Link
            href="/documentation/guide-france-chaleur-urbaine.pdf"
            target="_blank"
          >
            <img src="/img/support_guide.png" alt="" />
          </Link>
        </div>
      </SupportImages>
    </>
  );
};

export default Supports;
