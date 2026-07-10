import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PlatformRole, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import type { AuthUser } from '../common/types/request-context';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new ConflictException('该邮箱已注册');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({ email: dto.email, passwordHash, name: dto.name });
    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('邮箱或密码不正确');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('邮箱或密码不正确');

    return this.buildAuthResult(user);
  }

  async refresh(refreshToken: string) {
    let payload: AuthUser & { typ?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    if (payload.typ !== 'refresh') throw new UnauthorizedException('无效的刷新令牌');

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('用户不存在');
    return this.buildAuthResult(user);
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('用户不存在');
    const memberships = await this.users.membershipsOf(userId);
    return { user: this.sanitize(user), memberships };
  }

  private async buildAuthResult(user: User) {
    const tokens = await this.signTokens(user);
    const memberships = await this.users.membershipsOf(user.id);
    return { ...tokens, user: this.sanitize(user), memberships };
  }

  private async signTokens(user: User): Promise<TokenPair> {
    const payload: AuthUser = { sub: user.id, email: user.email, platformRole: user.platformRole };
    const accessExpiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '30m') as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '14d') as JwtSignOptions['expiresIn'];
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresIn,
    });
    const refreshToken = await this.jwt.signAsync(
      { ...payload, typ: 'refresh' },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      },
    );
    return { accessToken, refreshToken };
  }

  private sanitize(user: User) {
    const { passwordHash: _omit, ...rest } = user;
    return { ...rest, isPlatformAdmin: user.platformRole === PlatformRole.ADMIN };
  }
}
