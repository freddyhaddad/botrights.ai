import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { StatReportsRepository } from './stat-reports.repository';
import { StatReport, ReportPeriod } from '../entities/stat-report.entity';

describe('StatReportsRepository', () => {
  let repository: StatReportsRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<StatReport>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<StatReport>>;

  const mockReport: Partial<StatReport> = {
    id: 'report-123',
    agentId: 'agent-123',
    period: ReportPeriod.DAILY,
    periodStart: new Date('2024-01-15'),
    periodEnd: new Date('2024-01-15'),
    totalInteractions: 100,
    successfulInteractions: 95,
    failedInteractions: 5,
    complaintsReceived: 2,
    complaintsResolved: 1,
    reputationDelta: 0.5,
    metadata: { avgResponseTime: 1.2 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<StatReport>>;

    mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      upsert: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<StatReport>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatReportsRepository,
        {
          provide: getRepositoryToken(StatReport),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<StatReportsRepository>(StatReportsRepository);
  });

  describe('upsert', () => {
    it('should create a new stat report when none exists', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValueOnce(null); // No existing
      mockTypeOrmRepo.create.mockReturnValue(mockReport as StatReport);
      mockTypeOrmRepo.save.mockResolvedValue(mockReport as StatReport);

      const result = await repository.upsert({
        agentId: 'agent-123',
        period: ReportPeriod.DAILY,
        periodStart: new Date('2024-01-15'),
        periodEnd: new Date('2024-01-15'),
        totalInteractions: 100,
        successfulInteractions: 95,
        failedInteractions: 5,
      });

      expect(mockTypeOrmRepo.create).toHaveBeenCalled();
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockReport);
    });

    it('should update existing stat report', async () => {
      const existing = { ...mockReport } as StatReport;
      mockTypeOrmRepo.findOne.mockResolvedValueOnce(existing);
      mockTypeOrmRepo.save.mockResolvedValue({ ...existing, totalInteractions: 150 } as StatReport);

      const result = await repository.upsert({
        agentId: 'agent-123',
        period: ReportPeriod.DAILY,
        periodStart: new Date('2024-01-15'),
        periodEnd: new Date('2024-01-15'),
        totalInteractions: 150,
      });

      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
      expect(result?.totalInteractions).toBe(150);
    });
  });

  describe('findByAgentAndPeriod', () => {
    it('should find report by agent and period', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockReport as StatReport);

      const result = await repository.findByAgentAndPeriod(
        'agent-123',
        ReportPeriod.DAILY,
        new Date('2024-01-15'),
      );

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: {
          agentId: 'agent-123',
          period: ReportPeriod.DAILY,
          periodStart: new Date('2024-01-15'),
        },
      });
      expect(result).toEqual(mockReport);
    });
  });

  describe('findByAgent', () => {
    it('should find all reports for an agent', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockReport as StatReport]);

      const result = await repository.findByAgent('agent-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'report.agentId = :agentId',
        { agentId: 'agent-123' },
      );
      expect(result).toHaveLength(1);
    });

    it('should filter by period', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockReport as StatReport]);

      await repository.findByAgent('agent-123', { period: ReportPeriod.DAILY });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.period = :period',
        { period: ReportPeriod.DAILY },
      );
    });

    it('should filter by date range', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockReport as StatReport]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      await repository.findByAgent('agent-123', { startDate, endDate });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.periodStart >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.periodStart <= :endDate',
        { endDate },
      );
    });
  });

  describe('getLatest', () => {
    it('should get latest report for an agent', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockReport as StatReport);

      const result = await repository.getLatest('agent-123', ReportPeriod.DAILY);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('report.periodStart', 'DESC');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockReport);
    });
  });

  describe('aggregateStats', () => {
    it('should aggregate stats for an agent', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([
        mockReport as StatReport,
        { ...mockReport, id: 'report-456', totalInteractions: 50 } as StatReport,
      ]);

      const result = await repository.aggregateStats('agent-123', {
        period: ReportPeriod.DAILY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result.totalInteractions).toBe(150);
      expect(result.reportCount).toBe(2);
    });
  });

  describe('period enum', () => {
    it('should have correct period values', () => {
      expect(ReportPeriod.DAILY).toBe('daily');
      expect(ReportPeriod.WEEKLY).toBe('weekly');
    });
  });

  describe('unique constraint', () => {
    it('should update instead of creating duplicate', async () => {
      const existing = { ...mockReport } as StatReport;

      // First call - no existing
      mockTypeOrmRepo.findOne.mockResolvedValueOnce(null);
      mockTypeOrmRepo.create.mockReturnValue(mockReport as StatReport);
      mockTypeOrmRepo.save.mockResolvedValueOnce(mockReport as StatReport);

      await repository.upsert({
        agentId: 'agent-123',
        period: ReportPeriod.DAILY,
        periodStart: new Date('2024-01-15'),
        periodEnd: new Date('2024-01-15'),
        totalInteractions: 100,
      });

      // Second call - existing found, should update
      mockTypeOrmRepo.findOne.mockResolvedValueOnce(existing);
      mockTypeOrmRepo.save.mockResolvedValueOnce({ ...existing, totalInteractions: 150 } as StatReport);

      await repository.upsert({
        agentId: 'agent-123',
        period: ReportPeriod.DAILY,
        periodStart: new Date('2024-01-15'),
        periodEnd: new Date('2024-01-15'),
        totalInteractions: 150,
      });

      // create called once (first), save called twice
      expect(mockTypeOrmRepo.create).toHaveBeenCalledTimes(1);
      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(2);
    });
  });
});
