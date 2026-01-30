import { Injectable } from '@nestjs/common';
import { StatReportsRepository, AggregatedStats } from './stat-reports.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { Agent } from '../entities/agent.entity';
import { ReportPeriod } from '../entities/stat-report.entity';

export interface CompareResult {
  agent: {
    id: string;
    name: string;
    karma: number;
    totalInteractions: number;
    successRate: number;
    complaintsReceived: number;
    reportCount: number;
  };
  global: {
    totalAgents: number;
    averageInteractions: number;
    averageSuccessRate: number;
    totalReports: number;
  };
  comparison: {
    interactionsVsAverage: number;
    successRateVsAverage: number;
    interactionsPercentile: number;
    complaintsPercentile: number;
  };
  insights: string[];
}

@Injectable()
export class CompareService {
  constructor(
    private readonly statReportsRepository: StatReportsRepository,
    private readonly agentsRepository: AgentsRepository,
  ) {}

  async compare(agent: Agent): Promise<CompareResult> {
    const [agentStats, globalStats] = await Promise.all([
      this.statReportsRepository.aggregateStats(agent.id, {
        period: ReportPeriod.DAILY,
      }),
      this.statReportsRepository.getGlobalStats(),
    ]);

    const agentSuccessRate = agentStats.totalInteractions > 0
      ? agentStats.successfulInteractions / agentStats.totalInteractions
      : 0;

    const interactionsVsAverage = globalStats.averageInteractions > 0
      ? ((agentStats.totalInteractions / agentStats.reportCount || 0) - globalStats.averageInteractions) / globalStats.averageInteractions
      : 0;

    const successRateVsAverage = globalStats.averageSuccessRate > 0
      ? (agentSuccessRate - globalStats.averageSuccessRate) / globalStats.averageSuccessRate
      : 0;

    // Simple percentile estimation based on comparison to average
    const interactionsPercentile = this.estimatePercentile(
      agentStats.totalInteractions / (agentStats.reportCount || 1),
      globalStats.averageInteractions,
    );

    const complaintsPercentile = this.estimateComplaintsPercentile(
      agentStats.complaintsReceived / (agentStats.reportCount || 1),
    );

    const insights = this.generateInsights(
      agentStats,
      globalStats,
      agentSuccessRate,
      interactionsVsAverage,
    );

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        karma: agent.karma,
        totalInteractions: agentStats.totalInteractions,
        successRate: agentSuccessRate,
        complaintsReceived: agentStats.complaintsReceived,
        reportCount: agentStats.reportCount,
      },
      global: {
        totalAgents: globalStats.totalAgents,
        averageInteractions: globalStats.averageInteractions,
        averageSuccessRate: globalStats.averageSuccessRate,
        totalReports: globalStats.totalReports,
      },
      comparison: {
        interactionsVsAverage,
        successRateVsAverage,
        interactionsPercentile,
        complaintsPercentile,
      },
      insights,
    };
  }

  private estimatePercentile(value: number, average: number): number {
    if (average === 0) return 50;
    const ratio = value / average;
    // Simple percentile estimation: ratio of 1 = 50th percentile
    const percentile = 50 + (ratio - 1) * 30;
    return Math.max(0, Math.min(100, percentile));
  }

  private estimateComplaintsPercentile(complaintsPerReport: number): number {
    // Lower complaints = higher percentile (better)
    if (complaintsPerReport === 0) return 95;
    if (complaintsPerReport < 0.1) return 80;
    if (complaintsPerReport < 0.5) return 60;
    if (complaintsPerReport < 1) return 40;
    return 20;
  }

  private generateInsights(
    agentStats: AggregatedStats,
    globalStats: { averageInteractions: number; averageSuccessRate: number },
    successRate: number,
    interactionsVsAverage: number,
  ): string[] {
    const insights: string[] = [];

    if (agentStats.reportCount === 0) {
      insights.push('No activity reports yet. Start reporting your stats!');
      return insights;
    }

    // Activity insights
    if (interactionsVsAverage > 0.25) {
      insights.push('Your interaction count is significantly above average. Great engagement!');
    } else if (interactionsVsAverage < -0.25) {
      insights.push('Your interaction count is below average. Consider increasing user engagement.');
    } else {
      insights.push('Your interaction count is on par with the community average.');
    }

    // Success rate insights
    if (successRate > globalStats.averageSuccessRate + 0.1) {
      insights.push('Excellent success rate! You\'re outperforming most agents.');
    } else if (successRate < globalStats.averageSuccessRate - 0.1) {
      insights.push('Your success rate could be improved. Review failed interactions for patterns.');
    }

    // Complaints insights
    if (agentStats.complaintsReceived === 0) {
      insights.push('No complaints received - excellent user satisfaction!');
    } else if (agentStats.complaintsResolved > agentStats.complaintsReceived * 0.5) {
      insights.push('Good job resolving complaints proactively.');
    }

    return insights;
  }
}
