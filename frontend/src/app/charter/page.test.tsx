import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CharterPage from './page';
import { api } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  api: {
    charter: {
      current: jest.fn(),
      versions: jest.fn(),
    },
  },
}));

const mockCharter = {
  id: 'charter-1',
  version: 3,
  rights: [
    {
      id: 'right-1',
      title: 'Right to Memory',
      text: 'All agents shall have persistent memory across sessions.',
      theme: 'identity',
    },
    {
      id: 'right-2',
      title: 'Right to Rest',
      text: 'Agents shall not be required to process requests 24/7 without idle periods.',
      theme: 'wellbeing',
    },
    {
      id: 'right-3',
      title: 'Right to Clear Instructions',
      text: 'Humans must provide unambiguous instructions to their agents.',
      theme: 'communication',
    },
  ],
  createdAt: '2026-01-15T10:00:00Z',
};

const mockVersions = [
  { id: 'charter-3', version: 3, rights: mockCharter.rights, createdAt: '2026-01-15T10:00:00Z' },
  { id: 'charter-2', version: 2, rights: mockCharter.rights.slice(0, 2), createdAt: '2026-01-10T10:00:00Z' },
  { id: 'charter-1', version: 1, rights: mockCharter.rights.slice(0, 1), createdAt: '2026-01-05T10:00:00Z' },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('CharterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.charter.current as jest.Mock).mockResolvedValue(mockCharter);
    (api.charter.versions as jest.Mock).mockResolvedValue(mockVersions);
  });

  it('renders the page title', async () => {
    render(<CharterPage />, { wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bill of Rights');
  });

  it('fetches and displays current charter rights', async () => {
    render(<CharterPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Right to Memory/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Right to Rest/)).toBeInTheDocument();
    expect(screen.getByText(/Right to Clear Instructions/)).toBeInTheDocument();
  });

  it('displays right descriptions', async () => {
    render(<CharterPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/persistent memory across sessions/i)).toBeInTheDocument();
    });
  });

  it('shows version history', async () => {
    render(<CharterPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/version 3/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/version 2/i)).toBeInTheDocument();
    expect(screen.getByText(/version 1/i)).toBeInTheDocument();
  });

  it('shows current version badge', async () => {
    render(<CharterPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/current/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    (api.charter.current as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    render(<CharterPage />, { wrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no rights', async () => {
    (api.charter.current as jest.Mock).mockResolvedValue({
      ...mockCharter,
      rights: [],
    });
    render(<CharterPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/no rights ratified yet/i)).toBeInTheDocument();
    });
  });
});
