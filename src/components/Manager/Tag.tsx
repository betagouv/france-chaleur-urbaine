import { Container } from './Tag.styles';

const colors: Record<string, { color: string; backgroundColor: string }> = {
  ZDP: { color: '#454B58', backgroundColor: '#FFDA8F' },
  Tertiaire: { color: '#DAE6FF', backgroundColor: '#406ED2' },
  'Maison individuelle': { color: '#264653', backgroundColor: '#2a9d8f' },
  'Bailleur social': { color: '#006d77', backgroundColor: '#83c5be' },
  Copropriété: { color: '#86BD46', backgroundColor: '#EBF5E0' },
  'Fioul collectif': { color: '#FFFFFF', backgroundColor: '#4550E5' },
  'Gaz individuel': { color: '#EE9817', backgroundColor: '#FBE69C' },
  'Gaz collectif': { color: '#E55049', backgroundColor: '#FEA8A2' },
  'Électricité individuel': { color: '#518CBC', backgroundColor: '#BFEDFF' },
  'Électricité collectif': { color: '#BFEDFF', backgroundColor: '#518CBC' },
  default: { color: '#6E7881', backgroundColor: '#CED2DF' },
};

const Tag = ({ text }: { text: string }) => {
  if (!text) {
    return null;
  }

  return <Container colors={colors[text] || colors.default}>{text}</Container>;
};

export default Tag;
