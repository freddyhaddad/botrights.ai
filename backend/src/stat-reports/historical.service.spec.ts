import { Test, TestingModule } from '@nestjs/testing';
import { HistoricalService, Granularity } from './historical.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { StatReport, ReportPeriod } from '../entities/stat-report.entity';

describe('HistoricalService', () => {
  let service: HistoricalService;
  let repository: jest.Mocked<Repository<StatReport>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<StatReport>>;

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<StatReport>>;

    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as jest.Mocked<Repository<StatReport>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricalService,
        {
          provide: getRepositoryToken(StatReport),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<HistoricalService>(HistoricalService);
  });

  describe('getHistorical', () => {
    it('should return weekly aggregated data', async () => {
      const mockData = [
        {
          period: '2026-01',
          totalInteractions: '1000',
          totalReports: '50',
          avgSuccessRate: '0.95',
          avgComplaints: '0.5',
        },
        {
          period: '2026-02',
          totalInteractions: '1200',
          totalReports: '60',
          avgSuccessRate: '0.92',
          avgComplaints: '0.8',
        },
      ];

      queryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getHistorical(Granularity.WEEKLY);

      expect(result.data).toHaveLength(2);
      expect(result.granularity).toBe('weekly');
    });

    it('should return monthly aggregated data', async () => {
      const mockData = [
        {
          period: '2026-01',
          totalInteractions: '5000',
          totalReports: '200',
          avgSuccessRate: '0.93',
          avgComplaints: '0.6',
        },
      ];

      queryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getHistorical(Granularity.MONTHLY);

      expect(result.granularity).toBe('monthly');
      expect(result.data[0].totalInteractions).toBe(5000);
    });

    it('should format data for charts', async () => {
      const mockData = [
        {
          period: '2026-W04',
          totalInteractions: '1000',
          totalReports: '50',
          avgSuccessRate: '0.95',
          avgComplaints: '0.5',
        },
      ];

      queryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getHistorical(Granularity.WEEKLY);

      expect(result.data[0]).toHaveProperty('period');
      expect(result.data[0]).toHaveProperty('totalInteractions');
      expect(result.data[0]).toHaveProperty('avgSuccessRate');
    });

    it('should apply date range filter', async () => {
      const mockData = [
        {
          period: '2026-01',
          totalInteractions: '1000',
          totalReports: '50',
          avgSuccessRate: '0.95',
          avgComplaints: '0.5',
        },
      ];

      queryBuilder.getRawMany.mockResolvedValue(mockData);
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await service.getHistorical(Granularity.WEEKLY, startDate, endDate);

      expect(queryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should return empty array when no data', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getHistorical(Granularity.WEEKLY);

      expect(result.data).toHaveLength(0);
    });
  });
});
