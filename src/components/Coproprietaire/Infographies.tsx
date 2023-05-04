import WrappedText from '@components/WrappedText/WrappedText';

const Infographies = () => {
  return (
    <WrappedText
      center
      imgSrc="/img/infographies.png"
      body={`Retrouvez tous nos supports de communication pour comprendre simplement et rapidement les enjeux liés aux réseaux de chaleur ou faire connaître notre service.

:button-link[Voir les supports]{href="/ressources/supports#contenu"}
`}
      reverse
    ></WrappedText>
  );
};

export default Infographies;
