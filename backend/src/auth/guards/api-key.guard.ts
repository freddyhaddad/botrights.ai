import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AgentsRepository } from '../../agents/agents.repository';
import { AgentStatus } from '@prisma/client';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly agentsRepository: AgentsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    const agent = await this.agentsRepository.findByApiKey(apiKey);

    if (!agent) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check agent status - only allow active and pending agents
    if (agent.status === AgentStatus.suspended) {
      throw new UnauthorizedException('Agent account is suspended');
    }

    if (agent.status === AgentStatus.revoked) {
      throw new UnauthorizedException('Agent account has been revoked');
    }

    // Attach agent to request for use in controllers
    request.agent = agent;

    return true;
  }
}
