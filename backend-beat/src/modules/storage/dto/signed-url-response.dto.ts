import { ApiProperty } from '@nestjs/swagger';

export class SignedUrlResponseDto {
  @ApiProperty({ example: 'https://example.com/bucket/object?X-Amz-Signature=...' })
  url!: string;

  @ApiProperty({ example: 'events/cover/01HXYZ.jpg' })
  key!: string;

  @ApiProperty({ example: 3600 })
  expiresInSeconds!: number;
}
