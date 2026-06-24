import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user.enums';
import { DeliveryMethod } from '../../../common/enums/otp.enums';
import { IsValidPhoneNumber } from '../decorators/is-valid-phone-number.decorator';

export class SendOtpDto {
  @ApiProperty({ example: '+91', description: 'Country code' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  @IsValidPhoneNumber()
  phoneNumber: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Type of account',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  accountType: UserRole;

  @ApiProperty({
    enum: DeliveryMethod,
    example: DeliveryMethod.SMS,
    description: 'Method to deliver the OTP',
  })
  @IsEnum(DeliveryMethod)
  @IsNotEmpty()
  deliveryMethod: DeliveryMethod;
}
