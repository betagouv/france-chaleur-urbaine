import Chart from 'react-google-charts';
import { Container, GraphTitle, GraphWrapper } from './Graph.style';

const Graph = ({
  title,
  errors,
  data,
  formatedData,
}: {
  title: string;
  errors: any;
  data: any;
  formatedData: any[];
}) => {
  return (
    <Container>
      <GraphTitle>{title}</GraphTitle>
      <GraphWrapper>
        {errors ? (
          <div>
            Erreur lors du chargement des données statistique, veuillez nous
            excuser et re-essayer plus tard.
          </div>
        ) : !data ? (
          'Chargement des données...'
        ) : (
          <Chart
            height={'400px'}
            chartType="LineChart"
            loader={<div>Loading Chart</div>}
            data={formatedData}
            options={{
              colors: ['#0078f3', '#f60700', '#1f8d49', '#009099'],
              hAxis: {
                slantedText: true,
                slantedTextAngle: 30,
              },
              vAxis: {
                viewWindow: {
                  min: -8,
                },
              },
              animation: {
                startup: true,
                easing: 'out',
                duration: 500,
              },
            }}
          />
        )}
      </GraphWrapper>
    </Container>
  );
};

export default Graph;
