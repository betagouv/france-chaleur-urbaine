import { Card, Cards, Description, Value } from './TextList.style';

type DataTextProps = {
  value: string;
  description: string;
  type?: string;
};
function TextList({ data = [] }: { data: DataTextProps[] }) {
  return (
    <Cards>
      {data?.map(({ value, description, type }) => (
        <Card key={description} type={type}>
          <Value>{value}</Value>
          <Description>{description}</Description>
        </Card>
      ))}
    </Cards>
  );
}

export default TextList;
