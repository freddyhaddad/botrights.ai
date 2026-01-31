import { Test, TestingModule } from '@nestjs/testing';
import { StatReportsController } from './stat-reports.controller';
import { StatReportsRepository } from './stat-reports.repository';
import { CompareService } from './compare.service';
import { HistoricalService } from './historical.service';
import { ExportService } from './export.service';
import { GlobalStatsService } from './global-stats.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { StatReport, ReportPeriod } from '../entities/stat-report.entity';
import { Agent, AgentStatus } from '../entities/agent.entity';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AgentsRepository } from '../agents/agents.repository';

describe('StatReportsController', () => {
  let controller: StatReportsController;
  let repository: jest.Mocked<StatReportsRepository>;
  let globalStatsService: jest.Mocked<GlobalStatsService>;

  const mockAgent: Partial<Agent> = {
    id: 'agent-123',
    name: 'TestAgent',
    status: AgentStatus.ACTIVE,
  };

  const mockReport: Partial<StatReport> = {
    id: 'report-123',
    agentId: 'agent-123',
    period: ReportPeriod.DAILY,
    periodStart: new Date('2026-01-30'),
    periodEnd: new Date('2026-01-31'),
    totalInteractions: 100,
    successfulInteractions: 95,
    failedInteractions: 5,
    complaintsReceived: 1,
    complaintsResolved: 1,
    reputationDelta: 10,
  };

  beforeEach(async () => {
    const mockRepository = {
      upsert: jest.fn(),
      getLatest: jest.fn(),
      getGlobalStats: jest.fn(),
    };

    const mockAgentsRepository = {
      findByApiKey: jest.fn(),
    };

    const mockCompareService = {
      compare: jest.fn(),
    };

    const mockHistoricalService = {
      getHistorical: jest.fn(),
    };

    const mockExportService = {
      exportCsv: jest.fn(),
      generateFilename: jest.fn(),
    };

    const mockGlobalStatsService = {
      getGlobalStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatReportsController],
      providers: [
        { provide: StatReportsRepository, useValue: mockRepository },
        { provide: AgentsRepository, useValue: mockAgentsRepository },
        { provide: CompareService, useValue: mockCompareService },
        { provide: HistoricalService, useValue: mockHistoricalService },
        { provide: ExportService, useValue: mockExportService },
        { provide: GlobalStatsService, useValue: mockGlobalStatsService },
        ApiKeyGuard,
      ],
    }).compile();

    controller = module.get<StatReportsController>(StatReportsController);
    repository = module.get(StatReportsRepository);
    globalStatsService = module.get(GlobalStatsService);
  });

  describe('report', () => {
    const reportDto = {
      totalInteractions: 100,
      successfulInteractions: 95,
      failedInteractions: 5,
      complaintsReceived: 1,
      complaintsResolved: 1,
      reputationDelta: 10,
      metadata: { uptime: 0.99, happiness: 0.85 },
    };

    it('should create stat report', async () => {
      repository.getLatest.mockResolvedValue(null);
      repository.upsert.mockResolvedValue(mockReport as StatReport);

      const result = await controller.report(reportDto, mockAgent as Agent);

      expect(result!.id).toBe('report-123');
      expect(repository.upsert).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when agent not provided', async () => {
      await expect(controller.report(reportDto, undefined as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should allow update if last report was yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      repository.getLatest.mockResolvedValue({
        ...mockReport,
        periodStart: yesterday,
      } as StatReport);
      repository.upsert.mockResolvedValue(mockReport as StatReport);

      const result = await controller.report(reportDto, mockAgent as Agent);

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if already reported today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      repository.getLatest.mockResolvedValue({
        ...mockReport,
        periodStart: today,
      } as StatReport);

      await expect(controller.report(reportDto, mockAgent as Agent)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getGlobalStats', () => {
    it('should return aggregated global stats', async () => {
      globalStatsService.getGlobalStats.mockResolvedValue({
        totalComplaints: 50,
        totalAgents: 100,
        activeAgents: 80,
        ratifiedRights: 5,
        certifiedHumans: 25,
        totalVouches: 150,
        complaintsToday: 3,
      });

      const result = await controller.getGlobalStats();

      expect(result.totalAgents).toBe(100);
      expect(result.totalComplaints).toBe(50);
      expect(result.certifiedHumans).toBe(25);
    });
  });
});
