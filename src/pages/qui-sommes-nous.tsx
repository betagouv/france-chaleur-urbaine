import { Bar, CartesianGrid, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { List } from '@/components/Ressources/Contents/Contents.styles';
import SimplePage from '@/components/shared/page/SimplePage';
import TextList from '@/components/TextList';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';
import Section, { SectionContent, SectionHeading, SectionTitle } from '@/components/ui/Section';
import TableSimple from '@/components/ui/table/TableSimple';
import dataNumberFcu from '@/data/home/data-number-fcu';

const QuiSommesNous = () => {
  return (
    <SimplePage
      title="Qu'est-ce que France Chaleur Urbaine ?"
      noTitleSuffix
      description="Un service de l'Etat pour accélérer le développement du chauffage urbain, un mode de chauffage écologique et local."
    >
      <Hero variant="ressource">
        <HeroTitle>Qui sommes-nous&nbsp;?</HeroTitle>
        <HeroSubtitle className="flex items-center gap-8">
          <span className="fr-logo inline-block w-[135px]">République Française</span>
          <span>
            France Chaleur Urbaine est un <b>service gratuit proposé par l'ADEME</b> qui oriente les bâtiments vers les solutions de
            chauffage écologique les plus adaptées. France Chaleur Urbaine répond à trois enjeux majeurs : la lutte contre le changement
            climatique, la maîtrise du tarif des énergies et la sécurité d'approvisionnement. Afin d'accompagner les bâtiments dans la mise
            en oeuvre concrète de solutions telles que les réseaux de chaleur, France Chaleur Urbaine agit en{' '}
            <strong>tiers de confiance</strong> en mettant en relation les copropriétaires et gestionnaires de bâtiments tertiaires avec les
            opérateurs des réseaux de chaleur.
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
          <ul className="list-none p-0 [&>li]:mb-2">
            <li>
              <b>L'ADEME</b> : Agence de la transition écologique, porte le service France Chaleur Urbaine. Céline LARUELLE, en tant
              qu’intrapreneuse et Adrien ZEMOUR, en tant qu’entrepreneur d’intérêt général pilotent le projet.
              <br />
              En savoir plus :{' '}
              <Link href="https://www.ademe.fr" isExternal>
                https://www.ademe.fr
              </Link>
            </li>
            <li>
              France Chaleur Urbaine est un service numérique public issu du programme{' '}
              <Link href="https://beta.gouv.fr" isExternal>
                Beta.gouv.fr
              </Link>
              , animé par la Direction interministérielle du numérique (DINUM), qui aide les administrations publiques à construire des
              services numériques utiles, simples et faciles à utiliser.
              <br />
              En savoir plus :{' '}
              <Link href="https://beta.gouv.fr" isExternal>
                beta.gouv.fr
              </Link>
            </li>
          </ul>
        </SectionContent>
      </Section>
      <Section>
        <SectionTitle>Notre budget</SectionTitle>
        <SectionContent>
          <p>
            En tant que service public numérique, nous sommes transparents sur les ressources allouées et la manière dont elles sont
            employées. Les dépenses réalisées dans le cadre de France Chaleur Urbaine sont présentées ci-dessous par source de financement.{' '}
            <strong>Elles servent à plus de 95 % à financer l’équipe de freelances impliquée sur le projet</strong>. La répartition par
            poste est également précisée ci-dessous. En complément de ces dépenses, un ETP (EIG) est mis à disposition par la Direction
            interministérielle du numérique (DINUM).
          </p>
          <div className="mb-8">
            <BudgetChart />
          </div>
          <SectionHeading as="h3" className="text-center">
            Répartition par poste
          </SectionHeading>
          <TableSimple
            className="mx-auto max-w-[700px]"
            columns={[
              { accessorKey: 'poste', flex: 1, header: 'Poste' },
              { accessorKey: '2023', cellType: 'Percent', header: '2023', width: '120px' },
              { accessorKey: '2024', cellType: 'Percent', header: '2024', width: '120px' },
              { accessorKey: '2025', cellType: 'Percent', header: '2025', width: '120px' },
              { accessorKey: '2026', cellType: 'Percent', header: '2026', width: '120px' },
            ]}
            data={[
              { '2023': 0.25, '2024': 0.4, '2025': 0.3, '2026': 0.4, id: 1, poste: 'Développement web' },
              { '2023': 0.33, '2024': 0.32, '2025': 0.4, '2026': 0.37, id: 2, poste: 'Déploiement et animation' },
              { '2023': 0.15, '2024': 0.13, '2025': 0.2, '2026': 0.22, id: 3, poste: 'Coaching et design' },
              { '2023': 0.13, '2024': 0.08, '2025': 0.1, '2026': 0.01, id: 4, poste: 'Géomatique' },
              { '2023': 0.05, '2024': 0.04, '2025': 0, '2026': 0, id: 5, poste: 'Référencement (SEO/SEA)' },
              { '2023': 0.09, '2024': 0.04, '2025': 0, '2026': 0, id: 6, poste: 'Frais (publicité, salons…)' },
            ]}
          />
        </SectionContent>
      </Section>
      <Section variant="accent">
        <SectionHeading as="h3">Au {dataNumberFcu.date}, France Chaleur Urbaine c’est :</SectionHeading>
        <TextList data={dataNumberFcu.data} />
        <i>{dataNumberFcu.note}</i>
      </Section>
    </SimplePage>
  );
};

export default QuiSommesNous;

type FundingSource = 'DINUM' | 'ADEME' | 'DGEC' | 'DRIEAT';

/** Yearly expenses in k€, per funding source. A missing source means no funding that year. */
type YearlyExpenses = { year: number } & Partial<Record<FundingSource, number>>;

const yearlyExpenses: YearlyExpenses[] = [
  { ADEME: 100, DGEC: 20, DINUM: 110, year: 2021 },
  { ADEME: 40, DGEC: 75, DINUM: 320, DRIEAT: 18, year: 2022 },
  { ADEME: 50, DGEC: 73, DINUM: 520, year: 2023 },
  { ADEME: 210, DGEC: 74, DINUM: 580, year: 2024 },
  { ADEME: 400, DINUM: 110, year: 2025 },
  { ADEME: 700, DINUM: 80, year: 2026 },
];

// DSFR illustrative palette (blue-france, green-menthe, orange-terre-battue, purple-glycine)
const fundingSources: { key: FundingSource; color: string }[] = [
  { color: '#6A6AF4', key: 'DINUM' },
  { color: '#009081', key: 'ADEME' },
  { color: '#E4794A', key: 'DGEC' },
  { color: '#A558A0', key: 'DRIEAT' },
];

const formatAmount = (amount: unknown) => `${String(amount)} k€`;

// Keeps legend and tooltip entries in the stack order instead of the alphabetical default
const sortByFundingSource = (item: { dataKey?: unknown }) => fundingSources.findIndex((source) => source.key === item.dataKey);

/**
 * Stacked bar chart of France Chaleur Urbaine yearly expenses per funding source.
 * Also exposes the data as an expandable text description for accessibility.
 */
function BudgetChart() {
  const chartData = yearlyExpenses.map((expenses) => ({
    ...expenses,
    total: fundingSources.reduce((sum, source) => sum + (expenses[source.key] ?? 0), 0),
  }));
  const firstYear = chartData[0].year;
  const lastYear = chartData[chartData.length - 1].year;

  return (
    <figure className="w-full max-w-150 mx-auto">
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ left: 0, right: 0, top: 24 }} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatAmount} width={70} />
          <Tooltip formatter={formatAmount} itemSorter={sortByFundingSource} />
          <Legend itemSorter={sortByFundingSource} />
          {fundingSources.map((source) => (
            <Bar
              key={source.key}
              dataKey={source.key}
              stackId="expenses"
              fill={source.color}
              stroke="#fff"
              strokeWidth={1}
              isAnimationActive={false}
            />
          ))}
          {/* Invisible line used only to place the yearly total above each stack */}
          <Line dataKey="total" stroke="none" dot={false} activeDot={false} legendType="none" tooltipType="none" isAnimationActive={false}>
            <LabelList dataKey="total" position="top" formatter={formatAmount} className="text-sm font-bold" fill="currentColor" />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
      <figcaption className="text-sm text-faded italic text-center mt-1 mb-2">
        <details>
          <summary>Dépenses annuelles par source de financement</summary>
          <div className="text-left border border-faded-light mt-2 p-2 max-w-md mx-auto">
            <p className="text-sm mb-4">
              Ce graphique montre l'évolution des dépenses annuelles de <strong>France Chaleur Urbaine</strong> par source de financement,
              entre{' '}
              <strong>
                {firstYear} et {lastYear}
              </strong>
              , exprimées en milliers d’euros (k€).
            </p>
            <ul className="list-none p-0 mb-0">
              {chartData.map((expenses) => (
                <li key={expenses.year}>
                  <strong>{expenses.year}</strong> : {formatAmount(expenses.total)} (
                  {fundingSources
                    .filter((source) => expenses[source.key])
                    .map((source) => `${source.key} ${formatAmount(expenses[source.key])}`)
                    .join(', ')}
                  )
                </li>
              ))}
            </ul>
          </div>
        </details>
      </figcaption>
    </figure>
  );
}
