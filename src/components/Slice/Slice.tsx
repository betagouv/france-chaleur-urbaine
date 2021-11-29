import MarkdownWrapper from '@components/MarkdownWrapper';
import React from 'react';
import {
  SliceContainer,
  SliceContainerWrapper,
  SliceContainerWrapperType,
  SliceSection,
} from './Slice.style';

const Slice: React.FC<
  {
    header?: string;
    className?: string;
    theme?: string;
    padding?: number;
    bleedColor?: string | [string, string];
  } & SliceContainerWrapperType
> = ({
  className,
  header,
  children,
  theme,
  padding,
  bg,
  bgPos,
  bgSize,
  bgWidth,
  bgColor,
  bleedColor,
}) => {
  const [bleedColorStart = '', bleedColorEnd = ''] = Array.isArray(bleedColor)
    ? bleedColor
    : [bleedColor, bleedColor];

  return (
    <SliceSection className={`fr-container--fluid ${className}`} theme={theme}>
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
            {children}
          </SliceContainer>
        </SliceContainerWrapper>
      </div>
    </SliceSection>
  );
};

export default Slice;
