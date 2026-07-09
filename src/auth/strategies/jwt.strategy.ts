import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Superadmin } from '../entities/superadmin.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Superadmin)
    private readonly superadminRepository: Repository<Superadmin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'winner-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<Superadmin> {
    const superadmin = await this.superadminRepository.findOne({
      where: { id: payload.sub },
    });

    if (!superadmin) {
      throw new UnauthorizedException('Token noto\'g\'ri');
    }

    return superadmin;
  }
}
