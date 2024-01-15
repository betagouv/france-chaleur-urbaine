import ContactForm from '@components/ContactForm';
import SimplePage from '@components/shared/page/SimplePage';
import Slice from '@components/Slice';

function contact() {
  return (
    <SimplePage title="Contact : France Chaleur Urbaine">
      <Slice padding={4}>
        <ContactForm />
      </Slice>
    </SimplePage>
  );
}

export default contact;
