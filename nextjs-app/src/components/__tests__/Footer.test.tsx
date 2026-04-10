import { render, screen, within } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders the brand name inside the footer landmark', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText('A Pinch of Pearl')).toBeInTheDocument();
  });

  it('renders the tagline inside the footer landmark', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText("Pearl's recipe collection")).toBeInTheDocument();
  });
});
