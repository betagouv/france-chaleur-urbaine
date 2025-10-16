import { caracteristiquesBatimentsLayerStyle } from '@/components/Map/layers/caracteristiquesBatiments';

type DPEProps = {
  classe: keyof typeof caracteristiquesBatimentsLayerStyle;
};

function DPE({ classe }: DPEProps) {
  const color = caracteristiquesBatimentsLayerStyle[classe];
  return (
    <div style={{ backgroundColor: color }} className="w-6 h-6 flex items-center justify-center text-white text-[18px]">
      {classe}
    </div>
  );
}

export default DPE;
