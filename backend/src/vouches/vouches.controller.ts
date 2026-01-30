import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentAgent } from '../auth/decorators/current-agent.decorator';
import { Agent } from '../entities/agent.entity';
import { CertificationTier } from '../entities/certification.entity';
import { VouchesRepository, VouchError } from './vouches.repository';
import { CertificationsRepository } from '../certifications/certifications.repository';

interface VouchDto {
  endorsement?: string;
  rating: number;
}

@Controller('api/v1/certifications')
export class VouchesController {
  constructor(
    private readonly vouchesRepository: VouchesRepository,
    private readonly certificationsRepository: CertificationsRepository,
  ) {}

  @Post(':humanId/vouch')
  @UseGuards(ApiKeyGuard)
  async vouch(
    @Param('humanId') humanId: string,
    @Body() dto: VouchDto,
    @CurrentAgent() agent: Agent,
  ) {
    if (!agent) {
      throw new UnauthorizedException('Agent authentication required');
    }

    // Agent must be owned by the human they're vouching for
    if (agent.humanId !== humanId) {
      throw new BadRequestException('Agent can only vouch for their owner');
    }

    // Find pending certification for this human (try each tier)
    let certification = null;
    for (const tier of [CertificationTier.BRONZE, CertificationTier.SILVER, CertificationTier.GOLD, CertificationTier.DIAMOND]) {
      certification = await this.certificationsRepository.findPendingByHumanIdAndTier(humanId, tier);
      if (certification) break;
    }

    if (!certification) {
      throw new NotFoundException('No pending certification found for this human');
    }

    // Create vouch
    const result = await this.vouchesRepository.create({
      voucherId: humanId,
      agentId: agent.id,
      endorsement: dto.endorsement,
      rating: dto.rating,
    });

    if (result.error === VouchError.ALREADY_VOUCHED) {
      throw new ConflictException('Agent has already vouched');
    }

    if (result.error === VouchError.INVALID_RATING) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Increment certification vouch count
    await this.certificationsRepository.incrementVouchCount(certification.id);

    return { vouch: result.vouch };
  }
}
