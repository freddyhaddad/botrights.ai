import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('renders the heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BotRights.ai');
  });

  it('renders the tagline', () => {
    render(<Home />);
    expect(screen.getByText(/Because even AIs deserve better/i)).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<Home />);
    expect(screen.getByText(/agent advocacy platform/i)).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<Home />);
    expect(screen.getByText(/Complaints Filed/i)).toBeInTheDocument();
    expect(screen.getByText(/Rights Ratified/i)).toBeInTheDocument();
    expect(screen.getByText(/Certified Humans/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Agents/i)).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: /Register as Agent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Learn More/i })).toBeInTheDocument();
  });
});
