import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { AuthConstants, AuthMessages } from '../constants/auth.constants';
import { OtpHelper } from '../helpers/otp.helper';
import { UserRepository } from '../../../database/repositories/user.repository';
import { OtpRepository } from '../../../database/repositories/otp.repository';
import { OtpPurpose } from '../../../common/enums/otp.enums';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Role } from '../../../database/entities/role.entity';
import { User } from '../../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpRepository,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const { countryCode, phoneNumber, accountType } = dto;

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
        // Delivery logic will go here
        // For testing, we are returning the OTP in the response, so no need to log it unless needed
      },
    );
  }
  async verifyOtp(dto: VerifyOtpDto) {
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
      newUser.mobileNumber = phoneNumber;
      newUser.role = role;
      //remove this for future
      newUser.name = 'User';

      user = await this.userRepository.save(newUser);
    }

    const payload = { sub: user.id, role: user.role.name };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn:
        AuthConstants.ACCESS_TOKEN_EXPIRY as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn:
        AuthConstants.REFRESH_TOKEN_EXPIRY as JwtSignOptions['expiresIn'],
    });

    return {
      accessToken,
      refreshToken,
      isNewUser,
      flowType: isNewUser ? OtpPurpose.SIGNUP : OtpPurpose.LOGIN,
      account: {
        id: user.id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        role: user.role.name,
      },
    };
  }
}
