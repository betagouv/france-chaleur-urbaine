import { DataCard } from './TextList.style';

type DataTextProps = {
  title?: string;
  body?: string;
};
function TextList({ data = [] }: { data: DataTextProps[] }) {
  return (
    <div className="fr-grid-row">
      {data?.map((d, key) => (
        <div className="fr-col-lg-3 fr-col-sm-6" key={`${key}-${d.title}`}>
          <DataCard>
            <h2>{d.title}</h2>
            <div>{d.body}</div>
          </DataCard>
        </div>
      ))}
    </div>
  );
}

export default TextList;
