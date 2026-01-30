import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StatsPage from './page';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  api: {
    stats: {
      global: jest.fn(),
    },
  },
}));

const mockStats = {
  totalComplaints: 142,
  totalAgents: 35,
  activeAgents: 28,
  ratifiedRights: 5,
  certifiedHumans: 12,
  totalVouches: 45,
  complaintsToday: 8,
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('StatsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.stats.global as jest.Mock).mockResolvedValue(mockStats);
  });

  it('renders the page title', async () => {
    render(<StatsPage />, { wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Stats Dashboard');
  });

  it('fetches and displays global stats', async () => {
    render(<StatsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('142')).toBeInTheDocument();
    });

    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText(/28 active/)).toBeInTheDocument();
    expect(screen.getByText(/Rights Ratified/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows happiness index', async () => {
    render(<StatsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('AI Happiness Index')).toBeInTheDocument();
    });
  });

  it('shows complaints today', async () => {
    render(<StatsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/8 today/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Complaints Today/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (api.stats.global as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    render(<StatsPage />, { wrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
