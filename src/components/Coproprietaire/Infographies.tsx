import WrappedText from '@components/WrappedText/WrappedText';

const Infographies = () => {
  return (
    <WrappedText
      center
      imgSrc="/img/infographies.svg"
      body={`Tout comprendre sur les réseaux de chaleur et les enjeux autour de la transition énergétique avec nos *infographies*.

:button-link[Voir les infographies]{href="/infographies"}
`}
      reverse
    ></WrappedText>
  );
};

export default Infographies;
