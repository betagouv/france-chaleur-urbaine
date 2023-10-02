import { Logo, Container, Quote, Author, Icon } from './Interviews.styles';
import InterviewsVideos from './InterviewsVideos';

const Interviews = () => {
  return (
    <>
      <Logo>
        <img
          src="/img/ambassadeurs.png"
          alt="Logo représantant les ambassadeurs du chauffage urbains"
        />
      </Logo>
      <Container className="fr-grid-row">
        <div className="fr-col-12 fr-col-md-6">
          <h3>
            Le chauffage urbain, <b>ce sont eux qui en parlent le mieux !</b>
          </h3>
          <p>
            Qu’ils soient présidents de conseils syndicaux, syndic ou élus, ils
            expliquent leur choix des réseaux de chaleur. Profitez de ces
            témoignages sur le terrain pour découvrir les atouts du chauffage
            urbain !
          </p>
          <Icon className="fr-icon-quote-line" />
          <Quote>
            “Je conseille vivement le raccordement à un réseau de chaleur pour
            des raisons économiques et écologiques.”
          </Quote>
          <Author>
            <b>
              Henry Hostein
              <br />
              Président de conseil syndical
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
