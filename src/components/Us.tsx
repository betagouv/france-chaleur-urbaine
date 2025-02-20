import Image from 'next/image';

import { List } from '@/components/Ressources/Contents/Contents.styles';
import TextList from '@/components/TextList';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';
import Section, { SectionContent, SectionHeading, SectionTitle } from '@/components/ui/Section';
import { Table } from '@/components/ui/Table';
import dataNumberFcu from '@/data/home/data-number-fcu';
const Us = () => {
  return (
    <>
      <Hero variant="ressource">
        <HeroTitle>Qui sommes-nous&nbsp;?</HeroTitle>
        <HeroSubtitle className="flex items-center gap-8">
          <span className="fr-logo inline-block w-[135px]">République Française</span>
          <span>
            France Chaleur Urbaine est un <b>service gratuit proposé par l’État</b> qui promeut le chauffage urbain, afin de répondre à
            trois enjeux majeurs : la lutte contre le changement climatique, la maîtrise du tarif des énergies et la sécurité
            d’approvisionnement. France Chaleur Urbaine agit en <b>tiers de confiance</b> en mettant en relation les copropriétaires et
            gestionnaires de bâtiments tertiaires avec les opérateurs des réseaux de chaleur.
          </span>
        </HeroSubtitle>
      </Hero>
      <Section>
        <SectionTitle>Nos missions</SectionTitle>
        <SectionContent>
          <List>
            <li>
              <b>Outiller</b> : Mise à disposition d’outils afin de valoriser les réseaux de chaleur : test de raccordement, cartographie
              des réseaux, simulateur de CO2...
            </li>
            <li>
              <b>Informer</b> : Centralisation d’informations et de données sur les réseaux de chaleur et potentiels de raccordement.
            </li>
            <li>
              <b>Mettre en lien</b> : Mise en relation de prospects intéressés par la solution réseau de chaleur avec les gestionnaires des
              réseaux les plus proches
            </li>
          </List>
        </SectionContent>
      </Section>
      <Section variant="light">
        <SectionTitle>L'équipe</SectionTitle>
        <SectionContent>
          <List>
            <li>
              <b>DRIEAT</b> : La Direction régionale et interdépartementale de l’environnement, de l’aménagement et des transports (DRIEAT)
              d’Ile-de-France porte le projet. Florence Lévy, chargée de mission transition énergétique, pilote le projet en tant
              qu’intrapreneuse.
              <br />
              En savoir plus :{' '}
              <Link href="https://www.drieat.ile-de-france.developpement-durable.gouv.fr/" isExternal>
                https://www.drieat.ile-de-france.developpement-durable.gouv.fr/
              </Link>
            </li>
            <li>
              <b>BETA.GOUV.FR</b> : France Chaleur Urbaine est une start-up d’Etat du programme Beta.gouv.fr de la Direction
              interministérielle du numérique (DINUM), qui aide les administrations publiques à construire des services numériques utiles,
              simples et faciles à utiliser. À ce titre, une équipe de freelances (designer, chargés de déploiement, développeurs...)
              accompagne le projet.
              <br />
              En savoir plus :{' '}
              <Link href="https://beta.gouv.fr" isExternal>
                beta.gouv.fr
              </Link>
            </li>
          </List>
        </SectionContent>
      </Section>
      <Section>
        <SectionTitle>Notre budget</SectionTitle>
        <SectionContent>
          <p>
            En tant que service public numérique, nous sommes transparents sur les ressources allouées et la manière dont elles sont
            employées. Les dépenses réalisées dans le cadre de France Chaleur Urbaine sont présentées ci-dessous par source de financement.{' '}
            <strong>Elles servent à plus de 95 % à financer l’équipe de freelances impliquée sur le projet</strong>. La répartition par
            poste est également précisée ci-dessous. En complément de ces dépenses, un ETP est mis à disposition par la DRIEAT
            (intrapreneuse).
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Image
              src="/img/qui-sommes-nous/repartition-financements-france-chaleur-urbaine.webp"
              alt="Budget de France Chaleur Urbaine"
              width={492}
              height={400}
              priority
              className="mx-auto"
            />
          </div>
          <SectionHeading as="h3" className="text-center">
            Répartition par poste
          </SectionHeading>
          <Table
            className="mx-auto max-w-[500px]"
            columns={[
              { field: 'poste', headerName: 'Poste', flex: 1 },
              { field: '2023', headerName: '2023', width: 120 },
              { field: '2024', headerName: '2024', width: 120 },
            ]}
            rows={[
              { id: 1, poste: 'Développement web', '2023': '25%', '2024': '40%' },
              { id: 2, poste: 'Déploiement et animation', '2023': '33%', '2024': '32%' },
              { id: 3, poste: 'Coaching et design', '2023': '15%', '2024': '13%' },
              { id: 4, poste: 'Géomatique', '2023': '13%', '2024': '8%' },
              { id: 5, poste: 'Référencement (SEO/SEA)', '2023': '5%', '2024': '4%' },
              { id: 6, poste: 'Frais (publicité, salons…)', '2023': '9%', '2024': '4%' },
            ]}
            hideFooter
          />
        </SectionContent>
      </Section>
      <Section variant="accent">
        <SectionHeading as="h3">Au {dataNumberFcu.date}, France Chaleur Urbaine c’est :</SectionHeading>
        <TextList data={dataNumberFcu.data} />
        <i>{dataNumberFcu.note}</i>
      </Section>
    </>
  );
};

export default Us;
