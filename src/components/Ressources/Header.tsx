import { PageBody, PageTitle } from '@/components/HeadSliceForm/HeadSliceForm.style';
import MarkdownWrapper from '@/components/MarkdownWrapper';
import Slice from '@/components/Slice';
import type Heading from '@/components/ui/Heading';

import { Container } from './Header.styles';

const Header = ({
  title,
  description,
  titleAs,
}: {
  title: string;
  description: string;
  titleAs?: React.ComponentProps<typeof Heading>['as'];
}) => {
  return (
    <Slice padding={8} bg="/img/ressources-right.svg" bgPos="right center" bgSize="auto" bgColor="#CDE3F0">
      <Container>
        <div>
          <PageTitle as={titleAs} className="fr-mb-4w">
            {title}
          </PageTitle>
          <PageBody>
            <MarkdownWrapper value={description} />
          </PageBody>
        </div>
      </Container>
    </Slice>
  );
};

export default Header;
