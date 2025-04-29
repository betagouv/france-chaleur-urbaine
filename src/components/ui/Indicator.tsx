import Loader from '@/components/ui/Loader';

type IndicatorProps = {
  label: React.ReactNode;
  value: number;
  valueSuffix?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
  className?: string;
};

function Indicator({ label, value, valueSuffix, loading, onClick, active, className }: IndicatorProps) {
  const Element = onClick ? 'button' : 'div';
  return (
    <Element
      className={`fr-p-2w flex flex-col h-full transition-colors ${active ? 'text-blue' : ''} ${onClick ? 'cursor-pointer hover:bg-gray-100 text-left' : ''} ${className}`}
      onClick={onClick}
      title={onClick ? 'Cliquer pour filtrer' : undefined}
    >
      <div className="font-bold text-xl flex items-center gap-1">
        {loading ? <Loader size="sm" className="my-[6px]" /> : value} {valueSuffix}
      </div>
      <div>{label}</div>
    </Element>
  );
}
export default Indicator;
