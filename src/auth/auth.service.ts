import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Superadmin } from './entities/superadmin.entity';
import { LoginDto } from './dto/login.dto';
import { UpdateSuperadminDto } from './dto/update-superadmin.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Superadmin)
    private readonly superadminRepository: Repository<Superadmin>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const superadmin = await this.superadminRepository.findOne({
      where: { username: dto.username },
    });

    if (!superadmin) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    const isValid = await bcrypt.compare(dto.password, superadmin.password);

    if (!isValid) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    return {
      accessToken: this.jwtService.sign({
        sub: superadmin.id,
        username: superadmin.username,
      }),
    };
  }

  async update(superadmin: Superadmin, dto: UpdateSuperadminDto) {
    const isValid = await bcrypt.compare(
      dto.currentPassword,
      superadmin.password,
    );

    if (!isValid) {
      throw new BadRequestException('Joriy parol noto\'g\'ri');
    }

    const updateData: Partial<Superadmin> = {};

    if (dto.username && dto.username !== superadmin.username) {
      const exists = await this.superadminRepository.findOne({
        where: { username: dto.username },
      });

      if (exists) {
        throw new BadRequestException('Bu username band');
      }

      updateData.username = dto.username;
    }

    if (dto.newPassword) {
      updateData.password = await bcrypt.hash(dto.newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('O\'zgartirish uchun ma\'lumot kiriting');
    }

    await this.superadminRepository.update(superadmin.id, updateData);

    const updated = await this.superadminRepository.findOne({
      where: { id: superadmin.id },
    });

    return {
      message: 'Superadmin yangilandi',
      username: updated?.username,
    };
  }
}
