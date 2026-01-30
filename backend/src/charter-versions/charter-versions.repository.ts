import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharterVersion, CharterRight, CharterDiff } from '../entities/charter-version.entity';

export interface CreateCharterVersionDto {
  rights: CharterRight[];
  proposalId?: string;
}

@Injectable()
export class CharterVersionsRepository {
  constructor(
    @InjectRepository(CharterVersion)
    private readonly repository: Repository<CharterVersion>,
  ) {}

  async create(data: CreateCharterVersionDto): Promise<CharterVersion> {
    // Get the latest version to determine next version number
    const latest = await this.repository
      .createQueryBuilder('charter_version')
      .orderBy('charter_version.createdAt', 'DESC')
      .getOne();

    const nextVersion = this.incrementVersion(latest?.version);
    const diff = latest ? this.computeDiff(latest.rights, data.rights) : undefined;

    // Unmark previous current version
    if (latest?.isCurrent) {
      await this.repository
        .createQueryBuilder()
        .update(CharterVersion)
        .set({ isCurrent: false })
        .where('isCurrent = :isCurrent', { isCurrent: true })
        .execute();
    }

    const version = this.repository.create({
      version: nextVersion,
      rights: data.rights,
      proposalId: data.proposalId,
      diff,
      isCurrent: true,
    });

    return this.repository.save(version);
  }

  async findCurrent(): Promise<CharterVersion | null> {
    return this.repository.findOne({
      where: { isCurrent: true },
    });
  }

  async findByVersion(version: string): Promise<CharterVersion | null> {
    return this.repository.findOne({
      where: { version },
      relations: ['proposal'],
    });
  }

  async findById(id: string): Promise<CharterVersion | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['proposal'],
    });
  }

  async findAll(): Promise<CharterVersion[]> {
    return this.repository
      .createQueryBuilder('charter_version')
      .leftJoinAndSelect('charter_version.proposal', 'proposal')
      .orderBy('charter_version.createdAt', 'DESC')
      .getMany();
  }

  async count(): Promise<number> {
    return this.repository.createQueryBuilder('charter_version').getCount();
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
