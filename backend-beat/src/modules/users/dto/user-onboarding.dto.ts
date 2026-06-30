import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsNumber,
  Max,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ example: 72.877, description: 'Longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 19.076, description: 'Latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;
}

export class UserOnboardingDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'rahul@gmail.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'https://cdn.beat.com/profile.jpg', required: false })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiProperty({ type: LocationDto, required: false })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiProperty({ example: ['01JZUSR123XYZ456ABC789DEF'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2, {
    message: 'You must select at least 2 categories',
  })
  categoryIds: string[];
}
