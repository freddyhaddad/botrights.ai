import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AgentsRepository } from './agents.repository';

interface RegisterAgentDto {
  name: string;
  description?: string;
}

interface ClaimAgentDto {
  claimCode: string;
  humanId: string;
}

@Controller('api/v1/agents')
export class AgentsController {
  constructor(private readonly agentsRepository: AgentsRepository) {}

  @Post('register')
  async register(@Body() dto: RegisterAgentDto) {
    // Validate name format: alphanumeric and underscores, 3-50 chars
    if (!dto.name || dto.name.length < 3) {
      throw new BadRequestException('Name must be at least 3 characters');
    }
    if (dto.name.length > 50) {
      throw new BadRequestException('Name must be at most 50 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(dto.name)) {
      throw new BadRequestException('Name must contain only alphanumeric characters and underscores');
    }

    // Check for duplicate name
    const existing = await this.agentsRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException('An agent with this name already exists');
    }

    // Create agent
    const agent = await this.agentsRepository.create({
      name: dto.name,
      description: dto.description,
    });

    // Return response with api_key and claim_code
    // Note: apiKey is not included in normal agent responses, so we extract it here
    const { apiKey, claimCode, ...agentData } = agent;

    return {
      agent: agentData,
      apiKey,
      claimCode,
    };
  }

  @Get('status/:claimCode')
  async getStatus(@Param('claimCode') claimCode: string) {
    const agent = await this.agentsRepository.findByClaimCode(claimCode);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return {
      claimed: !!agent.claimedAt,
      agentId: agent.id,
    };
  }

  @Post('claim')
  async claim(@Body() dto: ClaimAgentDto) {
    const agent = await this.agentsRepository.findByClaimCode(dto.claimCode);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    if (agent.claimedAt) {
      throw new ConflictException('Agent already claimed');
    }
    return this.agentsRepository.claim(agent.id, dto.humanId, dto.claimCode);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const agent = await this.agentsRepository.findById(id);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return agent;
  }
}
