import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { HistoricalService, Granularity } from './historical.service';

describe('ExportService', () => {
  let service: ExportService;
  let historicalService: jest.Mocked<HistoricalService>;

  beforeEach(async () => {
    historicalService = {
      getHistorical: jest.fn(),
    } as unknown as jest.Mocked<HistoricalService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: HistoricalService,
          useValue: historicalService,
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  describe('exportCsv', () => {
    it('should return valid CSV content', async () => {
      const mockData = {
        granularity: Granularity.WEEKLY,
        data: [
          {
            period: '2026-W04',
            totalInteractions: 1000,
            totalReports: 50,
            avgSuccessRate: 0.95,
            avgComplaints: 0.5,
          },
          {
            period: '2026-W05',
            totalInteractions: 1200,
            totalReports: 60,
            avgSuccessRate: 0.92,
            avgComplaints: 0.8,
          },
        ],
      };

      historicalService.getHistorical.mockResolvedValue(mockData);

      const csv = await service.exportCsv(Granularity.WEEKLY);

      expect(csv).toContain('period,totalInteractions,totalReports,avgSuccessRate,avgComplaints');
      expect(csv).toContain('2026-W04,1000,50,0.95,0.5');
      expect(csv).toContain('2026-W05,1200,60,0.92,0.8');
    });

    it('should include header row', async () => {
      historicalService.getHistorical.mockResolvedValue({
        granularity: Granularity.MONTHLY,
        data: [],
      });

      const csv = await service.exportCsv(Granularity.MONTHLY);

      const lines = csv.split('\n');
      expect(lines[0]).toBe('period,totalInteractions,totalReports,avgSuccessRate,avgComplaints');
    });

    it('should handle empty data', async () => {
      historicalService.getHistorical.mockResolvedValue({
        granularity: Granularity.WEEKLY,
        data: [],
      });

      const csv = await service.exportCsv(Granularity.WEEKLY);

      const lines = csv.trim().split('\n');
      expect(lines).toHaveLength(1); // Only header
    });

    it('should pass date filters to historical service', async () => {
      historicalService.getHistorical.mockResolvedValue({
        granularity: Granularity.WEEKLY,
        data: [],
      });

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await service.exportCsv(Granularity.WEEKLY, startDate, endDate);

      expect(historicalService.getHistorical).toHaveBeenCalledWith(
        Granularity.WEEKLY,
        startDate,
        endDate,
      );
    });

    it('should generate filename with date range', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const filename = service.generateFilename(Granularity.WEEKLY, startDate, endDate);

      expect(filename).toContain('botrights-stats');
      expect(filename).toContain('weekly');
      expect(filename).toContain('.csv');
    });

    it('should generate filename without date range', () => {
      const filename = service.generateFilename(Granularity.MONTHLY);

      expect(filename).toContain('botrights-stats');
      expect(filename).toContain('monthly');
      expect(filename).toContain('.csv');
    });
  });
});
