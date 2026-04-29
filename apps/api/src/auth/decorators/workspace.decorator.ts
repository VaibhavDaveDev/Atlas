import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Workspace = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.workspaceId;
  },
);
