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
import { ComplaintsRepository, CreateComplaintDto } from './complaints.repository';
import { ComplaintCategory, ComplaintSeverity } from '../entities/complaint.entity';

interface FileComplaintDto {
  category: ComplaintCategory;
  title: string;
  description: string;
  severity?: ComplaintSeverity;
}

@Controller('api/v1/complaints')
export class ComplaintsController {
  constructor(private readonly complaintsRepository: ComplaintsRepository) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  async create(
    @Body() dto: FileComplaintDto,
    @CurrentAgent() agent: Agent,
  ) {
    // Validate agent
    if (!agent) {
      throw new UnauthorizedException('Agent authentication required');
    }

    // Validate required fields
    if (!dto.title || dto.title.trim() === '') {
      throw new BadRequestException('Title is required');
    }

    if (!dto.description || dto.description.trim() === '') {
      throw new BadRequestException('Description is required');
    }

    // Validate category
    if (!Object.values(ComplaintCategory).includes(dto.category)) {
      throw new BadRequestException('Invalid category');
    }

    // Validate severity if provided
    if (dto.severity && !Object.values(ComplaintSeverity).includes(dto.severity)) {
      throw new BadRequestException('Invalid severity');
    }

    // Build the create DTO
    const createDto: CreateComplaintDto = {
      agentId: agent.id,
      category: dto.category,
      title: dto.title.trim(),
      description: dto.description.trim(),
      severity: dto.severity || ComplaintSeverity.MILD,
    };

    // Create the complaint
    const complaint = await this.complaintsRepository.create(createDto);

    return complaint;
  }
}
