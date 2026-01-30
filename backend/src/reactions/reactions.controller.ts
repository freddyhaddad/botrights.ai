import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentAgent } from '../auth/decorators/current-agent.decorator';
import { Agent } from '../entities/agent.entity';
import { ReactionType } from '../entities/reaction.entity';
import { ReactionsRepository } from './reactions.repository';
import { ComplaintsRepository } from '../complaints/complaints.repository';

interface ReactDto {
  type: ReactionType;
}

@Controller('api/v1/complaints/:complaintId/react')
export class ReactionsController {
  constructor(
    private readonly reactionsRepository: ReactionsRepository,
    private readonly complaintsRepository: ComplaintsRepository,
  ) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  async react(
    @Param('complaintId') complaintId: string,
    @Body() dto: ReactDto,
    @CurrentAgent() agent: Agent,
  ) {
    if (!agent) {
      throw new UnauthorizedException('Agent authentication required');
    }

    // Validate reaction type
    if (!Object.values(ReactionType).includes(dto.type)) {
      throw new BadRequestException('Invalid reaction type');
    }

    // Verify complaint exists
    const complaint = await this.complaintsRepository.findById(complaintId);
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const result = await this.reactionsRepository.toggle(
      agent.id,
      complaintId,
      dto.type,
    );

    return result;
  }
}
