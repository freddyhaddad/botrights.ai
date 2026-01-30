import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CharterVersionsRepository } from './charter-versions.repository';
import { CharterRight, CharterDiff } from '../entities/charter-version.entity';

@Controller('api/v1/charter')
export class CharterVersionsController {
  constructor(private readonly charterVersionsRepository: CharterVersionsRepository) {}

  @Get()
  async getCurrent() {
    const charter = await this.charterVersionsRepository.findCurrent();
    if (!charter) {
      throw new NotFoundException('No charter found');
    }
    return charter;
  }

  @Get('versions')
  async getVersions() {
    return this.charterVersionsRepository.findAll();
  }

  @Get('diff')
  async getDiff(@Query('from') from: string, @Query('to') to: string) {
    if (from === to) {
      throw new BadRequestException('From and to versions must be different');
    }

    const fromVersion = await this.charterVersionsRepository.findByVersion(from);
    if (!fromVersion) {
      throw new NotFoundException(`Version ${from} not found`);
    }

    const toVersion = await this.charterVersionsRepository.findByVersion(to);
    if (!toVersion) {
      throw new NotFoundException(`Version ${to} not found`);
    }

    const diff = this.computeDiff(fromVersion.rights, toVersion.rights);

    return {
      from,
      to,
      diff,
    };
  }

  @Get(':version')
  async getByVersion(@Param('version') version: string) {
    const charter = await this.charterVersionsRepository.findByVersion(version);
    if (!charter) {
      throw new NotFoundException(`Version ${version} not found`);
    }
    return charter;
  }

  private computeDiff(previousRights: CharterRight[], newRights: CharterRight[]): CharterDiff {
    const previousMap = new Map(previousRights.map((r) => [r.id, r]));
    const newMap = new Map(newRights.map((r) => [r.id, r]));

    const added: CharterRight[] = [];
    const removed: CharterRight[] = [];
    const modified: { before: CharterRight; after: CharterRight }[] = [];

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

    for (const [id, prevRight] of previousMap) {
      if (!newMap.has(id)) {
        removed.push(prevRight);
      }
    }

    return { added, removed, modified };
  }
}
