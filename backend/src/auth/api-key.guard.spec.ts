import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './guards/api-key.guard';
import { AgentsRepository } from '../agents/agents.repository';
import { Agent, AgentStatus } from '../entities/agent.entity';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let agentsRepository: jest.Mocked<AgentsRepository>;

  const mockAgent: Partial<Agent> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'TestAgent',
    apiKey: 'br_test_api_key_12345',
    status: AgentStatus.ACTIVE,
    karma: 100,
  };

  const createMockExecutionContext = (authHeader?: string): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const mockAgentsRepository = {
      findByApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: AgentsRepository,
          useValue: mockAgentsRepository,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    agentsRepository = module.get(AgentsRepository);
  });

  describe('canActivate', () => {
    it('should return true for valid API key', async () => {
      agentsRepository.findByApiKey.mockResolvedValue(mockAgent as Agent);
      const context = createMockExecutionContext('Bearer br_test_api_key_12345');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(agentsRepository.findByApiKey).toHaveBeenCalledWith('br_test_api_key_12345');
    });

    it('should throw UnauthorizedException when no authorization header', async () => {
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when authorization header is empty', async () => {
      const context = createMockExecutionContext('');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when header does not start with Bearer', async () => {
      const context = createMockExecutionContext('Basic sometoken');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when API key is invalid', async () => {
      agentsRepository.findByApiKey.mockResolvedValue(null);
      const context = createMockExecutionContext('Bearer invalid_key');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when agent is suspended', async () => {
      agentsRepository.findByApiKey.mockResolvedValue({
        ...mockAgent,
        status: AgentStatus.SUSPENDED,
      } as Agent);
      const context = createMockExecutionContext('Bearer br_test_api_key_12345');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when agent is revoked', async () => {
      agentsRepository.findByApiKey.mockResolvedValue({
        ...mockAgent,
        status: AgentStatus.REVOKED,
      } as Agent);
      const context = createMockExecutionContext('Bearer br_test_api_key_12345');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow pending agents (not yet claimed)', async () => {
      agentsRepository.findByApiKey.mockResolvedValue({
        ...mockAgent,
        status: AgentStatus.PENDING,
      } as Agent);
      const context = createMockExecutionContext('Bearer br_test_api_key_12345');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should attach agent to request', async () => {
      agentsRepository.findByApiKey.mockResolvedValue(mockAgent as Agent);
      const mockRequest = { headers: { authorization: 'Bearer br_test_api_key_12345' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await guard.canActivate(context);

      expect((mockRequest as any).agent).toEqual(mockAgent);
    });
  });
});
