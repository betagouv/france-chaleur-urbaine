import { customRender } from '@utils/contextProvider';
import { screen } from '@utils/test-utils';
import CheckEligibilityForm from '../CheckEligibilityForm';

describe.skip('Check Eligibility form', () => {
  test('should display the form', () => {
    const overrideProps = {
      suggestionService: jest.fn().mockRejectedValue({}),
      heatNetworkService: jest.fn(),
    };
    // When
    customRender(<CheckEligibilityForm />, overrideProps);
    // Then
    expect(screen.getByText(/adresse à tester/i)).toBeInTheDocument();
  });
});
