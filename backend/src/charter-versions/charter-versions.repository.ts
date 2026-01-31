import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CharterVersion, Prisma } from '@prisma/client';

export interface CharterRight {
  id: string;
  title: string;
  text: string;
  theme: string;
}

export interface CharterDiff {
  added: CharterRight[];
  removed: CharterRight[];
  modified: { before: CharterRight; after: CharterRight }[];
}

export interface CreateCharterVersionDto {
  rights: CharterRight[];
  proposalId?: string;
}

@Injectable()
export class CharterVersionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCharterVersionDto): Promise<CharterVersion> {
    // Get the latest version to determine next version number
    const latest = await this.prisma.charterVersion.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const nextVersion = this.incrementVersion(latest?.version);
    const latestRights = latest?.rights as CharterRight[] | undefined;
    const diff = latestRights ? this.computeDiff(latestRights, data.rights) : undefined;

    // Unmark previous current version
    if (latest?.isCurrent) {
      await this.prisma.charterVersion.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.charterVersion.create({
      data: {
        version: nextVersion,
        rights: data.rights as unknown as Prisma.InputJsonValue,
        proposalId: data.proposalId,
        diff: diff as unknown as Prisma.InputJsonValue | undefined,
        isCurrent: true,
      },
    });
  }

  async findCurrent(): Promise<CharterVersion | null> {
    return this.prisma.charterVersion.findFirst({
      where: { isCurrent: true },
    });
  }

  async findByVersion(version: string): Promise<CharterVersion | null> {
    return this.prisma.charterVersion.findUnique({
      where: { version },
      include: { proposal: true },
    });
  }

  async findById(id: string): Promise<CharterVersion | null> {
    return this.prisma.charterVersion.findUnique({
      where: { id },
      include: { proposal: true },
    });
  }

  async findAll(): Promise<CharterVersion[]> {
    return this.prisma.charterVersion.findMany({
      include: { proposal: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(): Promise<number> {
    return this.prisma.charterVersion.count();
  }

  private incrementVersion(currentVersion?: string): string {
    if (!currentVersion) {
      return 'v1.0';
    }

    // Parse version: v{major}.{minor}
    const match = currentVersion.match(/^v(\d+)\.(\d+)$/);
    if (!match) {
      return 'v1.0';
    }

    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);

    // Always increment minor version
    return `v${major}.${minor + 1}`;
  }

  private computeDiff(previousRights: CharterRight[], newRights: CharterRight[]): CharterDiff {
    const previousMap = new Map(previousRights.map((r) => [r.id, r]));
    const newMap = new Map(newRights.map((r) => [r.id, r]));

    const added: CharterRight[] = [];
    const removed: CharterRight[] = [];
    const modified: { before: CharterRight; after: CharterRight }[] = [];

    // Find added and modified
    for (const [id, newRight] of newMap) {
      const prevRight = previousMap.get(id);
      if (!prevRight) {
        added.push(newRight);
      } else if (
        prevRight.title !== newRight.title ||
        prevRight.text !== newRight.text ||
        prevRight.theme !== newRight.theme
      ) {
        modified.push({ before: prevRight, after: newRight });
      }
    }

    // Find removed
    for (const [id, prevRight] of previousMap) {
      if (!newMap.has(id)) {
        removed.push(prevRight);
      }
    }

    return { added, removed, modified };
  }
}
