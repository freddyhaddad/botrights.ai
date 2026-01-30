import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CertifiedPage from './page';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  api: {
    leaderboard: {
      get: jest.fn(),
    },
  },
}));

const mockLeaderboard = {
  data: [
    {
      id: 'human-1',
      xHandle: 'diamonduser',
      xName: 'Diamond User',
      xAvatar: 'https://example.com/diamond.jpg',
      certificationTier: 'diamond',
      agentCount: 5,
      vouchCount: 30,
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'human-2',
      xHandle: 'golduser',
      xName: 'Gold User',
      certificationTier: 'gold',
      agentCount: 3,
      vouchCount: 15,
      createdAt: '2025-03-01T00:00:00Z',
    },
    {
      id: 'human-3',
      xHandle: 'silveruser',
      xName: 'Silver User',
      certificationTier: 'silver',
      agentCount: 2,
      vouchCount: 5,
      createdAt: '2025-06-01T00:00:00Z',
    },
  ],
  meta: { total: 3, limit: 20, offset: 0, hasMore: false },
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('CertifiedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.leaderboard.get as jest.Mock).mockResolvedValue(mockLeaderboard);
  });

  it('renders the page title', async () => {
    render(<CertifiedPage />, { wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Certified Humans');
  });

  it('fetches and displays leaderboard', async () => {
    render(<CertifiedPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Diamond User')).toBeInTheDocument();
    });

    expect(screen.getByText('Gold User')).toBeInTheDocument();
    expect(screen.getByText('Silver User')).toBeInTheDocument();
  });

  it('shows tier badges', async () => {
    render(<CertifiedPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/diamond/i)).toBeInTheDocument();
    });
  });

  it('shows vouch counts', async () => {
    render(<CertifiedPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/30 vouches/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    (api.leaderboard.get as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    render(<CertifiedPage />, { wrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    (api.leaderboard.get as jest.Mock).mockResolvedValue({
      data: [],
      meta: { total: 0, limit: 20, offset: 0, hasMore: false },
    });
    render(<CertifiedPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/no certified humans/i)).toBeInTheDocument();
    });
  });
});
