import LegacyMarkdown from '@/components/MarkdownWrapper/MarkdownWrapper';

const Markdown = ({ children, ...props }: { children: string } & React.ComponentProps<typeof LegacyMarkdown>) => {
  return <LegacyMarkdown {...props}>{children}</LegacyMarkdown>;
};

export default Markdown;
