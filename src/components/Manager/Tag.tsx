import { Container } from './Tag.styles';

const colors: Record<string, { color: string; backgroundColor: string }> = {
  'Bailleur social': { backgroundColor: '#83c5be', color: '#006d77' },
  Copropriété: { backgroundColor: '#EBF5E0', color: '#86BD46' },
  default: { backgroundColor: '#CED2DF', color: '#6E7881' },
  'Fioul collectif': { backgroundColor: '#6060ff', color: '#FFFFFF' },
  'Gaz collectif': { backgroundColor: '#FEA8A2', color: '#E55049' },
  'Gaz individuel': { backgroundColor: '#FBE69C', color: '#EE9817' },
  'Maison individuelle': { backgroundColor: '#2a9d8f', color: '#264653' },
  PDP: { backgroundColor: '#FFDA8F', color: '#454B58' },
  Tertiaire: { backgroundColor: '#406ED2', color: '#DAE6FF' },
  'Électricité collectif': { backgroundColor: '#518CBC', color: '#BFEDFF' },
  'Électricité individuel': { backgroundColor: '#BFEDFF', color: '#518CBC' },
};

const Tag = ({ text }: { text: string }) => {
  if (!text) {
    return null;
  }

  return <Container colors={colors[text] || colors.default}>{text}</Container>;
};

export default Tag;
