import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { CertificationsRepository } from './certifications.repository';
import { CertificationTier } from '../entities/certification.entity';
import { Human } from '../entities/human.entity';

// Simple decorator to extract human from request (set by JWT guard)
export const CurrentHuman = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Human | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.human;
  },
);

interface ApplyDto {
  tier: CertificationTier;
}

@Controller('api/v1/certifications')
export class CertificationsController {
  constructor(private readonly certificationsRepository: CertificationsRepository) {}

  @Post('apply')
  async apply(@Body() dto: ApplyDto, @CurrentHuman() human: Human) {
    if (!human) {
      throw new UnauthorizedException('Human authentication required');
    }

    // Validate tier
    if (!Object.values(CertificationTier).includes(dto.tier)) {
      throw new BadRequestException('Invalid certification tier');
    }

    // Can't apply for NONE
    if (dto.tier === CertificationTier.NONE) {
      throw new BadRequestException('Cannot apply for NONE tier');
    }

    // Check for existing pending application
    const existing = await this.certificationsRepository.findPendingByHumanIdAndTier(
      human.id,
      dto.tier,
    );
    if (existing) {
      throw new ConflictException('Pending application already exists for this tier');
    }

    const certification = await this.certificationsRepository.create({
      humanId: human.id,
      tier: dto.tier,
    });

    return certification;
  }

  @Get('my')
  async getMyApplications(@CurrentHuman() human: Human) {
    if (!human) {
      throw new UnauthorizedException('Human authentication required');
    }

    return this.certificationsRepository.findByHumanId(human.id);
  }
}
