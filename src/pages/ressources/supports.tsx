import { StyledInfographieItem } from '@components/Ressources/Contents/Contents.styles';
import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import Image from 'next/image';
import { PropsWithChildren } from 'react';

const SupportsPage = () => {
  return (
    <SimplePage
      title="Nos supports - France Chaleur Urbaine"
      currentPage="/ressources"
    >
      <Box backgroundColor="blue-cumulus-950-100">
        <Box
          className="fr-container"
          display="flex"
          alignItems="center"
          gap="16px"
          px="16w"
          pt="8w"
        >
          <Box flex>
            <Heading size="h1" color="blue-france">
              Nos supports pédagogiques
            </Heading>
            <Text size="lg" mb="3w">
              Retrouvez tous nos supports de communication pour comprendre
              simplement et rapidement les enjeux liés aux réseaux de chaleur ou
              faire connaître notre service.
            </Text>
          </Box>

          <Box className="fr-hidden fr-unhidden-lg">
            <Image
              src="/img/ressources_header.webp"
              alt=""
              width={152}
              height={180}
              priority
            />
          </Box>
        </Box>
      </Box>

      <Box p="10w" className="fr-container">
        <Heading size="h2" color="blue-france" center mb="8w">
          Infographies
        </Heading>
        <Box display="flex" alignItems="baseline" gap="16px" flexWrap="wrap">
          <InfographieItem>
            <Link
              href="/img/FCU_Infographie_Avenir.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Avenir"
            >
              <img
                src="/img/support_FCU_Infographie.png"
                alt=""
                loading="lazy"
              />
              <Box p="1v">Les réseaux de chaleur : une solution d’avenir</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/img/FCU_Infographie_Classement.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Classement"
            >
              <img
                src="/img/support_FCU_Infographie5.png"
                alt=""
                loading="lazy"
              />
              <Box p="1v">Le classement automatique des réseaux de chaleur</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/img/FCU_Infographie_Menage.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Ménages"
            >
              <img
                src="/img/support_FCU_Infographie4.png"
                alt=""
                loading="lazy"
              />
              <Box p="1v">Les ménages français et le chauffage</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/img/FCU_Infographie_Cout.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Cout"
            >
              <img
                src="/img/support_FCU_Infographie3.png"
                alt=""
                loading="lazy"
              />
              <Box p="1v">Combien coûte la chaleur ?</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/img/FCU_Infographie_Enrr.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie ENRR"
            >
              <img
                src="/img/support_FCU_Infographie2.png"
                alt=""
                loading="lazy"
              />
              <Box p="1v">Les énergies renouvelables et de récupération</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/img/FCU_Infographie_Geo.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Géothermie"
            >
              <img src="/img/support_geothermie.png" alt="" loading="lazy" />
              <Box p="1v">La géothermie</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/img/FCU_Infographie_Biomasse.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Biomasse"
            >
              <img src="/img/support_biomasse.png" alt="" loading="lazy" />
              <Box p="1v">La biomasse</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/img/FCU_Infographie_fatale.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Chaleur Fatale"
            >
              <img
                src="/img/FCU_Infographie_fatale.jpg"
                alt=""
                loading="lazy"
                width={150}
              />
              <Box p="1v">La chaleur fatale</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/contents/FCU_Infographie-Solaire.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Solaire"
            >
              <img
                src="/contents/FCU_Infographie-Solaire.jpg"
                alt=""
                loading="lazy"
                width={150}
              />
              <Box p="1v">Solaire thermique</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/img/FCU_Infographie_Froid.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Froid"
            >
              <img
                src="/img/FCU_Infographie_Froid.jpg"
                alt=""
                width={150}
                loading="lazy"
              />
              <Box p="1v">Les réseaux de froid</Box>
            </Link>
          </InfographieItem>
          <InfographieItem>
            <Link
              href="/img/FCU_optimisation_reseaux-chaleur.jpg"
              isExternal
              eventKey="Téléchargement|Supports|Infographie Optimisation"
            >
              <img
                src="/img/FCU_optimisation_reseaux-chaleur.jpg"
                alt=""
                width={150}
                loading="lazy"
              />
              <Box p="1v">Optimiser son réseau de chaleur</Box>
            </Link>
          </InfographieItem>
        </Box>

        <Heading size="h2" color="blue-france" center mb="8w">
          Reportages
        </Heading>

        {/*
        <SupportImages>
          <div>
            <Link
              href="/documentation/geothermie_champigny.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent(
                  'Téléchargement|Supports|Reportage géothermie Champigny'
                );
            >
              <img src="/img/geothermie_champigny.jpeg" alt="" />
              <p>Forage géothermique de Champigny-sur-Marne</p>
            </Link>
          </div>
          <div>
            <Link
              href="/documentation/chaufferie_surville.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent(
                  'Téléchargement|Supports|Reportage chaufferie Surville'
                );
            >
              <img src="/img/chaufferie_surville.jpeg" alt="" />
              <p>Chaufferie biomasse de Surville</p>
            </Link>
          </div>
          <div>
            <Link
              href="/documentation/datacenter_equinix.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent(
                  'Téléchargement|Supports|Reportage datacenter Equinix'
                );
            >
              <img src="/img/datacenter_equinix.jpeg" alt="" />
              <p>Datacenter Equinix à Saint-Denis</p>
            </Link>
          </div>
          <div>
            <Link
              href="/documentation/reseau_froid_annecy.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent(
                  'Téléchargement|Supports|Reportage réseau froid Annecy'
                );
            >
              <img src="/img/reseau_froid_annecy.jpeg" alt="" />
              <p>Réseau de froid d’Annecy</p>
            </Link>
          </div>
          <div>
            <Link
              href="/documentation/FCU_Isseane.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent('Téléchargement|Supports|Reportage Isseane');
            >
              <img src="/img/FCU_Isseane.jpg" alt="" width={150} />
              <p>Unité de valorisation énergétique d'Issy-les-Moulineaux</p>
            </Link>
          </div>
          <div>
            <Link
              href="/documentation/FCU_Alsace_Charras.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent('Téléchargement|Supports|Reportage Alsace Charras');
            >
              <img src="/img/FCU_Alsace_Charras.jpg" alt="" width={150} />
              <p>Centrale Alsace et chaufferie Charras à Courbevoie</p>
            </Link>
          </div>
        </SupportImages>
        <Heading size="h2" color="blue-france" center mb="8w">
          Dossier de presse
        </Heading>
        <SupportImages>
          <div className="fr-mb-4w">
            <Link
              href="/documentation/dossier-presse.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent('Téléchargement|Dossier Presse|Supports');
            >
              <img src="/img/support_dossier_presse.png" alt="" />
            </Link>
          </div>
        </SupportImages>
        <Heading size="h2" color="blue-france" center mb="8w">
          Vidéos
        </Heading>
        <SupportImages>
          <div>
            <Link
              href="/videos/FCU-accueil.mp4"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent('Téléchargement|Supports|Vidéo Evry-Courcouronnes');
            >
              <img src="/img/support_video1.png" alt="" />
              <p>Reportage à Evry-Courcouronnes (91)</p>
            </Link>
          </div>
          <div>
            <Link
              href="/videos/FCU-RC.mp4"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent('Téléchargement|Supports|Vidéo comment ça marche');
            >
              <img src="/img/support_video2.jpeg" alt="" />
              <p>Les réseaux de chaleur : comment ça fonctionne ?</p>
            </Link>
          </div>
        </SupportImages>
        <Heading
          size="h2"
          color="blue-france"
          center
          mb="8w"
          id="campagnes-de-pub"
        >
          Campagne de pub
        </Heading>
        <SupportImages>
          <div>
            <Link
              href="/img/PUB-PANNEAU.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent(
                  'Téléchargement|Supports|Campagne pub affiche abribus'
                );
            >
              <img src="/img/support_pub1.png" alt="" />
              <p>Affiche abribus</p>
            </Link>
          </div>
          <div>
            <Link
              href="/img/support_pub1_big.jpg"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent('Téléchargement|Supports|Campagne pub facebook 1');
            >
              <img src="/img/support_pub2.png" alt="" />
              <p>Pub Facebook</p>
            </Link>
          </div>
          <div>
            <Link
              href="/img/support_pub3_big.jpg"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent('Téléchargement|Supports|Campagne pub facebook 2');
            >
              <img src="/img/support_pub3.png" alt="" />
              <p>Pub Facebook</p>
            </Link>
          </div>
        </SupportImages>
        <Heading
          size="h2"
          color="blue-france"
          center
          mb="8w"
          id="campagnes-de-pub"
        >
          Visuels de promotion
        </Heading>
        <SupportImages>
          <div>
            <Link
              href="/img/FCU-Affiche.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent(
                  'Téléchargement|Supports|Visuel promotion affiche information'
                );
            >
              <img src="/img/support_affiche1.png" alt="" />
              <p>Affiche d’information</p>
            </Link>
          </div>
          <div>
            <Link
              href="/img/LINKED.jpg"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent(
                  'Téléchargement|Supports|Visuel promotion post LI ou FB 1'
                );
            >
              <img src="/img/support_video2.jpeg" alt="" />
              <p>Post LinkedIn ou Facebook</p>
            </Link>
          </div>
          <div>
            <Link
              href="/img/support_affiche3_big.jpg"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent(
                  'Téléchargement|Supports|Visuel promotion post LI ou FB 2'
                );
            >
              <img src="/img/support_video3.png" alt="" />
              <p>Post LinkedIn ou Facebook</p>
            </Link>
          </div>
        </SupportImages>

        <Heading
          size="h2"
          color="blue-france"
          center
          mb="8w"
          id="campagnes-de-pub"
        >
          Guides
        </Heading>
        <SupportImages>
          <div>
            <Link
              href="/documentation/guide-france-chaleur-urbaine.pdf"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackEvent('Téléchargement|Guide FCU|Supports');
            >
              <img src="/img/support_guide.png" alt="" />
            </Link>
          </div>
        </SupportImages> */}
      </Box>
    </SimplePage>
  );
};

export default SupportsPage;

export const InfographieItem = ({ children }: PropsWithChildren) => (
  <StyledInfographieItem className="fr-card fr-card--no-border fr-enlarge-link">
    {children}
  </StyledInfographieItem>
);
