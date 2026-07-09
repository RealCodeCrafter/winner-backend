import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Superadmin } from './entities/superadmin.entity';

@Injectable()
export class SuperadminSeeder implements OnModuleInit {
  private readonly logger = new Logger(SuperadminSeeder.name);

  constructor(
    @InjectRepository(Superadmin)
    private readonly superadminRepository: Repository<Superadmin>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const count = await this.superadminRepository.count();

    if (count > 0) {
      this.logger.log('Superadmin mavjud, seed o\'tkazib yuborildi');
      return;
    }

    const username = this.configService.get<string>('SUPERADMIN_USERNAME');
    const password = this.configService.get<string>('SUPERADMIN_PASSWORD');

    if (!username?.trim() || !password?.trim()) {
      this.logger.error(
        'Superadmin yaratilmadi: SUPERADMIN_USERNAME va SUPERADMIN_PASSWORD .env faylida belgilang',
      );
      return;
    }

    const hashed = await bcrypt.hash(password.trim(), 10);

    await this.superadminRepository.save({
      username: username.trim(),
      password: hashed,
    });

    this.logger.log('Superadmin yaratildi (.env dan)');
  }
}
