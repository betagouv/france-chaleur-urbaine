import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import Slice from '@components/Slice/Slice';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText/WrappedText';
import Link from 'next/link';

const Owner = () => {
  return (
    <Slice
      padding={8}
      id="decrettertiaire"
      header={`##### VOUS ÊTES PROPRIÉTAIRE OU EXPLOITANT  
##### D'UN ÉTABLISSEMENT TERTIAIRE`}
      direction="row"
      className="presentation-rcu-tertiaire"
    >
      <WrappedBlock
        direction="column"
        className="presentation-rcu-tertiaire-cartridge"
      >
        <WrappedText
          body={`
Vos bâtiments présentent une surface d’activités tertiaires (ou un cumul de surfaces) égale ou supérieure à 1 000 m²&nbsp;?  

**-> vous êtes assujettis au dispositif éco-énergie tertiaire&nbsp;!**  

Pour atteindre les objectifs du dispositif, vous pouvez optimiser l'exploitation de vos bâtiments, moderniser vos équipements, ou encore engager des travaux de rénovation énergétique.  

**C’est aussi le moment de changer votre mode de chauffage pour [une solution moins émettrice de gaz à effet de serre](/ressources/role#contenu)&nbsp;!**
    `}
        >
          <Cartridge theme="grey">
            <h4>Obligation</h4>
            <p>
              <b>
                de réduction des consommations d’énergie finale de l’ensemble du
                parc tertaire d’au moins :
              </b>
            </p>
            <div className="presentation-rcu-tertiaire-cartridges">
              <Cartridge theme="yellow">
                <b>-40%</b> en 2030
              </Cartridge>
              <Cartridge theme="yellow">
                <b>-50%</b> en 2040
              </Cartridge>
              <Cartridge theme="yellow">
                <b>-60%</b> en 2050
              </Cartridge>
            </div>
            <Link
              href="https://www.ecologie.gouv.fr/sites/default/files/20064_EcoEnergieTertiaire-4pages-web.pdf"
              target="_blank"
            >
              En savoir plus
            </Link>
          </Cartridge>
        </WrappedText>
      </WrappedBlock>

      <WrappedBlock
        direction="column"
        className="presentation-rcu-tertiaire-body"
      >
        <WrappedText
          body={`
![Attention](./icons/picto-warning.svg)  
Le 13 avril 2022, un arrêté modifiant celui du 10 avril 2020 relatif aux obligations d’actions de réduction des consommations d’énergie finale dans des bâtiments à usage tertiaire a été publié.  

Il spécifie qu’**un coefficient de 0,77 sera appliqué aux consommations d’énergie des bâtiments raccordés aux réseaux de chaleur.** 
`}
        >
          <Cartridge theme="color">
            <p>Se raccorder à un réseau de chaleur, c’est jusqu'à :</p>
            <div className="presentation-rcu-tertiaire-cartridge-conso fr-mb-3w">
              <strong>23%</strong>
              <span>
                de réduction de consommations d’énergie comptabilisée !
              </span>
            </div>
            (en fonction du mode de chauffage initial)
          </Cartridge>
        </WrappedText>
      </WrappedBlock>
    </Slice>
  );
};

export default Owner;
