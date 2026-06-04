import ButtonCopy from '@/components/ui/ButtonCopy';

type IframeCodeBlockProps = {
  code: string;
  className?: string;
};

/** Click-to-copy `<iframe>` snippet block, shared by the public collectivités / pros embed sections. */
const IframeCodeBlock = ({ code, className }: IframeCodeBlockProps) => {
  return (
    <ButtonCopy text={code} showOverlay title="Copier le code" className={className}>
      <code className="block cursor-pointer break-all rounded border border-(--border-default-grey) bg-(--background-alt-grey) p-3 text-xs fr-btn--icon-right fr-icon-clipboard-line">
        {code}
      </code>
    </ButtonCopy>
  );
};

export default IframeCodeBlock;
