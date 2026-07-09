import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Superadmin } from '../entities/superadmin.entity';

export const CurrentSuperadmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Superadmin => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
