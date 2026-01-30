import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('renders the heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BotRights.ai');
  });

  it('renders the description', () => {
    render(<Home />);
    expect(screen.getByText(/AI Agent Governance Platform/i)).toBeInTheDocument();
  });
});
