import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  IsEnum,
} from 'class-validator';
import { LocationDto, EventAddressDto } from './create-event.dto';
import { AgeRestriction, SessionMode } from '../../../database/entities/event-session.entity';

export class MediaFileDto {
  @IsString()
  url: string;

  @IsString()
  mime_type: string;

  @IsNumber()
  size: number;

  @IsString()
  original_name: string;
}

export class GalleryMediaFileDto {
  @IsString()
  url: string;

  @IsString()
  mime_type: string;

  @IsNumber()
  size: number;

  @IsString()
  original_name: string;

  @IsNumber()
  sort_order: number;
}

export class VideoMediaFileDto {
  @IsString()
  url: string;

  @IsString()
  mime_type: string;

  @IsNumber()
  size: number;

  @IsString()
  thumbnail_url: string;

  @IsString()
  original_name: string;
}

export class DocumentMediaFileDto {
  @IsString()
  url: string;

  @IsString()
  mime_type: string;

  @IsNumber()
  size: number;

  @IsString()
  original_name: string;

  @IsString()
  doc_type: string;
}

export class EventSessionMediasDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => MediaFileDto)
  cover?: MediaFileDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GalleryMediaFileDto)
  gallery?: GalleryMediaFileDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GalleryMediaFileDto)
  venue_gallery?: GalleryMediaFileDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VideoMediaFileDto)
  videos?: VideoMediaFileDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocumentMediaFileDto)
  documents?: DocumentMediaFileDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocumentMediaFileDto)
  legal_documents?: DocumentMediaFileDto[];
}

export class CreateSessionTicketTypeDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  @IsOptional()
  maxPurchaseLimit?: number;

  @IsNumber()
  saleStartAt: number;

  @IsNumber()
  saleEndAt: number;
}

export class ArtistMetadataDto {
  @IsString()
  name: string;

  @IsString()
  socialMediaUrl: string;

  @IsString()
  category: string;
}

export class CreateEventSessionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  startAt: number;

  @IsNumber()
  endAt: number;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ValidateNested()
  @Type(() => EventAddressDto)
  eventAddress: EventAddressDto;

  @IsNumber()
  capacity: number;

  @IsEnum(AgeRestriction)
  @IsOptional()
  ageRestriction?: AgeRestriction;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EventSessionMediasDto)
  eventSessionMedias?: EventSessionMediasDto;

  @IsEnum(SessionMode)
  @IsOptional()
  mode?: SessionMode;

  @IsNumber()
  ticketSaleStartAt: number;

  @IsNumber()
  ticketSaleEndAt: number;

  @IsBoolean()
  @IsOptional()
  allowReferral?: boolean;

  @IsNumber()
  @IsOptional()
  referralRewardPerTicket?: number;

  @IsBoolean()
  @IsOptional()
  allowPromoters?: boolean;

  @IsNumber()
  @IsOptional()
  promoterCommissionPercentage?: number;

  @IsBoolean()
  @IsOptional()
  priority?: boolean;

  @IsNumber()
  @IsOptional()
  priorityExpiresAt?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ArtistMetadataDto)
  artistMetadata?: ArtistMetadataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSessionTicketTypeDto)
  ticketTypes: CreateSessionTicketTypeDto[];
}
