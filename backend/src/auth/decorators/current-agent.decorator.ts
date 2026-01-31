import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Agent } from '@prisma/client';

export const CurrentAgent = createParamDecorator(
  (data: keyof Agent | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const agent = request.agent;

    if (!agent) {
      return undefined;
    }

    return data ? agent[data] : agent;
  },
);
