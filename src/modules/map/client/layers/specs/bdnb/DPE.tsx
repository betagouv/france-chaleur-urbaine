import { caracteristiquesBatimentsLayerStyle } from './caracteristiquesBatimentsLayerStyle';

type DPEProps = {
  /** DPE class letter (A→G, or N for unknown). */
  classe: keyof typeof caracteristiquesBatimentsLayerStyle;
  title?: string;
};

/** Colored square badge showing a DPE class letter, using the shared DPE palette. */
export function DPE({ classe, title }: DPEProps) {
  return (
    <span
      title={title}
      className="inline-grid size-6 place-content-center text-[18px] text-white"
      style={{ backgroundColor: caracteristiquesBatimentsLayerStyle[classe] }}
    >
      {classe}
    </span>
  );
}
