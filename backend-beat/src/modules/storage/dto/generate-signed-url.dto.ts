import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateSignedUrlDto {
  @ApiProperty({
    description: 'Object key in the configured storage bucket',
    example: 'events/cover/01HXYZ.jpg',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiPropertyOptional({
    description: 'Signed URL expiry in seconds (default from STORAGE_SIGNED_URL_EXPIRY_SECONDS)',
    example: 3600,
    minimum: 1,
    maximum: 604800,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(604800)
  expiresInSeconds?: number;
}
