import {
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class LocationDto {
  @IsNumber()
  longitude: number;

  @IsNumber()
  latitude: number;
}

export class EventAddressDto {
  @IsString()
  formattedAddress: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsString()
  postalCode: string;
}

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  description: string;




}
