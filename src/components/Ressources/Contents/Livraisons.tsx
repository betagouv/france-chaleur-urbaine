import Link from 'next/link';
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
      <Subtitle>En 2022, on compte :</Subtitle>
      <Statistics>
        <div>
          <Statistic>
            <b>44 945</b>
          </Statistic>
          Bâtiments raccordés
          <br />
          <span>2,46 millions d'équivalent-logements</span>
        </div>
        <div>
          <Statistic>
            <b>6 529</b> km
          </Statistic>
          De longueurs desservies
        </div>
        <div>
          <Statistic>
            <b>29,8</b> TWh
          </Statistic>
          De chaleur livrée nette
        </div>
      </Statistics>
      <br />
      Les principaux secteurs desservis par les réseaux de chaleur sont :
      <ul>
        <li>
          le secteur <b>résidentiel</b> : 52,7 % des livraisons.
        </li>
        <li>
          le secteur <b>tertiaire</b> : 35,8 % des livraisons.
        </li>
      </ul>
      <br />
      <b>
        La loi de transition énergétique pour la croissance verte de 2015 fixe
        l’objectif de multiplier par 5 la quantité de chaud et de froid
        renouvelables livrés par les réseaux en 2030, par rapport à 2012.
      </b>
      <br />
      <br />
      Des réseaux de chaleur existent dans la plupart des grandes villes, par
      exemple <Link href="/villes/paris">Paris</Link>,{' '}
      <Link href="/villes/rennes">Rennes</Link>,{' '}
      <Link href="/villes/nantes">Nantes</Link>,{' '}
      <Link href="/villes/bordeaux">Bordeaux</Link>,{' '}
      <Link href="/villes/strasbourg">Strasbourg</Link>,{' '}
      <Link href="/villes/metz">Metz</Link>,{' '}
      <Link href="/villes/grenoble">Grenoble</Link>,{' '}
      <Link href="/villes/lyon">Lyon</Link>,{' '}
      <Link href="/villes/aix-en-provence">Aix-en-Provence</Link>,...
      <Source>Source : SNCU</Source>
    </>
  );
};

export default Livraisons;
