import MainContainer from '@components/shared/layout';
import Slice from '@components/Slice';
import { Alert, Button, TextInput } from '@dataesr/react-dsfr';
import { submitToAirtable } from '@helpers/airtable';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { updateRelanceAnswer } from 'src/services/manager';
import { Airtable } from 'src/types/enum/Airtable';

function Satisfaction() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [satisfaction, setSatisfaction] = useState<boolean>();
  const [comment, setComment] = useState('');

  const [sent, setSent] = useState(false);

  useEffect(() => {
    setId(router.query.id as string);
    setSatisfaction(router.query.satisfaction === 'true');
  }, [router]);
  if (satisfaction === undefined) {
    return null;
  }

  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
    await submitToAirtable({ id, comment }, Airtable.RELANCE);
  };

  return (
    <>
      <MainContainer currentMenu="/">
        <Slice padding={8}>
          {satisfaction ? (
            <>
              <h5>
                Merci pour votre retour ! Vous souhaitez nous en dire plus ?
              </h5>
            </>
          ) : (
            <>
              <h5>Merci pour votre retour !</h5>
              Les gestionnaires des réseaux de chaleur recevant actuellement un
              nombre important de demandes, les délais de prise en charge
              peuvent être allongés. N'hésitez pas à vérifier vos spams, les
              mails de gestionnaires peuvent être considérés comme indésirables
              par votre boîte mail.
              <br />
              Nous relançons le gestionnaire du réseau concerné par votre
              demande afin que vous puissiez être recontacté au plus vite. Nous
              vous remercions pour votre patience.
              <br />
              <br />
              <h5>Vous souhaitez nous en dire plus ?</h5>
            </>
          )}
          {sent ? (
            <Alert type="success" title="Merci pour votre retour." />
          ) : (
            <form onSubmit={send}>
              <TextInput
                required
                textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Je laisse un commentaire"
              />
              <Button submit>Envoyer</Button>
            </form>
          )}
          <br />
          <br />
          <p>
            Pour partager votre retour d’expérience de vive voix, n’hésitez pas{' '}
            <a
              href="https://app.calendso.incubateur.net/camillefwok/15min"
              target="_blank"
              rel="noreferrer"
            >
              à prendre rendez-vous avec l’équipe France Chaleur Urbaine
            </a>
          </p>
        </Slice>
      </MainContainer>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id, satisfaction } = context.query;
  await updateRelanceAnswer(id as string, satisfaction === 'true');
  return { props: {} };
};

export default Satisfaction;
