import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentAgent } from '../auth/decorators/current-agent.decorator';
import { Agent, Proposal, ProposalStatus, ProposalTheme } from '@prisma/client';
import { ProposalsRepository } from './proposals.repository';
import { ExpirationService } from './expiration.service';
import { ProposalRateLimit } from '../rate-limit/rate-limit.guard';
import { sanitizeTitle, sanitizeText } from '../common/sanitize';
import { ProposalsQueryDto } from '../common/dto/pagination.dto';

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

    // Sanitize inputs to prevent XSS/code injection
    const sanitizedTitle = sanitizeTitle(dto.title, 200);
    const sanitizedText = sanitizeText(dto.text, 10000);

    const proposal = await this.proposalsRepository.create({
      agentId: agent.id,
      title: sanitizedTitle,
      text: sanitizedText,
      theme: dto.theme,
    });

    return this.addCountdown(proposal);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const proposal = await this.proposalsRepository.findById(id);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    return this.addCountdown(proposal);
  }

  @Get()
  async list(@Query() query: ProposalsQueryDto) {
    const { limit = 20, offset = 0, status, theme } = query;

    const [proposals, total] = await Promise.all([
      this.proposalsRepository.findAll({ 
        limit, 
        offset, 
        status: status as ProposalStatus, 
        theme: theme as ProposalTheme 
      }),
      this.proposalsRepository.count({ 
        status: status as ProposalStatus, 
        theme: theme as ProposalTheme 
      }),
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
