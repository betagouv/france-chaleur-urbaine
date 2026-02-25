import SimplePage from '@/components/shared/page/SimplePage';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import TableBasic from '@/components/ui/TableBasic';
import Tooltip from '@/components/ui/Tooltip';
import { dataSourcesVersions } from '@/modules/app/constants';

const DonneesPage = () => {
  return (
    <SimplePage
      currentPage="/donnees"
      title="Données et sources"
      description="Comprendre les données utilisées par France Chaleur Urbaine : d'où elles viennent, comment elles sont traitées et à quoi elles servent."
      layout="center"
    >
      <Heading>Données et sources</Heading>

      <section>
        <p>
          France Chaleur Urbaine met en œuvre de nombreuses données pour afficher la carte des réseaux, accompagner les porteurs de projets
          et produire des analyses statistiques. Cette page présente, de manière synthétique, les principales données utilisées, leur
          origine et leurs usages.
        </p>
        <p>
          Elle ne remplace pas la documentation technique interne, mais vise à rendre plus transparente la façon dont nous construisons et
          mettons à jour les informations affichées sur le site.
        </p>
      </section>

      <section>
        <Heading as="h2">Sources et utilisations</Heading>
        <p>
          France Chaleur Urbaine utilise des données ouvertes de sources variées pour alimenter la carte et les outils d'analyse. Comme les
          données sont généralement toutes présentes sur la carte, elles sont ordonnées selon leur affichage dans la légende de la carte.
        </p>
        <TableBasic>
          <thead>
            <tr>
              <th>Donnée</th>
              <th>Source</th>
              <th>Utilisation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th colSpan={3} className="font-semibold bg-gray-100">
                Onglet Réseaux
              </th>
            </tr>
            <tr>
              <td className="font-semibold">Réseaux de chaleur existants</td>
              <td>
                Bibliothèque FEDENE (données 2024), Données locales de l'énergie (SDES, données 2024), Arrêté DPE (2025, données 2023),
                gestionnaires de réseaux, collectivités.
                <br />
                <Link href="#detail-reseaux-chaleur-froid">Voir le détail des données</Link>
              </td>
              <td>
                Affichage dans la couche "Réseaux de chaleur". Utilisé pour les tests d'éligibilité des adresses et des analyses diverses.
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Réseaux de froid existants</td>
              <td>
                Bibliothèque FEDENE (données 2024), Données locales de l'énergie (SDES, données 2024), Arrêté DPE (2025, données 2023),
                gestionnaires de réseaux, collectivités.
                <br />
                <Link href="#detail-reseaux-chaleur-froid">Voir le détail des données</Link>
              </td>
              <td>Affichage dans la couche "Réseaux de froid".</td>
            </tr>
            <tr>
              <td className="font-semibold">Zones et réseaux en construction</td>
              <td>
                Gestionnaires de réseaux, collectivités, ADEME.
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : projets de réseaux en développement avec dates de mise en service prévues, gestionnaires.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  L'ADEME contribue également en transmettant des informations relatives aux projets de réseaux financés (création de
                  nouveaux réseaux ou extensions de réseaux).
                </p>
                <Link href="#detail-reseaux-en-construction">Voir le détail des données</Link>
              </td>
              <td>
                Affichage dans la couche "Réseaux de chaleur en construction". Utilisé pour les tests d'éligibilité des adresses et des
                analyses diverses
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Périmètres de développement prioritaire (PDP)</td>
              <td>
                Gestionnaires de réseaux, collectivités.
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : géométries, métadonnées, liens avec les réseaux existants et en construction
                </p>
                <Link href="#detail-pdp">Voir le détail des données</Link>
              </td>
              <td>
                Affichage dans la couche "Périmètres de développement prioritaire". Utilisé pour les tests d'éligibilité des adresses et des
                analyses diverses
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Bâtiments raccordés</td>
              <td>
                Source :{' '}
                <Link
                  href="https://www.statistiques.developpement-durable.gouv.fr/catalogue?page=datafile&datafileRid=49ec6b39-cf3b-4280-b25e-2a19f5dc0cfa&tab=datas"
                  isExternal
                >
                  SDES 2024
                </Link>
              </td>
              <td>
                Affichage dans la couche "Bâtiments raccordés". Identification des bâtiments déjà raccordés aux réseaux de chaleur ou de
                froid
              </td>
            </tr>

            <tr>
              <th colSpan={3} className="font-semibold bg-gray-100">
                Onglet Potentiel
              </th>
            </tr>
            <tr>
              <td className="font-semibold">
                Demandes de raccordement{' '}
                <Tooltip title="Demandes déposées par les particuliers et professionnels pour une mise en relation avec les gestionnaires des réseaux de chaleur ouverts aux raccordements." />
              </td>
              <td>
                FCU
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : demandes déposées par les particuliers et professionnels pour une mise en relation avec les gestionnaires des
                  réseaux de chaleur.
                </p>
              </td>
              <td>
                Affichage dans la couche "Demandes de raccordement sur France Chaleur Urbaine". Utilisées par les gestionnaires pour le
                suivi des demandes.
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Consommations de gaz par adresse</td>
              <td>
                <Link href="https://www.statistiques.developpement-durable.gouv.fr/donnees-locales-de-consommation-denergie" isExternal>
                  Données locales de consommation d'énergie (SDES)
                </Link>{' '}
                <span className="text-gray-600">(année 2024)</span>
                <p className="text-sm text-gray-600 mt-1">
                  Données mises à disposition conformément à l'article 179 de la loi de transition énergétique pour la croissance verte
                  (LTECV) du 17 août 2015.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : consommation annuelle par adresse (MWh/an), nombre de points de livraison (PDL), sectorisation (logements,
                  tertiaire, industrie).
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Les données du secteur résidentiel font l'objet d'une secrétisation par le SDES : seules sont diffusées les consommations
                  à l'adresse d'au moins 10 logements ou supérieures à 200 MWh.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Note : les bâtiments équipés d'une chaudière de puissance élevée sont parfois catégorisés par erreur dans le secteur
                  Industrie.
                </p>
              </td>
              <td>
                Affichage dans la couche "Consommations de gaz". Utilisé dans le calcul de densité thermique linéaire et d'extraction des
                données sur les bâtiments.
              </td>
            </tr>
            <tr>
              <td className="font-semibold">BDNB</td>
              <td>
                <Link href="https://www.data.gouv.fr/datasets/base-de-donnees-nationale-des-batiments/" isExternal>
                  Base de données nationale des bâtiments (BDNB)
                </Link>{' '}
                <span className="text-gray-600">(BDNB 2024-10.a)</span>
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : géométrie des bâtiments (polygones), nombre de logements, DPE représentatif, type d'énergie de chauffage, type
                  d'installation (collectif/individuel), adresses
                </p>
              </td>
              <td>
                Affichage dans les couches "Caractéristiques des bâtiments" (DPE), "Bâtiments chauffés au gaz collectif" et "Bâtiments
                chauffés au fioul collectif" (selon le type de chauffage). Utilisé dans de nombreuses analyses pour identifier des bâtiments
                raccordables.
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Besoins en chaleur des bâtiments</td>
              <td>
                Modélisations Cerema (projet{' '}
                <Link href="https://reseaux-chaleur.cerema.fr/cartographie-nationale-besoins-chaleur-froid" isExternal>
                  EnRezo
                </Link>
                ) - août 2024
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : besoins énergétiques modélisés par bâtiment (consommation de chauffage en MWh)
                </p>
              </td>
              <td>Affichage dans la couche "Besoins en chaleur", calculs de densité thermique linéaire</td>
            </tr>
            <tr>
              <td className="font-semibold">Besoins en froid</td>
              <td>
                Modélisations Cerema (projet{' '}
                <Link href="https://reseaux-chaleur.cerema.fr/cartographie-nationale-besoins-chaleur-froid" isExternal>
                  EnRezo
                </Link>
                ) - août 2024
              </td>
              <td>Affichage dans la couche "Besoins en froid"</td>
            </tr>
            <tr>
              <td className="font-semibold">Zones d'opportunité pour la création de réseaux de chaleur</td>
              <td>
                Modélisations Cerema (projet{' '}
                <Link href="https://reseaux-chaleur.cerema.fr/cartographie-zones-opportunite-reseaux-chaleur-froid" isExternal>
                  EnRezo
                </Link>
                ) - juin 2024
                <p className="text-sm text-gray-600 mt-1">Contenu : zones à potentiel et à fort potentiel (chaud/fort chaud)</p>
              </td>
              <td>
                Affichage dans la couche "Zones d'opportunité pour la création de réseaux de chaleur". Utilisé pour identifier les communes
                à fort potentiel pour la création de réseaux de chaleur.
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Zones d'opportunité pour la création de réseaux de froid</td>
              <td>
                Modélisations Cerema (projet{' '}
                <Link href="https://reseaux-chaleur.cerema.fr/cartographie-zones-opportunite-reseaux-chaleur-froid" isExternal>
                  EnRezo
                </Link>
                ) - décembre 2024
                <p className="text-sm text-gray-600 mt-1">Contenu : zones à potentiel et à fort potentiel (froid/fort froid)</p>
              </td>
              <td>Affichage dans la couche "Zones d'opportunité pour la création de réseaux de froid"</td>
            </tr>
            <tr>
              <td className="font-semibold">Communes à fort potentiel pour la création de réseaux de chaleur</td>
              <td>
                FCU. Calculé à partir des communes disposant d’au moins une zone à fort potentiel chaleur et ne présentant aucun réseau de
                chaleur existant ou en construction, évalué à partir de la géométrie communale réduite de 150 m*.
                <br />* La géométrie communale est réduite de 150 m pour éviter de comptabiliser les réseaux limitrophes qui dépassent leur
                communes d'implantation.
              </td>
              <td>Affichage dans la couche "Communes à fort potentiel pour la création de réseaux de chaleur"</td>
            </tr>
            <tr>
              <td className="font-semibold">Zones à urbaniser</td>
              <td>
                Cerema - juillet 2024.{' '}
                <Link href="https://www.geoportail-urbanisme.gouv.fr/services/" isExternal>
                  Géoportail de l'urbanisme
                </Link>
              </td>
              <td>Affichage dans la couche "Zones à urbaniser".</td>
            </tr>
            <tr>
              <td className="font-semibold">Besoins en chaleur du secteur industriel</td>
              <td>
                Modélisations Cerema (projet{' '}
                <Link href="https://reseaux-chaleur.cerema.fr/cartographie-nationale-besoins-chaleur-froid" isExternal>
                  EnRezo
                </Link>
                ) - juin 2024
              </td>
              <td>
                Identification des territoires industriels à fort besoin de chaleur sur la carte, agrégation par commune dans les résumés de
                zones
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Études en cours</td>
              <td>
                ADEME, information actuellement limitée à l'Île-de-France
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : communes couvertes par une étude pour la création de réseaux de chaleur
                </p>
              </td>
              <td>Affichage dans la couche "Communes couvertes par une étude pour la création de réseaux"</td>
            </tr>
            <tr>
              <td className="font-semibold">Quartiers prioritaires de la politique de la ville (QPV)</td>
              <td>
                <Link href="https://www.data.gouv.fr/fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/" isExternal>
                  ANCT
                </Link>{' '}
                <span className="text-gray-600">(février 2025)</span>
                <p className="text-sm text-gray-600 mt-1">
                  Note : Les quartiers engagés dans le Nouveau Programme National de Renouvellement Urbain (ANRU) sont basés sur les
                  périmètres 2015
                </p>
              </td>
              <td>Affichage dans la couche "Quartiers prioritaires de la politique de la ville"</td>
            </tr>

            <tr>
              <th colSpan={3} className="font-semibold bg-gray-100">
                Onglet EnR&R
              </th>
            </tr>
            <tr>
              <th colSpan={3} className="bg-gray-50 pl-8">
                Mobilisables
              </th>
            </tr>
            <tr>
              <td className="font-semibold">Chaleur fatale</td>
              <td>
                Inventaire Cerema (projet{' '}
                <Link href="https://reseaux-chaleur.cerema.fr/cartographie-enr-mobilisables" isExternal>
                  EnRezo
                </Link>
                ) des gisements de chaleur fatale (unités d'incinération, industrie, stations d'épuration, datacenters, installations
                électrogènes)
              </td>
              <td>Affichage dans la couche "Chaleur fatale"</td>
            </tr>
            <tr>
              <td className="font-semibold">Géothermie profonde</td>
              <td>
                BRGM et ADEME, via le portail{' '}
                <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                  geothermies.fr
                </Link>
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : gisements potentiels ou prouvés de géothermie profonde en France pour la production de chaleur
                </p>
              </td>
              <td>Affichage dans la couche "Géothermie profonde"</td>
            </tr>
            <tr>
              <td className="font-semibold">Ressources géothermales sur nappes</td>
              <td>
                BRGM et ADEME, via le portail{' '}
                <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                  geothermies.fr
                </Link>
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : potentiel de géothermie sur nappes pour la production de chaleur ou de froid
                </p>
              </td>
              <td>Affichage dans la couche "Ressources géothermales sur nappes"</td>
            </tr>
            <tr>
              <td className="font-semibold">Solaire thermique</td>
              <td>
                Données Cerema (projet{' '}
                <Link href="https://reseaux-chaleur.cerema.fr/cartographie-enr-mobilisables" isExternal>
                  EnRezo
                </Link>
                ).
                <br />
                Contenu : gisements potentiels sur friches et parkings
              </td>
              <td>Affichage dans la couche "Solaire thermique"</td>
            </tr>
            <tr>
              <td className="font-semibold">Thalassothermie</td>
              <td>
                Modélisations Cerema (projet{' '}
                <Link href="https://reseaux-chaleur.cerema.fr/cartographie-enr-mobilisables" isExternal>
                  EnRezo
                </Link>
                )
              </td>
              <td>Affichage dans la couche "Thalassothermie"</td>
            </tr>
            <tr>
              <th colSpan={3} className="bg-gray-50 pl-8">
                Installations existantes
              </th>
            </tr>
            <tr>
              <td className="font-semibold">Géothermie profonde</td>
              <td>
                <ul>
                  <li>
                    Installations :{' '}
                    <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                      BRGM
                    </Link>
                  </li>
                  <li>
                    Périmètres d'exploitation :{' '}
                    <Link href="https://www.drieat.ile-de-france.developpement-durable.gouv.fr/" isExternal>
                      DRIEAT
                    </Link>{' '}
                    <span className="text-gray-600">(juin 2025)</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-1">Contenu : installations et périmètres d'exploitation de géothermie profonde</p>
              </td>
              <td>Affichage dans la couche "Géothermie profonde"</td>
            </tr>
            <tr>
              <td className="font-semibold">Géothermie de surface sur échangeurs ouverts (nappe)</td>
              <td>
                <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                  BRGM
                </Link>{' '}
                <span className="text-gray-600">(juillet 2025)</span>
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : installations et ouvrages sur échangeurs ouverts (nappe), avec distinction entre installations et ouvrages
                  déclarés et réalisés. Une installation peut être constituée d'un ou plusieurs ouvrages.
                </p>
              </td>
              <td>Affichage dans la couche "Géothermie de surface sur échangeurs ouverts (nappe)"</td>
            </tr>
            <tr>
              <td className="font-semibold">Géothermie de surface sur échangeurs fermés (sonde)</td>
              <td>
                <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                  BRGM
                </Link>{' '}
                <span className="text-gray-600">(juillet 2025)</span>
                <p className="text-sm text-gray-600 mt-1">
                  Contenu : installations et ouvrages sur échangeurs fermés (sonde), avec distinction entre installations et ouvrages
                  déclarés et réalisés. Une installation peut être constituée d'un ou plusieurs ouvrages.
                </p>
              </td>
              <td>Affichage dans la couche "Géothermie de surface sur échangeurs fermés (sonde)"</td>
            </tr>
            <tr>
              <th colSpan={3} className="font-semibold bg-gray-100">
                Autres données
              </th>
            </tr>
            <tr>
              <td className="font-semibold">Communes</td>
              <td>
                IGN –{' '}
                <Link href="https://geoservices.ign.fr/adminexpress" isExternal>
                  ADMIN-EXPRESS par territoire France Métropolitain
                </Link>{' '}
                <span className="text-gray-600">(édition février 2025)</span>
              </td>
              <td>Utilisé pour obtenir les contours communaux et utilisé dans des calculs et extractions de données.</td>
            </tr>
            <tr>
              <td className="font-semibold">Départements</td>
              <td>
                IGN –{' '}
                <Link href="https://geoservices.ign.fr/adminexpress" isExternal>
                  ADMIN-EXPRESS par territoire France Métropolitain
                </Link>{' '}
                <span className="text-gray-600">(édition février 2025)</span>
              </td>
              <td>Utilisé dans des calculs et extractions de données.</td>
            </tr>
            <tr>
              <td className="font-semibold">Régions</td>
              <td>
                IGN –{' '}
                <Link href="https://geoservices.ign.fr/adminexpress" isExternal>
                  ADMIN-EXPRESS par territoire France Métropolitain
                </Link>{' '}
                <span className="text-gray-600">(édition février 2025)</span>
              </td>
              <td>Utilisé dans des calculs et extractions de données.</td>
            </tr>
          </tbody>
        </TableBasic>
      </section>

      <section>
        <Heading as="h2" id="detail-donnees-reseaux" anchorLink>
          Détail des données sur les réseaux de chaleur et de froid
        </Heading>
        <p>
          Les données sur les réseaux de chaleur et de froid sont constituées de plusieurs champs provenant de différentes sources. France
          Chaleur Urbaine agrège ces données pour les réseaux de chaleur, de froid, en construction et les périmètres de développement
          prioritaire (PDP).
        </p>
        <p>
          De manière générale, l'enquête annuelle de la FEDENE Réseaux de chaleur & froid permet à France Chaleur Urbaine de connaître les
          réseaux de chaleur et de froid existants et de solliciter les gestionnaires de réseaux et collectivités pour obtenir des
          informations sur les réseaux et notamment les tracés. Parfois, ce sont aussi les gestionnaires ou collectivités qui nous
          fournissent directement des données.
        </p>
        <p>
          Ces données sont{' '}
          <Link href="https://www.data.gouv.fr/fr/datasets/traces-des-reseaux-de-chaleur-et-de-froid/" isExternal>
            publiées en open data
          </Link>{' '}
          de façon mensuelle.{' '}
        </p>

        <div>
          <Heading as="h3" id="detail-reseaux-chaleur-froid" anchorLink>
            Réseaux de chaleur (+ froid si applicable)
          </Heading>
          <TableBasic>
            <thead>
              <tr>
                <th>Champ</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th colSpan={2} className="bg-gray-50 pl-8">
                  Informations spécifiques
                </th>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>géométrie (tracé)</li>
                  </ul>
                </td>
                <td>
                  Les tracés des réseaux de chaleur et de froid sont agrégés par France Chaleur Urbaine et fournis par les exploitants et
                  collectivités via notre <Link href="/contribution">formulaire de contribution</Link> ou par d'autres canaux (mails, etc.).
                  <br />
                  Quand ils sont disponibles au format géographique, les tracés sont utilisés tels quels. Sinon quand ils sont au format
                  PDF, ils sont extraits par France Chaleur Urbaine pour en faire une version géographique exploitable.
                </td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>informations complémentaires</li>
                  </ul>
                </td>
                <td>
                  Information textuelle libre fournie par le gestionnaire ou le maître d'ouvrage via notre{' '}
                  <Link href="/contribution">formulaire de contribution</Link>. Peut également contenir des fichiers joints. Contient
                  généralement le schéma directeur du réseau.
                </td>
              </tr>
              <tr>
                <th colSpan={2} className="bg-gray-50 pl-8">
                  Informations administratives
                </th>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>nom du réseau</li>
                    <li>identifiant SNCU</li>
                    <li>année de création</li>
                    <li>gestionnaire</li>
                    <li>maître d'ouvrage</li>
                    <li>site internet</li>
                  </ul>
                </td>
                <td>
                  Source :{' '}
                  <Link href={dataSourcesVersions.bibliothequeFedene.link} isExternal>
                    {dataSourcesVersions.bibliothequeFedene.title}
                  </Link>
                  <br />
                  Complété par France Chaleur Urbaine
                </td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>nombre de PDL</li>
                  </ul>
                </td>
                <td>
                  Source :{' '}
                  <Link href={dataSourcesVersions.bibliothequeFedene.link} isExternal>
                    {dataSourcesVersions.bibliothequeFedene.title}
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>réseau classé</li>
                  </ul>
                </td>
                <td>
                  Source :{' '}
                  <Link href={dataSourcesVersions.arreteDpe.link} isExternal>
                    Arrêté du {dataSourcesVersions.arreteDpe.releaseDate}
                  </Link>{' '}
                  relatif au classement des réseaux de chaleur et de froid.
                  <br />
                  Cet arrêté recense les réseaux qui répondent aux critères du classement automatique. Les collectivités ayant délibéré pour
                  s'opposer au classement peuvent remonter l'information à France Chaleur Urbaine pour actualisation.
                </td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>longueur</li>
                  </ul>
                </td>
                <td>
                  Source : Enquête Annuelle sur les Réseaux de Chaleur et de Froid (EARCF) pour 2021
                  <br />
                  Données 2021 car plus précises. Les années suivantes contiennent des fourchettes dans la bibliothèque FEDENE.
                  <br />
                  Les données 2021 ont été transmises à France Chaleur Urbaine par l'association ViaSeva, et par Engie Solutions pour les
                  réseaux opérés par Engie Solutions.
                </td>
              </tr>
              <tr>
                <th colSpan={2} className="bg-gray-50 pl-8">
                  Informations environnementales
                </th>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>contenu CO2</li>
                    <li>contenu CO2 ACV</li>
                    <li>taux EnR&R</li>
                    <li>année de référence</li>
                  </ul>
                </td>
                <td>
                  Source :{' '}
                  <Link href={dataSourcesVersions.arreteDpe.link} isExternal>
                    Arrêté du {dataSourcesVersions.arreteDpe.releaseDate}
                  </Link>{' '}
                  relatif au classement des réseaux de chaleur et de froid.
                </td>
              </tr>
              <tr>
                <th colSpan={2} className="bg-gray-50 pl-8">
                  Données techniques
                </th>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>productions en MWh par source (gaz, charbon, fioul, etc)</li>
                    <li>livraisons de chaleur en MWh par secteur (résidentiel, tertiaire, industrie, agriculture, autre)</li>
                    <li>rendement de distribution</li>
                  </ul>
                </td>
                <td>
                  Source :{' '}
                  <Link href={dataSourcesVersions.bibliothequeFedene.link} isExternal>
                    {dataSourcesVersions.bibliothequeFedene.title}
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>puissance installée en MW</li>
                  </ul>
                </td>
                <td>
                  Source :{'  '}
                  <Link href={dataSourcesVersions.donneesLocalesEnergieReseaux.link} isExternal>
                    {dataSourcesVersions.donneesLocalesEnergieReseaux.title}
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>distribution chaleur via réseau eau chaude</li>
                    <li>distribution chaleur via réseau eau surchauffée</li>
                    <li>distribution chaleur via réseau vapeur</li>
                  </ul>
                </td>
                <td>
                  Source : Enquête Annuelle sur les Réseaux de Chaleur et de Froid (EARCF) pour 2021
                  <br />
                  Données 2021 car plus précises. Les années suivantes ont juste un indicateur de présence oui/non.
                  <br />
                  Les données 2021 ont été transmises à France Chaleur Urbaine par l'association ViaSeva, et par Engie Solutions pour les
                  réseaux opérés par Engie Solutions.
                </td>
              </tr>
              <tr>
                <th colSpan={2} className="bg-gray-50 pl-8">
                  Données économiques
                </th>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>prix moyen</li>
                    <li>prix moyen logement</li>
                    <li>prix moyen tertiaire</li>
                    <li>part variable</li>
                    <li>part fixe</li>
                    <li>développement du réseau</li>
                  </ul>
                </td>
                <td>
                  Source :{' '}
                  <Link href="https://fedene.fr/ressource/bibliotheque-de-donnees-des-reseaux-de-chaleur-et-de-froid-2/" isExternal>
                    Bibliothèque FEDENE 2025
                  </Link>{' '}
                  (données 2024)
                  <br />
                  Disponible pour les réseaux classés, sauf opposition du maître d'ouvrage ou gestionnaire du réseau
                </td>
              </tr>
            </tbody>
          </TableBasic>

          <p>
            La FEDENE Réseaux de chaleur & froid met à disposition un{' '}
            <Link href="https://fedene.fr/wp-content/uploads/2024/05/EARCF-2024_Guide-methodologique-v2.pdf" isExternal>
              guide méthodologique
            </Link>{' '}
            qui décrit les données recueillies et calculs réalisés pour la compilation des données de l'enquête annuelle.
          </p>
        </div>

        <div>
          <Heading as="h3" id="detail-reseaux-en-construction" anchorLink>
            Zones et réseaux en construction
          </Heading>
          <TableBasic>
            <thead>
              <tr>
                <th>Champ</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>géométrie (tracé ou zone)</li>
                  </ul>
                </td>
                <td>
                  Les tracés et zones de réseaux en construction sont fournis par les gestionnaires et collectivités via notre{' '}
                  <Link href="/contribution">formulaire de contribution</Link> ou par d'autres canaux (mails, etc.).
                </td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>communes</li>
                    <li>département</li>
                    <li>région</li>
                  </ul>
                </td>
                <td>Calculé automatiquement à partir de la géométrie.</td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>gestionnaire</li>
                  </ul>
                </td>
                <td>Fourni par les gestionnaires et collectivités.</td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>mise en service</li>
                  </ul>
                </td>
                <td>Date prévue de mise en service fournie par les gestionnaires et collectivités.</td>
              </tr>
            </tbody>
          </TableBasic>
        </div>

        <div>
          <Heading as="h3" id="detail-pdp" anchorLink>
            Périmètres de développement prioritaire (PDP)
          </Heading>
          <TableBasic>
            <thead>
              <tr>
                <th>Champ</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>géométrie (zone)</li>
                  </ul>
                </td>
                <td>
                  Les zones de PDP sont fournies par les gestionnaires et collectivités via notre{' '}
                  <Link href="/contribution">formulaire de contribution</Link> ou par d'autres canaux (mails, etc.).
                </td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>identifiant réseau</li>
                  </ul>
                </td>
                <td>Identifiant SNCU du réseau de chaleur associé au PDP.</td>
              </tr>
              <tr>
                <td className="font-semibold">
                  <ul>
                    <li>communes</li>
                    <li>département</li>
                    <li>région</li>
                  </ul>
                </td>
                <td>Calculé automatiquement à partir de la géométrie.</td>
              </tr>
            </tbody>
          </TableBasic>
        </div>
      </section>

      <section className="mb-10 space-y-6">
        <Heading as="h2">Outils d'analyse et traitements</Heading>
        <p>
          Au-delà de l'affichage cartographique, certaines données sont mobilisées spécifiquement pour certains{' '}
          <Link href="/carte?tabId=outils">outils de la carte</Link>.
        </p>

        <div>
          <p className="font-semibold mb-1">Extraire des données sur les bâtiments</p>
          <p>
            Permet d'obtenir un résumé des données dans un polygone géographique dessiné par l'utilisateur. Les données agrégées incluent :
          </p>
          <ul className="list-disc space-y-1 pl-6 mt-2 text-sm text-gray-600">
            <li>
              <b>Consommations de gaz</b> : agrégation des consommations de gaz (SDES), avec distinction par secteur et calcul d'indicateur
              de proximité aux réseaux (à moins de 50 m)
            </li>
            <li>
              <b>Bâtiments collectifs avec chauffage gaz ou fioul</b> : identification des caractéristiques des bâtiments (BDNB), avec
              nombre de logements, type d'énergie, adresse, indicateur de proximité
            </li>
            <li>
              <b>Longueur de réseau</b> : calcul de la longueur totale des réseaux de chaleur intersectant la zone
            </li>
          </ul>
          <p className="mt-2 text-sm text-gray-600">
            Les résultats peuvent être exportés au format Excel ou CSV, avec un fichier par type de données.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">Calculer une densité thermique linéaire</p>
          <p>
            Permet d'évaluer les potentiels le long d'un tracé (par exemple une future conduite de réseau). Les calculs sont effectués à
            deux distances de référence (10 mètres et 50 mètres) et incluent :
          </p>
          <ul className="list-disc space-y-1 pl-6 mt-2 text-sm text-gray-600">
            <li>
              <b>Consommation de gaz</b> : cumul des consommations de gaz, avec calcul de la densité thermique linéaire (cumul divisé par la
              longueur du tracé)
            </li>
            <li>
              <b>Besoins en chaleur</b> : cumul des besoins en chaleur des bâtiments (Cerema), avec calcul de la densité thermique linéaire
            </li>
          </ul>
        </div>
      </section>

      <section>
        <Heading as="h2">Fréquence de mise à jour et limites</Heading>
        <p>
          Les données utilisées par France Chaleur Urbaine proviennent de sources variées, avec des fréquences de mise à jour différentes
          (généralement des mises à jour annuelles d'open data, chantiers ponctuels de consolidation, etc.).
        </p>
        <p>
          Nous nous efforçons de préciser, pour chaque jeu de données, la période de validité et la date de dernière mise à jour connue.
          Malgré ces efforts, il peut subsister des écarts ponctuels entre la réalité de terrain et les informations affichées, notamment
          lors de phases de travaux ou de modifications récentes de réseaux.
        </p>
        <p>
          Si vous identifiez une incohérence ou si vous souhaitez en savoir plus sur un jeu de données en particulier, vous pouvez nous
          contacter via le formulaire de contact ou par courriel ; cela nous aide à améliorer en continu la qualité de l'information
          proposée.
        </p>
      </section>
    </SimplePage>
  );
};

export default DonneesPage;
