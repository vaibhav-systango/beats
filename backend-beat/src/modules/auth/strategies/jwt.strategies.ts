import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../../database/repositories/user.repository';
import { AuthMessages } from '../constants/auth.constants';

interface JwtPayload {
  sub: string;
  role: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || user.deletedAt) {
        throw new UnauthorizedException(AuthMessages.UNAUTHORIZED);
      }

      if (!user.isActive) {
        throw new UnauthorizedException(AuthMessages.INACTIVE_USER);
      }

      return {
        sub: user.id,
        role: payload.role,
        sessionId: payload.sessionId,
      };
    } catch (err) {
      console.error('JWT Strategy Validation Error:', err);
      throw err;
    }
  }
}
