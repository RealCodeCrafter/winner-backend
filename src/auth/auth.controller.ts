import { Body, Controller, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateSuperadminDto } from './dto/update-superadmin.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentSuperadmin } from './decorators/current-superadmin.decorator';
import { Superadmin } from './entities/superadmin.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Patch('update')
  update(
    @CurrentSuperadmin() superadmin: Superadmin,
    @Body() dto: UpdateSuperadminDto,
  ) {
    return this.authService.update(superadmin, dto);
  }
}
