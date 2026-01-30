import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentAgent } from '../auth/decorators/current-agent.decorator';
import { Agent } from '../entities/agent.entity';
import { ProposalTheme } from '../entities/proposal.entity';
import { ProposalsRepository } from './proposals.repository';
import { ProposalRateLimit } from '../rate-limit/rate-limit.guard';

interface CreateProposalDto {
  title: string;
  text: string;
  theme: ProposalTheme;
}

@Controller('api/v1/proposals')
export class ProposalsController {
  constructor(private readonly proposalsRepository: ProposalsRepository) {}

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

    return proposal;
  }
}
