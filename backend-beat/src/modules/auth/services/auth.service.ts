import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { AuthConstants, AuthMessages } from '../constants/auth.constants';
import { OtpHelper } from '../helpers/otp.helper';
import { UserRepository } from '../../../database/repositories/user.repository';
import { OtpRepository } from '../../../database/repositories/otp.repository';
import { UserSessionRepository } from '../../../database/repositories/user-session.repository';
import { UserSession } from '../../../database/entities/user-session.entity';
import * as bcrypt from 'bcrypt';
import { ulid } from 'ulid';
import { DeliveryMethod, OtpPurpose } from '../../../common/enums/otp.enums';
import { TwilioOtpProvider } from '../../../providers/twilio-otp.provider';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Role } from '../../../database/entities/role.entity';
import { User } from '../../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly jwtService: JwtService,
    private readonly twilioOtpProvider: TwilioOtpProvider,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const { countryCode, phoneNumber, accountType, deliveryMethod } = dto;

    const user = await this.userRepository.findByPhoneAndRole(
      phoneNumber,
      accountType,
    );
    const purpose = user ? OtpPurpose.LOGIN : OtpPurpose.SIGNUP;

    return await OtpHelper.issueOtpForPurpose(
      this.otpRepository,
      countryCode,
      phoneNumber,
      accountType,
      purpose,
      AuthConstants.MAX_OTP_ATTEMPTS,
      AuthConstants.OTP_BLOCK_DURATION_MS,
      AuthConstants.OTP_THROTTLE_DURATION_MS,
      async (payload) => {
        const fullPhoneNumber = `${payload.countryCode}${payload.phoneNumber}`;
        if (deliveryMethod === DeliveryMethod.SMS) {
          await this.twilioOtpProvider.sendSmsOtp(
            fullPhoneNumber,
            payload.otpCode,
          );
        } else if (deliveryMethod === DeliveryMethod.VOICE) {
          await this.twilioOtpProvider.sendVoiceOtp(
            fullPhoneNumber,
            payload.otpCode,
          );
        } else {
          throw new InternalServerErrorException(
            AuthMessages.UNSUPPORTED_DELIVERY_METHOD,
          );
        }
      },
    );
  }
  async verifyOtp(dto: VerifyOtpDto, reqMetadata?: Record<string, any>) {
    const { countryCode, phoneNumber, accountType, otpCode } = dto;

    let user = await this.userRepository.findByPhoneAndRole(
      phoneNumber,
      accountType,
    );
    const purpose = user ? OtpPurpose.LOGIN : OtpPurpose.SIGNUP;
    const isNewUser = !user;

    await OtpHelper.verifyOtpForPurpose(
      this.otpRepository,
      countryCode,
      phoneNumber,
      accountType,
      purpose,
      otpCode,
      AuthConstants.OTP_VALIDITY_DURATION_MS,
      AuthConstants.MAX_OTP_GUESSES,
    );

    if (!user) {
      const role = await this.userRepository.manager.findOne(Role, {
        where: { name: accountType },
      });

      if (!role) {
        throw new InternalServerErrorException(AuthMessages.ROLE_NOT_FOUND);
      }

      const newUser = new User();
      newUser.phoneNumber = phoneNumber;
      newUser.countryCode = countryCode;
      newUser.role = role;

      user = await this.userRepository.save(newUser);
    }

    const sessionId = ulid();
    const refreshJti = ulid();

    const accessPayload = {
      sub: user.id,
      role: user.role.name,
      onboardingStatus: user.onboardingStatus,
      sessionId,
    };
    const refreshPayload = { ...accessPayload, jti: refreshJti };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn:
        AuthConstants.ACCESS_TOKEN_EXPIRY as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn:
        AuthConstants.REFRESH_TOKEN_EXPIRY as JwtSignOptions['expiresIn'],
    });

    const refreshTokenHash = await bcrypt.hash(refreshJti, 10);

    const deviceMetadata = reqMetadata || {};

    const session = new UserSession();
    session.id = sessionId;
    session.user = user;
    session.refreshTokenHash = refreshTokenHash;
    session.deviceMetadata = deviceMetadata;
    session.lastActiveAt = Date.now();
    session.isActive = true;
    await this.userSessionRepository.save(session);

    return {
      accessToken,
      refreshToken,
      isNewUser,
      flowType: isNewUser ? OtpPurpose.SIGNUP : OtpPurpose.LOGIN,
      account: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role.name,
        onboardingStatus: user.onboardingStatus,
      },
    };
  }

  async refreshToken(oldRefreshToken: string) {
    let payload: {
      sessionId: string;
      sub: string;
      role: string;
      onboardingStatus: string;
      jti: string;
    };
    try {
      payload = await this.jwtService.verifyAsync(oldRefreshToken);
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'TokenExpiredError') {
        const decoded = this.jwtService.decode(oldRefreshToken) as {
          sessionId?: string;
        } | null;
        if (decoded && decoded.sessionId) {
          await this.userSessionRepository.update(
            { id: decoded.sessionId },
            { isActive: false },
          );
        }
      }
      throw new Error(AuthMessages.INVALID_TOKEN);
    }

    const sessionId = payload.sessionId;
    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId, isActive: true },
      relations: { user: { role: true } },
    });

    if (!session) {
      throw new Error(AuthMessages.SESSION_NOT_FOUND);
    }

    // Compare the jti from the incoming token against the stored hash.
    // The full JWT cannot be used with bcrypt (72-byte truncation makes
    // all tokens for the same user hash-equal).
    const isMatch = await bcrypt.compare(payload.jti, session.refreshTokenHash);
    if (!isMatch) {
      throw new Error(AuthMessages.INVALID_TOKEN);
    }

    const user = session.user;

    const newRefreshJti = ulid();
    const newAccessPayload = {
      sub: user.id,
      role: user.role.name,
      onboardingStatus: user.onboardingStatus,
      sessionId,
    };
    const newRefreshPayload = { ...newAccessPayload, jti: newRefreshJti };

    const newAccessToken = await this.jwtService.signAsync(newAccessPayload, {
      expiresIn:
        AuthConstants.ACCESS_TOKEN_EXPIRY as JwtSignOptions['expiresIn'],
    });
    const newRefreshToken = await this.jwtService.signAsync(newRefreshPayload, {
      expiresIn:
        AuthConstants.REFRESH_TOKEN_EXPIRY as JwtSignOptions['expiresIn'],
    });

    const newRefreshTokenHash = await bcrypt.hash(newRefreshJti, 10);

    // Atomically clear the old hash — prevents race condition where two
    // parallel requests both pass bcrypt.compare and both get new tokens.
    const updateResult = await this.userSessionRepository
      .createQueryBuilder()
      .update()
      .set({
        refreshTokenHash: newRefreshTokenHash,
        lastActiveAt: Date.now(),
      })
      .where('id = :id', { id: sessionId })
      .andWhere('refreshTokenHash = :oldHash', {
        oldHash: session.refreshTokenHash,
      })
      .execute();

    if (updateResult.affected === 0) {
      throw new Error(AuthMessages.INVALID_TOKEN);
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
