import Link from 'next/link';
import { CenteredImage } from './Contents.styles';

const History = () => {
  return (
    <>
      Les premiers réseaux de chaleur ont été{' '}
      <b>créés au début du 20ème siècle</b> dans quelques grandes villes, dont
      les besoins en chaleur étaient importants et où le chauffage urbain
      apparaissait comme une solution idéale pour lutter contre les
      inconvénients du chauffage individuel au charbon ou au bois.
      <br />
      <br />
      <b>Sur Paris</b>, l’activité de la Compagnie Parisienne de Chauffage
      Urbain débute ainsi en 1927. Le réseau compte la gare de Lyon parmi ses
      premiers clients, et séduit alors par le fait qu’il permette une
      fourniture de chaleur sans interruption et limite les risques d’incendies
      dans les immeubles.
      <br />
      <br />
      <b>Entre les années 1950 et 1970</b>, l’urbanisation est forte en France
      et le déploiement de nouvelles zones d’habitation s’accompagne souvent de
      la construction d’un réseau de chauffage urbain, alors généralement
      alimenté par du gaz ou du fioul.
      <br />
      <br />
      <b>
        Les chocs pétroliers de 1973 et 1981 amènent les pouvoirs publics à
        chercher une diversification du mix énergétique national.
      </b>{' '}
      Les pistes explorées en s’appuyant sur des réseaux de chaleur sont alors
      le recours à la <b>géothermie profonde</b> (au Dogger) et{' '}
      <b>la chaleur issue de l’incinération des ordures ménagères</b>, notamment
      en Île-de-France, où la ressource est disponible et la densité de
      construction élevée. De nouveaux réseaux de chaleur font appel à ces
      sources de chaleur, d’anciens réseaux modifient leur mix énergétique. La
      compétence des collectivités en matière d’établissement de réseaux de
      chaleur est consacrée dans la loi chaleur du 15 juillet 1980.
      <br />
      <br />
      Le <b>contre-choc pétrolier de 1986</b> se conjugue à une vague de
      libéralisme et le <b>sujet énergie devient moins prioritaire</b>. Le baril
      de pétrole s’effondre puis va demeurer dans une fourchette de bas prix
      (entre 15 à 25 $/baril) pendant presque une vingtaine d’années. C’est le
      coup d’arrêt des investissements dans les énergies renouvelables qui ne
      sont plus rentables par rapport au fioul ou au gaz dont les prix sont
      indexés sur ceux du pétrole.
      <br />
      <br />
      <b>Il faut attendre 2005 avec la loi POPE</b> (première loi de
      Programmation des Orientations de la Politique Energétique) puis{' '}
      <b>les lois Grenelle de 2009 et 2010</b> pour que{' '}
      <b>
        les réseaux de chaleur reconquièrent une place importante dans la
        politique énergétique nationale
      </b>
      . Il leur est confié la mission de se développer et de contribuer de façon
      importante à l’augmentation des énergies renouvelables dans le mix
      énergétique national.
      <br />
      <br />
      <b>
        La loi de transition énergétique pour la croissance verte de 2015
        définit un objectif de multiplication par 5 de la quantité de chaleur et
        de froid renouvelable livrée par les réseaux en 2030, par rapport à
        2012.
      </b>
      <br />
      <br />
      Aujourd’hui, différents dispositifs sont mis en place par l’État pour
      soutenir le développement de la filière. Des réseaux de chaleur existent
      dans la plupart des grandes villes, par exemple{' '}
      <Link href="/villes/paris">Paris</Link>,{' '}
      <Link href="/villes/rennes">Rennes</Link>,{' '}
      <Link href="/villes/nantes">Nantes</Link>,{' '}
      <Link href="/villes/bordeaux">Bordeaux</Link>,{' '}
      <Link href="/villes/strasbourg">Strasbourg</Link>,{' '}
      <Link href="/villes/metz">Metz</Link>,{' '}
      <Link href="/villes/grenoble">Grenoble</Link>,{' '}
      <Link href="/villes/lyon">Lyon</Link>,{' '}
      <Link href="/villes/aix-en-provence">Aix-en-Provence</Link>,...
      <br />
      <br />
      <CenteredImage>
        <img
          src="/img/ressources-histoire.jpg"
          alt="Chaufferie de la ZUP de Meaux, 1968"
        />
        <div>Chaufferie de la ZUP de Meaux, 1968 (Crédit : Terra)</div>
      </CenteredImage>
    </>
  );
};

export default History;
