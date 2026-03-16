import IframeMapPage from '@/components/Map/IframeMapPage';

const CharlevilleMezieresMap = () => {
  return (
    <IframeMapPage
      defaultMapConfiguration={{
        reseauxDeChaleur: {
          show: true,
        },
        reseauxEnConstruction: true,
      }}
      defaultEnabledLegendFeatures={['reseauxDeChaleur', 'reseauxEnConstruction']}
      withBorder
      initialCenter={[4.717692, 49.767402]}
      initialZoom={12}
      legendTitle="Réseaux de chaleur"
      legendLogoOpt={{
        alt: 'logo Charleville Mezieres',
        src: '/logo-CM.svg',
      }}
      withFCUAttribution
    />
  );
};

export default CharlevilleMezieresMap;
