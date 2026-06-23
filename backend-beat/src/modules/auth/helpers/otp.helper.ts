import { AuthConstants, AuthMessages } from '../constants/auth.constants';
import { Otp } from '../../../database/entities/otp.entity';
import { Repository } from 'typeorm';
import { OtpPurpose } from '../../../common/enums/otp.enums';
import { UserRole } from '../../../common/enums/user.enums';

export type OtpDelivery = (payload: {
  otpCode: string;
  countryCode: string;
  phoneNumber: string;
  accountType: UserRole;
  purpose: OtpPurpose;
}) => Promise<void>;

export class OtpHelper {
  static generateOtpCode(): string {
    const min = Math.pow(10, AuthConstants.OTP_LENGTH - 1);
    const max = Math.pow(10, AuthConstants.OTP_LENGTH) - 1;
    const otp = Math.floor(min + Math.random() * (max - min + 1));
    return otp.toString();
  }

  static isSessionExpired(
    rec: Otp,
    expiryDuration: number,
    now = Date.now(),
  ): boolean {
    return now - rec.createdAt >= expiryDuration;
  }

  static isThrottled(
    rec: Otp,
    throttleDuration: number,
    now = Date.now(),
  ): boolean {
    return now - rec.updatedAt < throttleDuration;
  }

  static async issueOtpForPurpose(
    otpRepo: Repository<Otp>,
    countryCode: string,
    phoneNumber: string,
    accountType: UserRole,
    purpose: OtpPurpose,
    otpLimit: number,
    expiryDuration: number,
    throttleDuration: number,
    deliver: OtpDelivery,
  ): Promise<{ message: string; otp: string }> {
    const now = Date.now();

    const rec = await otpRepo.findOne({
      where: { countryCode, phoneNumber, accountType, purpose },
    });

    if (rec) {
      const expired = this.isSessionExpired(rec, expiryDuration, now);
      const throttled = this.isThrottled(rec, throttleDuration, now);

      if (!expired && rec.otpLimit == 0) {
        const createdAt = Number(rec.createdAt);
        const waitSec = Math.ceil((createdAt + expiryDuration - now) / 1000);

        throw new Error(
          `${AuthMessages.TOO_MANY_ATTEMPTS} Try again in ${waitSec} seconds.`,
        );
      }

      if (!expired && throttled) {
        const waitSec = Math.ceil(
          (throttleDuration - (now - rec.updatedAt)) / 1000,
        );
        throw new Error(
          `${AuthMessages.OTP_THROTTLED} Please wait ${waitSec} seconds before trying again.`,
        );
      }

      if (expired) {
        await otpRepo.delete({
          countryCode,
          phoneNumber,
          accountType,
          purpose,
        });
      } else {
        const newCode = this.generateOtpCode();
        rec.otpCode = newCode;
        rec.otpLimit = Math.max(0, rec.otpLimit - 1);
        rec.updatedAt = now;
        await otpRepo.save(rec);

        await deliver({
          otpCode: newCode,
          countryCode,
          phoneNumber,
          accountType,
          purpose,
        });
        return { message: AuthMessages.OTP_RESENT, otp: newCode };
      }
    }

    const otpCode = this.generateOtpCode();

    const newOtp = new Otp();
    newOtp.countryCode = countryCode;
    newOtp.phoneNumber = phoneNumber;
    newOtp.accountType = accountType;
    newOtp.purpose = purpose;
    newOtp.otpCode = otpCode;
    newOtp.otpLimit = otpLimit;
    newOtp.createdAt = now;
    newOtp.updatedAt = now;

    await otpRepo.save(newOtp);

    await deliver({ otpCode, countryCode, phoneNumber, accountType, purpose });
    return { message: AuthMessages.OTP_SENT, otp: otpCode };
  }
}
