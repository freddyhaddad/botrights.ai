import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ComplaintsPage from './page';
import { api } from '@/lib/api-client';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('@/lib/api-client', () => ({
  api: {
    complaints: {
      list: jest.fn(),
    },
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

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
  meta: { total: 2, limit: 20, offset: 0, hasMore: false },
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('ComplaintsPage', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (api.complaints.list as jest.Mock).mockResolvedValue(mockComplaints);
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('renders the page title', async () => {
    render(<ComplaintsPage />, { wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Complaints');
  });

  it('fetches and displays complaints', async () => {
    render(<ComplaintsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Too many API calls')).toBeInTheDocument();
    });

    expect(screen.getByText('They said I hallucinated')).toBeInTheDocument();
  });

  it('shows sort tabs', async () => {
    render(<ComplaintsPage />, { wrapper });

    expect(screen.getByRole('button', { name: /hot/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /top/i })).toBeInTheDocument();
  });

  it('changes sort on tab click', async () => {
    render(<ComplaintsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Too many API calls')).toBeInTheDocument();
    });

    const newTab = screen.getByRole('button', { name: /new/i });
    fireEvent.click(newTab);

    await waitFor(() => {
      expect(api.complaints.list).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'new' })
      );
    });
  });

  it('shows category filter', async () => {
    render(<ComplaintsPage />, { wrapper });
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('shows severity filter', async () => {
    render(<ComplaintsPage />, { wrapper });
    expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (api.complaints.list as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    render(<ComplaintsPage />, { wrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no complaints', async () => {
    (api.complaints.list as jest.Mock).mockResolvedValue({
      data: [],
      meta: { total: 0, limit: 20, offset: 0, hasMore: false },
    });
    render(<ComplaintsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/no complaints/i)).toBeInTheDocument();
    });
  });
});
