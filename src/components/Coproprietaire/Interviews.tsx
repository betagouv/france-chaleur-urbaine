import { Author, Container, Icon, Logo, Quote } from './Interviews.styles';
import InterviewsVideos from './InterviewsVideos';

const quotes = {
  florence: {
    name: 'Florence Osman',
    quote: 'Cela fait une économie de 60% de gaz et au niveau économique de 40% !',
    title: 'Présidente de conseil syndical',
  },
  henry: {
    name: 'Henry Hostein',
    quote: 'Je conseille vivement le raccordement à un réseau de chaleur pour des raisons économiques et écologiques.',
    title: 'Président de conseil syndical',
  },
};

const Interviews = ({ from }: { from: 'henry' | 'florence' }) => {
  const { name, title, quote } = quotes[from];
  return (
    <>
      <Logo>
        <img src="/img/ambassadeurs.png" alt="Logo représantant les ambassadeurs du chauffage urbains" />
      </Logo>
      <Container className="fr-grid-row">
        <div className="fr-col-12 fr-col-md-6">
          <h3>
            Le chauffage urbain, <b>ce sont eux qui en parlent le mieux !</b>
          </h3>
          <p>
            Qu’ils soient présidents de conseils syndicaux, syndic ou élus, ils expliquent leur choix des réseaux de chaleur. Profitez de
            ces témoignages sur le terrain pour découvrir les atouts du chauffage urbain !
          </p>
          <Icon className="fr-icon-quote-line" />
          <Quote>“{quote}”</Quote>
          <Author>
            <b>
              {name}
              <br />
              {title}
            </b>
          </Author>
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <InterviewsVideos />
        </div>
      </Container>
    </>
  );
};

export default Interviews;
