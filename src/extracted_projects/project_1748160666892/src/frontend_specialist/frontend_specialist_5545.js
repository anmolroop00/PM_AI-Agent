// Example: Unit test for a React component
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Counter from './Counter'; // Assuming Counter.js exists

test('increments the counter when the button is clicked', () => {
  render(<Counter />);
  const buttonElement = screen.getByText('Increment');
  const countElement = screen.getByText('Count: 0');

  fireEvent.click(buttonElement);

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});