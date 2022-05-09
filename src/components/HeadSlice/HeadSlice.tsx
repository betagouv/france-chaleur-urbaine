import CheckEligibilityForm from '@components/checkEligibility/CheckEligibilityForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import React, { useMemo } from 'react';
import {
  Container,
  FormLabel,
  HeadSliceContainer,
  PageBody,
  PageTitle,
  PageTitlePreTitle,
} from './HeadSlice.style';

type HeadBannerType = {
  bg?: string;
  bgPos?: string;
  CheckEligibility?: boolean;
  formLabel?: string;
  pagePreTitle?: string;
  pageTitle?: string;
  pageBody?: string;
  children?: React.ReactNode;
  needGradient?: boolean;
};

function HeadSlice({
  bg,
  bgPos,
  CheckEligibility,
  formLabel,
  pagePreTitle,
  pageTitle,
  pageBody,
  children,
  needGradient,
}: HeadBannerType) {
  const Child = useMemo(
    () =>
      (pageTitle || pagePreTitle || pageBody) && (
        <>
          {(pageTitle || pagePreTitle) && (
            <PageTitle className="fr-mb-4w">
              {pagePreTitle && (
                <PageTitlePreTitle>{pagePreTitle}</PageTitlePreTitle>
              )}
              {pageTitle}
            </PageTitle>
          )}
          {pageBody && (
            <PageBody>
              <MarkdownWrapper value={pageBody} />
              {children}
            </PageBody>
          )}
        </>
      ),
    [children, pageBody, pagePreTitle, pageTitle]
  );

  const WrappedChild = useMemo(
    () =>
      CheckEligibility ? (
        <CheckEligibilityForm
          formLabel={formLabel && <FormLabel>{formLabel}</FormLabel>}
        >
          {Child}
        </CheckEligibilityForm>
      ) : (
        <>{Child}</>
      ),
    [CheckEligibility, Child, formLabel]
  );

  return (
    <Slice theme="grey" bg={bg} bgPos={bgPos} bgWidth={1600} bgColor="#CDE3F0">
      <HeadSliceContainer needGradient={needGradient}>
        <Container>{WrappedChild}</Container>
      </HeadSliceContainer>
    </Slice>
  );
}

export default HeadSlice;
