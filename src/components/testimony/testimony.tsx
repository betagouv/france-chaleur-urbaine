import { PageTitle } from '@components/testimony/testimony.style';

function Testimony() {
  return (
    <div className="fr-my-2w">
      <PageTitle className="fr-mb-4w">Ils témoignent...</PageTitle>
      <p>
        “Grâce à notre raccordement au réseau géothermique, nous sommes fiers de
        contribuer à notre niveau à la transition énergétique. Nous apprécions
        le service apporté par l’exploitant du réseau depuis près de 20 ans
        déjà”
        <br />
        <strong>
          M. Maury, président de conseil syndical, Le Prieuré, Fresnes
        </strong>
      </p>
      <p>
        “Belle satisfaction pour un confort thermique inégalé, aucun problème
        technique, correspondants CGCU compétents et disponibles. Confiance
        totale à ce jour et promesses tenues sur l’ensemble du dossier”
        <br />
        <strong>
          M. Pierrot, membre du conseil syndical, les Peupliers, Le Mée sur
          Seine
        </strong>
      </p>
    </div>
  );
}

export default Testimony;
