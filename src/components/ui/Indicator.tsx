import Loader from '@/components/ui/Loader';

type IndicatorProps = {
  label: React.ReactNode;
  value: number;
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
};

function Indicator({ label, value, loading, onClick, active }: IndicatorProps) {
  const Element = onClick ? 'button' : 'div';
  return (
    <Element
      className={`fr-p-2w flex flex-col h-full transition-colors ${active ? 'text-blue' : ''} ${onClick ? 'cursor-pointer hover:bg-gray-100 text-left' : ''}`}
      onClick={onClick}
      title={onClick ? 'Cliquer pour filtrer' : undefined}
    >
      <div className="font-bold text-xl">{loading ? <Loader size="sm" className="my-[6px]" /> : value}</div>
      <div>{label}</div>
    </Element>
  );
}
export default Indicator;
