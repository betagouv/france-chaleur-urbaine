import Chart from 'react-google-charts';
import { Container, GraphWrapper } from './Graph.style';

const Graph = ({
  title,
  errors,
  data,
  formatedData,
  large,
  withSum,
}: {
  title: string;
  errors: any;
  data: any;
  formatedData: any[];
  date?: boolean;
  large?: boolean;
  withSum?: boolean;
}) => {
  const total = formatedData
    .slice(1)
    .reduce((acc, current) => acc + current[1], 0);
  return (
    <Container large={large}>
      <GraphWrapper>
        {errors ? (
          <div>
            Erreur lors du chargement des données statistiques, veuillez nous
            excuser et réessayer plus tard.
          </div>
        ) : !data ? (
          'Chargement des données...'
        ) : (
          <Chart
            height={'400px'}
            chartType="LineChart"
            chartLanguage="FR-fr"
            loader={<div>Chargement du graphe...</div>}
            data={formatedData}
            options={{
              title: withSum ? `${title} - ${total} au total` : title,
              colors: ['#0078f3', '#f60700', '#1f8d49', '#009099'],
              hAxis: {
                slantedText: true,
                slantedTextAngle: 30,
                format: 'MMMM YYYY',
              },
            }}
          />
        )}
      </GraphWrapper>
    </Container>
  );
};

export default Graph;
