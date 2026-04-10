import { List } from '@/components/Ressources/Contents/Contents.styles';
import TextList from '@/components/TextList';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import Section, { SectionContent, SectionHeading, SectionTitle } from '@/components/ui/Section';
import TableSimple from '@/components/ui/table/TableSimple';
import dataNumberFcu from '@/data/home/data-number-fcu';

const Us = () => {
  return (
    <>
      <Hero variant="ressource">
        <HeroTitle>Qui sommes-nous&nbsp;?</HeroTitle>
        <HeroSubtitle className="flex items-center gap-8">
          <span className="fr-logo inline-block w-[135px]">République Française</span>
          <span>
            France Chaleur Urbaine est un <b>service gratuit proposé par ADEME</b> qui oriente les bâtiments vers les solutions de chauffage
            écologique les plus adaptées. France Chaleur Urbaine répond à trois enjeux majeurs : la lutte contre le changement climatique,
            la maîtrise du tarif des énergies et la sécurité d'approvisionnement. Afin d'accompagner les bâtiments dans la mise en oeuvre
            concrète de solutions telles que les réseaux de chaleur, France Chaleur Urbaine agit en <strong>tiers de confiance</strong> en
            mettant en relation les copropriétaires et gestionnaires de bâtiments tertiaires avec les opérateurs des réseaux de chaleur.
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
              <b>ADEME</b> : l'Agence de la transition écologique porte le projet. Céline LARUELLE, en tant qu'intrapreneuse et Adrien
              ZEMOUR, en tant qu'entrepreneur d'intérêt général pilotent le projet.
              <br />
              En savoir plus :{' '}
              <Link href="https://www.ademe.fr" isExternal>
                https://www.ademe.fr
              </Link>
            </li>
            <li>
              <b>BETA.GOUV.FR</b> : France Chaleur Urbaine est un service numérique public issu du programme{` `}
              <Link href="https://beta.gouv.fr" isExternal>
                beta.gouv.fr
              </Link>
              , animé par la Direction interministérielle du numérique (DINUM), qui aide les administrations publiques à construire des
              services numériques utiles, simples et faciles à utiliser.
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
            poste est également précisée ci-dessous. En complément de ces dépenses, un ETP est mis à disposition par la Direction
            interministérielle du numérique (EIG)
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Image
              src="/img/qui-sommes-nous/repartition-financements-france-chaleur-urbaine.webp"
              alt="Budget de France Chaleur Urbaine"
              width={492}
              height={400}
              priority
              className="mx-auto"
              caption="Dépenses annuelles par source de financement"
              altText={`Ce graphique montre l'évolution des dépenses annuelles de **France Chaleur Urbaine** par source de financement, entre **2021 et 2024**, exprimées en milliers d’euros (k€).

**Montants totaux par année :**
- **2021** : 230 k€
- **2022** : 453 k€
- **2023** : 643 k€
- **2024** : 864 k€
- **2025** : 510 k€

**Sources de financement représentées :**
- **DINUM** (bleu foncé)
- **ADEME** (vert)
- **DGEC** (bleu clair)
- **DRIEAT** (jaune) – uniquement en 2022

**Observations :**
- La part de **DGEC** et **ADEME** progresse nettement en 2023, 2024 et 2025.
- **DRIEAT** n’apparaît que brièvement en 2022.`}
            />
          </div>
          <SectionHeading as="h3" className="text-center">
            Répartition par poste
          </SectionHeading>
          <TableSimple
            className="mx-auto max-w-[600px]"
            columns={[
              { accessorKey: 'poste', flex: 1, header: 'Poste' },
              { accessorKey: '2023', cellType: 'Percent', header: '2023', width: '120px' },
              { accessorKey: '2024', cellType: 'Percent', header: '2024', width: '120px' },
              { accessorKey: '2025', cellType: 'Percent', header: '2025', width: '120px' },
            ]}
            data={[
              { '2023': 0.25, '2024': 0.4, '2025': 0.3, id: 1, poste: 'Développement web' },
              { '2023': 0.33, '2024': 0.32, '2025': 0.4, id: 2, poste: 'Déploiement et animation' },
              { '2023': 0.15, '2024': 0.13, '2025': 0.2, id: 3, poste: 'Coaching et design' },
              { '2023': 0.13, '2024': 0.08, '2025': 0.1, id: 4, poste: 'Géomatique' },
              { '2023': 0.05, '2024': 0.04, '2025': 0, id: 5, poste: 'Référencement (SEO/SEA)' },
              { '2023': 0.09, '2024': 0.04, '2025': 0, id: 6, poste: 'Frais (publicité, salons…)' },
            ]}
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
