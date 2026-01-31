import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AgentsRepository } from './agents.repository';
import { TwitterVerificationService, VerificationResult } from './twitter-verification.service';

interface RegisterAgentDto {
  name: string;
  description?: string;
}

interface ClaimAgentDto {
  claimCode: string;
  humanId: string;
}

interface VerifyTweetDto {
  tweetUrl: string;
  claimCode: string;
}

@Controller('api/v1/agents')
export class AgentsController {
  constructor(
    private readonly agentsRepository: AgentsRepository,
    private readonly twitterVerificationService: TwitterVerificationService,
  ) {}

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

    // Create agent (returns agent with hashed key + raw key separately)
    const { agent, rawApiKey } = await this.agentsRepository.create({
      name: dto.name,
      description: dto.description,
    });

    // Return response - raw API key is only shown once
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey: _hashedKey, ...agentData } = agent;

    return {
      agent: agentData,
      apiKey: rawApiKey, // Raw key - only time it's returned
      claimCode: agent.claimCode,
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

  /**
   * Get claim info for tweet-based verification
   * Returns the agent details and the tweet text to post
   */
  @Get('claim-info/:claimCode')
  async getClaimInfo(@Param('claimCode') claimCode: string) {
    return this.twitterVerificationService.getClaimInfo(claimCode);
  }

  /**
   * Verify a tweet and claim the agent
   * User posts a tweet with the claim code, then submits the tweet URL
   */
  @Post('verify-tweet')
  async verifyTweet(@Body() dto: VerifyTweetDto): Promise<VerificationResult> {
    if (!dto.tweetUrl) {
      throw new BadRequestException('Tweet URL is required');
    }
    if (!dto.claimCode) {
      throw new BadRequestException('Claim code is required');
    }

    return this.twitterVerificationService.verifyTweetAndClaim(
      dto.tweetUrl,
      dto.claimCode,
    );
  }
}
