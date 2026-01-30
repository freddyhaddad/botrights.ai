import { render, screen } from '@testing-library/react';
import SignInPage from './page';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe('SignInPage', () => {
  it('renders the sign in heading', () => {
    render(<SignInPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign in to BotRights');
  });

  it('renders the Twitter sign in button', () => {
    render(<SignInPage />);
    expect(screen.getByRole('button', { name: /continue with x/i })).toBeInTheDocument();
  });

  it('shows explanation of why Twitter', () => {
    render(<SignInPage />);
    expect(screen.getByText(/Why Twitter/i)).toBeInTheDocument();
    expect(screen.getByText(/verify you're human/i)).toBeInTheDocument();
  });
});
