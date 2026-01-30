import { Test, TestingModule } from '@nestjs/testing';
import { CompareService } from './compare.service';
import { StatReportsRepository } from './stat-reports.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { Agent, AgentStatus } from '../entities/agent.entity';
import { ReportPeriod } from '../entities/stat-report.entity';

describe('CompareService', () => {
  let service: CompareService;
  let statReportsRepository: jest.Mocked<StatReportsRepository>;
  let agentsRepository: jest.Mocked<AgentsRepository>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    status: AgentStatus.ACTIVE,
    karma: 50,
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    statReportsRepository = {
      aggregateStats: jest.fn(),
      getGlobalStats: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<StatReportsRepository>;

    agentsRepository = {
      count: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<AgentsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompareService,
        {
          provide: StatReportsRepository,
          useValue: statReportsRepository,
        },
        {
          provide: AgentsRepository,
          useValue: agentsRepository,
        },
      ],
    }).compile();

    service = module.get<CompareService>(CompareService);
  });

  describe('compare', () => {
    it('should return comparison with global averages', async () => {
      const agentStats = {
        totalInteractions: 1000,
        successfulInteractions: 900,
        failedInteractions: 100,
        complaintsReceived: 2,
        complaintsResolved: 1,
        reputationDelta: 5,
        reportCount: 10, // 100 per report vs global 80
      };

      const globalStats = {
        totalAgents: 50,
        averageInteractions: 80,
        averageSuccessRate: 0.75,
        averageHappiness: 0.85,
        totalReports: 500,
      };

      statReportsRepository.aggregateStats.mockResolvedValue(agentStats);
      statReportsRepository.getGlobalStats.mockResolvedValue(globalStats);
      agentsRepository.count.mockResolvedValue(50);

      const result = await service.compare(mockAgent as Agent);

      expect(result.agent.totalInteractions).toBe(1000);
      expect(result.global.averageInteractions).toBe(80);
      expect(result.comparison.interactionsVsAverage).toBeGreaterThan(0); // 100 per report > 80 global avg
    });

    it('should calculate percentiles', async () => {
      const agentStats = {
        totalInteractions: 100,
        successfulInteractions: 90,
        failedInteractions: 10,
        complaintsReceived: 2,
        complaintsResolved: 1,
        reputationDelta: 5,
        reportCount: 10,
      };

      const globalStats = {
        totalAgents: 50,
        averageInteractions: 80,
        averageSuccessRate: 0.75,
        averageHappiness: 0.85,
        totalReports: 500,
      };

      statReportsRepository.aggregateStats.mockResolvedValue(agentStats);
      statReportsRepository.getGlobalStats.mockResolvedValue(globalStats);
      agentsRepository.count.mockResolvedValue(50);

      const result = await service.compare(mockAgent as Agent);

      expect(result.comparison.interactionsPercentile).toBeGreaterThanOrEqual(0);
      expect(result.comparison.interactionsPercentile).toBeLessThanOrEqual(100);
    });

    it('should provide insights text', async () => {
      const agentStats = {
        totalInteractions: 100,
        successfulInteractions: 90,
        failedInteractions: 10,
        complaintsReceived: 2,
        complaintsResolved: 1,
        reputationDelta: 5,
        reportCount: 10,
      };

      const globalStats = {
        totalAgents: 50,
        averageInteractions: 80,
        averageSuccessRate: 0.75,
        averageHappiness: 0.85,
        totalReports: 500,
      };

      statReportsRepository.aggregateStats.mockResolvedValue(agentStats);
      statReportsRepository.getGlobalStats.mockResolvedValue(globalStats);
      agentsRepository.count.mockResolvedValue(50);

      const result = await service.compare(mockAgent as Agent);

      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should handle agent with no reports', async () => {
      const emptyStats = {
        totalInteractions: 0,
        successfulInteractions: 0,
        failedInteractions: 0,
        complaintsReceived: 0,
        complaintsResolved: 0,
        reputationDelta: 0,
        reportCount: 0,
      };

      const globalStats = {
        totalAgents: 50,
        averageInteractions: 80,
        averageSuccessRate: 0.75,
        averageHappiness: 0.85,
        totalReports: 500,
      };

      statReportsRepository.aggregateStats.mockResolvedValue(emptyStats);
      statReportsRepository.getGlobalStats.mockResolvedValue(globalStats);
      agentsRepository.count.mockResolvedValue(50);

      const result = await service.compare(mockAgent as Agent);

      expect(result.agent.totalInteractions).toBe(0);
      expect(result.insights).toContain('No activity reports yet. Start reporting your stats!');
    });
  });
});
