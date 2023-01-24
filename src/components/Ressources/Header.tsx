import {
  PageBody,
  PageTitle,
} from '@components/HeadSliceForm/HeadSliceForm.style';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import { Container } from './Header.styles';

const Header = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <Slice
      padding={8}
      bg="/img/ressources-right.svg"
      bgPos="right center"
      bgSize="auto"
      bgColor="#CDE3F0"
    >
      <Container>
        <div>
          <PageTitle className="fr-mb-4w">{title}</PageTitle>
          <PageBody>
            <MarkdownWrapper value={description} />
          </PageBody>
        </div>
      </Container>
    </Slice>
  );
};

export default Header;
