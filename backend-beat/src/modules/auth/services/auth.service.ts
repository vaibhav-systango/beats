import { Injectable } from '@nestjs/common';
import { SendOtpDto } from '../dto/send-otp.dto';
import { AuthConstants } from '../constants/auth.constants';
import { OtpHelper } from '../helpers/otp.helper';
import { UserRepository } from '../../../database/repositories/user.repository';
import { OtpRepository } from '../../../database/repositories/otp.repository';
import { OtpPurpose } from '../../../common/enums/otp.enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpRepository,
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
      AuthConstants.OTP_EXPIRY_DURATION_MS,
      AuthConstants.OTP_THROTTLE_DURATION_MS,
      async (payload) => {
        // Delivery logic will go here
        // For testing, we are returning the OTP in the response, so no need to log it unless needed
      },
    );
  }
}
