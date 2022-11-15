import { CenteredImage, List, Source, Subtitle } from './Contents.styles';

const GreenEnergies = () => {
  return (
    <>
      <Subtitle>Sont principalement mobilisées :</Subtitle>
      <List>
        <li>
          La <b>chaleur issue de l’incinération de nos ordures ménagères</b>,
          qui peut être récupérée et transférée au réseau. On appelle unités de
          valorisation énergétique les installations qui captent l’énergie issue
          de la combustion des ordures ménagères ;
        </li>
        <li>
          La <b>combustion de la biomasse (bois, biomasse agricole,…)</b>, dans
          une chaufferie alimentant le réseau de chaleur ;
        </li>
        <li>
          La <b>géothermie</b>, c’est-à-dire l’exploitation de la chaleur
          contenue dans le sous-sol. Elle passe par la réalisation de forages
          pour extraire les fluides chauds de nappes souterraines, dont les
          calories sont récupérées via un échangeur et transférées au fluide
          circulant dans le réseau de chaleur.
        </li>
      </List>
      <br />
      Les réseaux de chaleur permettent également d’exploiter la chaleur dégagée
      par certains processus industriels, par les data-centers ou encore par les
      eaux usées, même si ces sources d’énergie sont plus marginales.
      <br />
      <br />
      Il est à noter que le{' '}
      <b>mix énergétique est très variable d’un réseau à l’autre.</b>
      <br />
      <br />
      Le recours aux énergies fossiles (charbon, fioul, gaz) est à la baisse ces
      dernières années : celles-ci sont progressivement remplacées par des
      énergies renouvelables et de récupération.
      <br />
      <br />
      <CenteredImage>
        <h3>Bouquet énergetique 2021</h3>
        <p>(énergie entrante)</p>
        <img
          src="/img/ressources-green-energies.png"
          alt=""
          className="fr-mt-1w"
        />
      </CenteredImage>
      <Source>
        Source : SNCU (Enquête annuelle des réseaux de chaleur et de froid 2022
        portant sur l'année 2021)
      </Source>
    </>
  );
};

export default GreenEnergies;
