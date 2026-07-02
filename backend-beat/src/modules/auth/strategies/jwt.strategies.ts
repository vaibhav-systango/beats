import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../../database/repositories/user.repository';
import { UserSessionRepository } from '../../../database/repositories/user-session.repository';
import { AuthMessages } from '../constants/auth.constants';

interface JwtPayload {
  sub: string;
  role: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const [user, session] = await Promise.all([
        this.userRepository.findOne({ where: { id: payload.sub } }),
        this.userSessionRepository.findOne({
          where: { id: payload.sessionId, isActive: true },
        }),
      ]);

      if (!user || user.deletedAt) {
        throw new UnauthorizedException(AuthMessages.UNAUTHORIZED);
      }

      if (!user.isActive) {
        throw new UnauthorizedException(AuthMessages.INACTIVE_USER);
      }

      // Session must still be active (catches logouts on other devices)
      if (!session) {
        throw new UnauthorizedException(AuthMessages.SESSION_INACTIVE);
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
