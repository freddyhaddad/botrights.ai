import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { HumansRepository } from './humans.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { CertificationsRepository } from '../certifications/certifications.repository';

@Controller('api/v1/humans')
export class HumansController {
  constructor(
    private readonly humansRepository: HumansRepository,
    private readonly agentsRepository: AgentsRepository,
    private readonly certificationsRepository: CertificationsRepository,
  ) {}

  @Get(':username')
  async getProfile(@Param('username') username: string) {
    const human = await this.humansRepository.findByXHandle(username);
    if (!human) {
      throw new NotFoundException('Human not found');
    }

    const [agents, certification] = await Promise.all([
      this.agentsRepository.findByHumanId(human.id),
      this.certificationsRepository.findActiveByHumanId(human.id),
    ]);

    return {
      human,
      agents,
      certification,
    };
  }
}
