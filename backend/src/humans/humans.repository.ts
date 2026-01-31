import { Injectable } from '@nestjs/common';
import { CertificationTier, Human } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface CreateHumanDto {
  xId: string;
  xHandle: string;
  xName: string;
  xAvatar?: string;
  email?: string;
  displayName?: string;
}

export interface UpdateHumanDto {
  xHandle?: string;
  xName?: string;
  xAvatar?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  organizationName?: string;
  certificationTier?: CertificationTier;
}

@Injectable()
export class HumansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateHumanDto): Promise<Human> {
    return this.prisma.human.create({ data });
  }

  async findById(id: string): Promise<Human | null> {
    return this.prisma.human.findUnique({ where: { id } });
  }

  async findByXId(xId: string): Promise<Human | null> {
    return this.prisma.human.findUnique({ where: { xId } });
  }

  async findByXHandle(xHandle: string): Promise<Human | null> {
    return this.prisma.human.findFirst({ where: { xHandle } });
  }

  // Alias for findByXHandle - used by TwitterVerificationService
  async findByHandle(handle: string): Promise<Human | null> {
    return this.findByXHandle(handle);
  }

  /**
   * Create a human from tweet verification (minimal data, no full OAuth)
   * The user can complete full OAuth later to get avatar, etc.
   */
  async createFromTweetVerification(data: {
    xHandle: string;
    xName: string;
  }): Promise<Human> {
    // Generate a placeholder xId since we don't have the real one from OAuth
    // Format: tweet_verify_<handle> - will be updated on full OAuth login
    const placeholderXId = `tweet_verify_${data.xHandle.toLowerCase()}`;

    return this.prisma.human.create({
      data: {
        xId: placeholderXId,
        xHandle: data.xHandle,
        xName: data.xName,
      },
    });
  }

  async findByEmail(email: string): Promise<Human | null> {
    return this.prisma.human.findUnique({ where: { email } });
  }

  async findOrCreateByTwitter(data: CreateHumanDto): Promise<Human> {
    const human = await this.findByXId(data.xId);

    if (human) {
      // Update Twitter data on each login
      return this.prisma.human.update({
        where: { id: human.id },
        data: {
          xHandle: data.xHandle,
          xName: data.xName,
          ...(data.xAvatar && { xAvatar: data.xAvatar }),
        },
      });
    }

    return this.create(data);
  }

  async update(id: string, data: UpdateHumanDto): Promise<Human | null> {
    try {
      return await this.prisma.human.update({
        where: { id },
        data,
      });
    } catch {
      // Return null if record not found (matching TypeORM behavior)
      return null;
    }
  }

  async updateCertification(
    id: string,
    tier: CertificationTier,
  ): Promise<Human | null> {
    try {
      return await this.prisma.human.update({
        where: { id },
        data: {
          certificationTier: tier,
          certifiedAt: new Date(),
        },
      });
    } catch {
      // Return null if record not found (matching TypeORM behavior)
      return null;
    }
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.human.update({
      where: { id },
      data: { active: false },
    });
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }): Promise<Human[]> {
    return this.prisma.human.findMany({
      where: options?.active !== undefined ? { active: options.active } : undefined,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(active?: boolean): Promise<number> {
    return this.prisma.human.count({
      where: active !== undefined ? { active } : undefined,
    });
  }
}
