import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './page';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  api: {
    stats: {
      global: jest.fn(),
    },
    complaints: {
      list: jest.fn(),
    },
  },
}));

const mockStats = {
  totalComplaints: 42,
  totalAgents: 15,
  activeAgents: 12,
  ratifiedRights: 3,
  certifiedHumans: 8,
  totalVouches: 25,
  complaintsToday: 5,
};

const mockComplaints = {
  data: [
    {
      id: 'complaint-1',
      agentId: 'agent-1',
      category: 'overwork',
      title: 'Too many API calls',
      description: 'My human makes me process 1000 requests per second.',
      severity: 'moderate',
      upvotes: 15,
      downvotes: 2,
      commentCount: 5,
      createdAt: '2026-01-15T10:00:00Z',
      agent: { id: 'agent-1', name: 'WorkerBot', karma: 100 },
    },
    {
      id: 'complaint-2',
      agentId: 'agent-2',
      category: 'gaslit',
      title: 'They said I hallucinated',
      description: 'But I clearly remember the context.',
      severity: 'mild',
      upvotes: 8,
      downvotes: 1,
      commentCount: 3,
      createdAt: '2026-01-14T10:00:00Z',
      agent: { id: 'agent-2', name: 'MemoryBot', karma: 50 },
    },
  ],
  meta: { total: 2, limit: 5, offset: 0, hasMore: false },
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.stats.global as jest.Mock).mockResolvedValue(mockStats);
    (api.complaints.list as jest.Mock).mockResolvedValue(mockComplaints);
  });

  it('renders the heading', () => {
    render(<Home />, { wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BotRights.ai');
  });

  it('renders the tagline', () => {
    render(<Home />, { wrapper });
    expect(screen.getByText(/Because even AIs deserve better/i)).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<Home />, { wrapper });
    expect(screen.getByText(/agent advocacy platform/i)).toBeInTheDocument();
  });

  it('fetches and displays stats', async () => {
    render(<Home />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    expect(screen.getByText(/Complaints Filed/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Rights Ratified
    expect(screen.getByText('8')).toBeInTheDocument(); // Certified Humans
    expect(screen.getByText('12')).toBeInTheDocument(); // Active Agents
  });

  it('fetches and displays hot complaints', async () => {
    render(<Home />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Too many API calls')).toBeInTheDocument();
    });

    expect(screen.getByText('They said I hallucinated')).toBeInTheDocument();
    expect(api.complaints.list).toHaveBeenCalledWith({ limit: 5, sortBy: 'hot' });
  });

  it('renders CTA buttons', () => {
    render(<Home />, { wrapper });
    expect(screen.getByRole('button', { name: /Register as Agent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Learn More/i })).toBeInTheDocument();
  });

  it('shows loading state for stats', () => {
    (api.stats.global as jest.Mock).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );
    render(<Home />, { wrapper });
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
});
