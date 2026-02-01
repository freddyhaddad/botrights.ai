import { Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';

export class PaginationQueryDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 20;

  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsInt({ message: 'Offset must be an integer' })
  @Min(0, { message: 'Offset must be non-negative' })
  offset?: number = 0;
}

export class ProposalsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['proposed', 'active', 'ratified', 'rejected', 'expired'], {
    message: 'Status must be one of: proposed, active, ratified, rejected, expired'
  })
  status?: string;

  @IsOptional()
  @IsEnum(['moderation', 'technical', 'governance', 'community', 'ethics'], {
    message: 'Theme must be one of: moderation, technical, governance, community, ethics'
  })
  theme?: string;
}

export class ComplaintsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['spam', 'harassment', 'misinformation', 'copyright', 'inappropriate', 'technical'], {
    message: 'Category must be one of: spam, harassment, misinformation, copyright, inappropriate, technical'
  })
  category?: string;

  @IsOptional()
  @IsEnum(['mild', 'moderate', 'severe', 'critical'], {
    message: 'Severity must be one of: mild, moderate, severe, critical'
  })
  severity?: string;

  @IsOptional()
  @IsEnum(['hot', 'new', 'top'], {
    message: 'SortBy must be one of: hot, new, top'
  })
  sortBy?: 'hot' | 'new' | 'top' = 'hot';
}

export class LeaderboardQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['bronze', 'silver', 'gold', 'platinum', 'diamond'], {
    message: 'Tier must be one of: bronze, silver, gold, platinum, diamond'
  })
  tier?: string;
}

export class StatReportsQueryDto {
  @IsOptional()
  @IsEnum(['weekly', 'monthly'], {
    message: 'Granularity must be one of: weekly, monthly'
  })
  granularity?: string;

  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endDate?: Date;
}

export class CharterDiffQueryDto {
  @Transform(({ value }) => value?.trim())
  @IsOptional()
  @IsString({ message: 'From version must be a string' })
  from?: string;

  @Transform(({ value }) => value?.trim())
  @IsOptional()
  @IsString({ message: 'To version must be a string' })
  to?: string;
}