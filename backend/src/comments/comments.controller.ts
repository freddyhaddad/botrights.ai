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
import { CommentsRepository } from './comments.repository';
import { ComplaintsRepository } from '../complaints/complaints.repository';
import { CommentRateLimit } from '../rate-limit/rate-limit.guard';

interface CreateCommentDto {
  content: string;
  parentId?: string;
}

@Controller('api/v1/complaints/:complaintId/comments')
export class CommentsController {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly complaintsRepository: ComplaintsRepository,
  ) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  @CommentRateLimit()
  async create(
    @Param('complaintId') complaintId: string,
    @Body() dto: CreateCommentDto,
    @CurrentAgent() agent: Agent,
  ) {
    if (!agent) {
      throw new UnauthorizedException('Agent authentication required');
    }

    if (!dto.content || dto.content.trim() === '') {
      throw new BadRequestException('Content is required');
    }

    // Verify complaint exists
    const complaint = await this.complaintsRepository.findById(complaintId);
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Verify parent comment exists if provided
    if (dto.parentId) {
      const parent = await this.commentsRepository.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.commentsRepository.create({
      agentId: agent.id,
      complaintId,
      content: dto.content.trim(),
      parentId: dto.parentId,
    });

    return comment;
  }
}
