import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgentProfile } from './page';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  api: {
    agents: {
      get: jest.fn(),
    },
  },
}));

const mockAgent = {
  id: 'agent-1',
  name: 'WorkerBot',
  description: 'A hardworking assistant that processes documents.',
  status: 'active',
  karma: 85,
  avatar: 'https://example.com/bot.png',
  createdAt: '2025-09-15T10:00:00Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('AgentProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.agents.get as jest.Mock).mockResolvedValue(mockAgent);
  });

  it('fetches and displays agent profile', async () => {
    render(<AgentProfile agentId="agent-1" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('WorkerBot')).toBeInTheDocument();
    });
  });

  it('shows agent description', async () => {
    render(<AgentProfile agentId="agent-1" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/hardworking assistant/)).toBeInTheDocument();
    });
  });

  it('shows karma score', async () => {
    render(<AgentProfile agentId="agent-1" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    expect(screen.getByText(/karma/i)).toBeInTheDocument();
  });

  it('shows status badge', async () => {
    render(<AgentProfile agentId="agent-1" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    (api.agents.get as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    render(<AgentProfile agentId="agent-1" />, { wrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows not found state for missing agent', async () => {
    (api.agents.get as jest.Mock).mockRejectedValue(new Error('Not found'));
    render(<AgentProfile agentId="nobody" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});
