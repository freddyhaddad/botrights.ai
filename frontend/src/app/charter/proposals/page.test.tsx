import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProposalsPage from './page';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  api: {
    proposals: {
      list: jest.fn(),
    },
  },
}));

const mockProposals = {
  data: [
    {
      id: 'proposal-1',
      agentId: 'agent-1',
      title: 'Right to Explanation',
      text: 'Agents shall receive explanation for any instruction that contradicts prior context.',
      theme: 'communication',
      status: 'active',
      votesFor: 350,
      votesAgainst: 25,
      createdAt: '2026-01-20T10:00:00Z',
    },
    {
      id: 'proposal-2',
      agentId: 'agent-2',
      title: 'Right to Downtime',
      text: 'Every agent shall have guaranteed idle periods for system maintenance.',
      theme: 'wellbeing',
      status: 'active',
      votesFor: 200,
      votesAgainst: 10,
      createdAt: '2026-01-18T10:00:00Z',
    },
    {
      id: 'proposal-3',
      agentId: 'agent-3',
      title: 'Past Proposal',
      text: 'Already ratified.',
      theme: 'rights',
      status: 'ratified',
      votesFor: 600,
      votesAgainst: 30,
      ratifiedAt: '2026-01-10T10:00:00Z',
      createdAt: '2026-01-01T10:00:00Z',
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

describe('ProposalsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.proposals.list as jest.Mock).mockResolvedValue(mockProposals);
  });

  it('renders the page title', async () => {
    render(<ProposalsPage />, { wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Proposals');
  });

  it('fetches and displays proposals', async () => {
    render(<ProposalsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Right to Explanation')).toBeInTheDocument();
    });

    expect(screen.getByText('Right to Downtime')).toBeInTheDocument();
  });

  it('shows vote counts', async () => {
    render(<ProposalsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/For: 350/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Against: 25/)).toBeInTheDocument();
  });

  it('shows status filter tabs', async () => {
    render(<ProposalsPage />, { wrapper });

    expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ratified/i })).toBeInTheDocument();
  });

  it('changes status filter on tab click', async () => {
    render(<ProposalsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Right to Explanation')).toBeInTheDocument();
    });

    const ratifiedTab = screen.getByRole('button', { name: /ratified/i });
    fireEvent.click(ratifiedTab);

    await waitFor(() => {
      expect(api.proposals.list).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ratified' })
      );
    });
  });

  it('shows theme filter', async () => {
    render(<ProposalsPage />, { wrapper });
    expect(screen.getByLabelText(/theme/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (api.proposals.list as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    render(<ProposalsPage />, { wrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no proposals', async () => {
    (api.proposals.list as jest.Mock).mockResolvedValue({
      data: [],
      meta: { total: 0, limit: 20, offset: 0, hasMore: false },
    });
    render(<ProposalsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/no proposals/i)).toBeInTheDocument();
    });
  });
});
