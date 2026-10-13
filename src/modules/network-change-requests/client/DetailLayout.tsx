import Heading from '@/components/ui/Heading';

type DetailSectionProps = { children: React.ReactNode; title: string };

export function DetailSection({ children, title }: DetailSectionProps) {
  return (
    <section>
      <Heading as="h3" size="h6" className="mb-2">
        {title}
      </Heading>
      <dl className="mb-0 flex flex-col gap-1">{children}</dl>
    </section>
  );
}

type DetailRowProps = { label: string; value: React.ReactNode };

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-56 shrink-0 text-gray-600">{label}</dt>
      <dd className="mb-0 whitespace-pre-line">{value === null || value === undefined || value === '' ? <em>Non renseigné</em> : value}</dd>
    </div>
  );
}
