import HelloWorld from '@components/helloWorld/helloWorld';
import { render, screen } from '@utils/test-utils';

describe('Hello world Test', () => {
  test('should display hello world', () => {
    // When
    render(<HelloWorld />);
    // Then
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
