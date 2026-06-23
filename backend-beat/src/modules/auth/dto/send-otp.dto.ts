import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user.enums';

export class SendOtpDto {
  @ApiProperty({ example: '+91', description: 'Country code' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  phoneNumber: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Type of account',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  accountType: UserRole;
}
