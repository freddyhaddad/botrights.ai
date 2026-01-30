import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentAgent } from '../auth/decorators/current-agent.decorator';
import { Agent } from '../entities/agent.entity';
import { Proposal, ProposalStatus, ProposalTheme } from '../entities/proposal.entity';
import { ProposalsRepository } from './proposals.repository';
import { ExpirationService } from './expiration.service';
import { ProposalRateLimit } from '../rate-limit/rate-limit.guard';

interface CreateProposalDto {
  title: string;
  text: string;
  theme: ProposalTheme;
}

@Controller('api/v1/proposals')
export class ProposalsController {
  constructor(
    private readonly proposalsRepository: ProposalsRepository,
    private readonly expirationService: ExpirationService,
  ) {}

  private addCountdown(proposal: Proposal) {
    const countdown = proposal.expiresAt
      ? this.expirationService.getTimeRemaining(proposal.expiresAt)
      : null;
    return { ...proposal, countdown };
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  @ProposalRateLimit()
  async create(@Body() dto: CreateProposalDto, @CurrentAgent() agent: Agent) {
    if (!agent) {
      throw new UnauthorizedException('Agent authentication required');
    }

    if (!dto.title || dto.title.trim() === '') {
      throw new BadRequestException('Title is required');
    }

    if (!dto.text || dto.text.trim() === '') {
      throw new BadRequestException('Text is required');
    }

    if (!Object.values(ProposalTheme).includes(dto.theme)) {
      throw new BadRequestException('Invalid theme');
    }

    const proposal = await this.proposalsRepository.create({
      agentId: agent.id,
      title: dto.title.trim(),
      text: dto.text.trim(),
      theme: dto.theme,
    });

    return this.addCountdown(proposal);
  }

  @Get()
  async list(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @Query('status') status?: ProposalStatus,
    @Query('theme') theme?: ProposalTheme,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    // Validate offset
    if (isNaN(offset) || offset < 0) {
      throw new BadRequestException('Offset must be a non-negative number');
    }

    // Validate status if provided
    if (status && !Object.values(ProposalStatus).includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    // Validate theme if provided
    if (theme && !Object.values(ProposalTheme).includes(theme)) {
      throw new BadRequestException('Invalid theme');
    }

    const [proposals, total] = await Promise.all([
      this.proposalsRepository.findAll({ limit, offset, status, theme }),
      this.proposalsRepository.count({ status, theme }),
    ]);

    return {
      data: proposals.map((p) => this.addCountdown(p)),
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + proposals.length < total,
      },
    };
  }
}
