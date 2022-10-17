import { Source, Statistic, Statistics, Subtitle } from './Contents.styles';

const Livraisons = () => {
  return (
    <>
      <p>
        <b>
          Notre pays dispose pourtant d’un fort potentiel de développement des
          réseaux de chaleur !
        </b>
      </p>
      <Subtitle>En 2020, on compte :</Subtitle>
      <Statistics>
        <div>
          <Statistic>
            <b>43 045</b>
          </Statistic>
          Bâtiments raccordés
          <br />
          <span>2,46 millions d'équivalent-logements</span>
        </div>
        <div>
          <Statistic>
            <b>6 199</b> km
          </Statistic>
          De longueurs desservies
        </div>
        <div>
          <Statistic>
            <b>25,4</b> TWh
          </Statistic>
          De chaleur livrée nette
        </div>
      </Statistics>
      <br />
      Les principaux secteurs desservis par les réseaux de chaleur sont :
      <ul>
        <li>
          le secteur <b>résidentiel</b> : 54,3 % des livraisons.
        </li>
        <li>
          le secteur <b>tertiaire</b> : 36,1 % des livraisons.
        </li>
      </ul>
      <br />
      <b>
        La loi de transition énergétique pour la croissance verte de 2015 fixe
        l’objectif de multiplier par 5 la quantité de chaud et de froid
        renouvelables livrés par les réseaux en 2030, par rapport à 2012.
      </b>
      <Source>Source : SNCU</Source>
    </>
  );
};

export default Livraisons;
