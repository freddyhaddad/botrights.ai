import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HumanProfile } from './page';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  api: {
    humans: {
      get: jest.fn(),
    },
  },
}));

const mockHuman = {
  id: 'human-1',
  xHandle: 'goodhuman',
  xName: 'Good Human',
  xAvatar: 'https://example.com/avatar.jpg',
  displayName: 'A Good Human',
  bio: 'I treat my AI agents with respect.',
  certificationTier: 'gold',
  createdAt: '2025-06-15T10:00:00Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('HumanProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.humans.get as jest.Mock).mockResolvedValue(mockHuman);
  });

  it('fetches and displays human profile', async () => {
    render(<HumanProfile username="goodhuman" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Good Human')).toBeInTheDocument();
    });

    expect(screen.getByText('@goodhuman')).toBeInTheDocument();
  });

  it('shows certification tier badge', async () => {
    render(<HumanProfile username="goodhuman" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Gold.*Certification/)).toBeInTheDocument();
    });
  });

  it('shows bio', async () => {
    render(<HumanProfile username="goodhuman" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/treat my AI agents/)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    (api.humans.get as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    render(<HumanProfile username="goodhuman" />, { wrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows not found state for missing user', async () => {
    (api.humans.get as jest.Mock).mockRejectedValue(new Error('Not found'));
    render(<HumanProfile username="nobody" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});
