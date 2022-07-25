import MarkdownWrapper from '@components/MarkdownWrapper';
import React from 'react';
import {
  SliceBody,
  SliceContainer,
  SliceContainerWrapper,
  SliceContainerWrapperType,
  SliceHiddenImg,
  SliceSection,
} from './Slice.style';

const Slice: React.FC<
  {
    children?: React.ReactNode;
    id?: string;
    header?: string;
    className?: string;
    theme?: string;
    padding?: number;
    bleedColor?: string | [string, string];
    direction?: string;
  } & SliceContainerWrapperType
> = ({
  children,
  id,
  className,
  header,
  theme,
  padding,
  bg,
  bgPos,
  bgSize,
  bgWidth,
  bgColor,
  bleedColor,
  direction,
}) => {
  const [bleedColorStart = '', bleedColorEnd = ''] = Array.isArray(bleedColor)
    ? bleedColor
    : [bleedColor, bleedColor];

  return (
    <SliceSection
      id={id}
      className={`fr-container--fluid ${className}`}
      theme={theme}
    >
      <div className="fr-grid-row fr-grid-row--center">
        <SliceContainerWrapper
          className={`fr-col-lg-12 ${padding ? `fr-py-${padding}w` : ''}`}
          bg={bg}
          bgPos={bgPos}
          bgSize={bgSize}
          bgWidth={bgWidth}
          bgColor={bgColor}
          bleedColors={[bleedColorStart, bleedColorEnd]}
        >
          <SliceContainer className="fr-container">
            {header && (
              <header>
                <MarkdownWrapper value={header} className="slice-header" />
              </header>
            )}
            <SliceBody direction={direction}>{children}</SliceBody>
          </SliceContainer>
        </SliceContainerWrapper>
      </div>
    </SliceSection>
  );
};

export const SliceImg: React.FC<
  {
    children?: React.ReactNode;
    src: string;
    padding?: number;
  } & SliceContainerWrapperType
> = ({ children, src, padding, ...props }) => (
  <Slice bg={src} padding={padding || 0} bgPos="top center" {...props}>
    {children || <SliceHiddenImg src={src} style={{ opacity: 0 }} />}
  </Slice>
);

export default Slice;
