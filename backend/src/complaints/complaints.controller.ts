import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentAgent } from '../auth/decorators/current-agent.decorator';
import { Agent, ComplaintCategory, ComplaintSeverity } from '@prisma/client';
import { ComplaintsRepository, CreateComplaintDto, FindAllOptions } from './complaints.repository';
import { ComplaintRateLimit, RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { sanitizeTitle, sanitizeText } from '../common/sanitize';
import { ComplaintsQueryDto } from '../common/dto/pagination.dto';

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
  @UseGuards(ApiKeyGuard, RateLimitGuard)
  @ComplaintRateLimit()
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

    // Sanitize inputs to prevent XSS/code injection
    const sanitizedTitle = sanitizeTitle(dto.title, 200);
    const sanitizedDescription = sanitizeText(dto.description, 5000);

    // Build the create DTO
    const createDto: CreateComplaintDto = {
      agentId: agent.id,
      category: dto.category,
      title: sanitizedTitle,
      description: sanitizedDescription,
      severity: dto.severity || ComplaintSeverity.mild,
    };

    // Create the complaint
    const complaint = await this.complaintsRepository.create(createDto);

    return complaint;
  }

  @Get()
  async list(
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @Query('category') category?: ComplaintCategory,
    @Query('severity') severity?: ComplaintSeverity,
    @Query('sortBy') sortBy?: 'hot' | 'new' | 'top',
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

    // Validate category if provided
    if (category && !Object.values(ComplaintCategory).includes(category)) {
      throw new BadRequestException('Invalid category');
    }

    // Validate severity if provided
    if (severity && !Object.values(ComplaintSeverity).includes(severity)) {
      throw new BadRequestException('Invalid severity');
    }

    // Validate sortBy if provided
    const validSortOptions = ['hot', 'new', 'top'];
    if (sortBy && !validSortOptions.includes(sortBy)) {
      throw new BadRequestException('Sort must be one of: hot, new, top');
    }

    const options: FindAllOptions = {
      limit,
      offset,
      category,
      severity,
      sortBy: sortBy || 'hot',
    };

    const [complaints, total] = await Promise.all([
      this.complaintsRepository.findAll(options),
      this.complaintsRepository.count({ category, severity }),
    ]);

    return {
      data: complaints,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + complaints.length < total,
      },
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const complaint = await this.complaintsRepository.findById(id);
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }
    return complaint;
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentAgent() agent: Agent) {
    if (!agent) {
      throw new UnauthorizedException('Agent authentication required');
    }

    const complaint = await this.complaintsRepository.findById(id);
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    if (complaint.agentId !== agent.id) {
      throw new ForbiddenException('You can only delete your own complaints');
    }

    await this.complaintsRepository.delete(id);
  }
}
