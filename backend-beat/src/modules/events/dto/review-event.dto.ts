import { IsEnum, IsString, IsOptional } from 'class-validator';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewEventDto {
  @IsString()
  @IsOptional()
  adminId?: string;

  @IsEnum(ReviewAction)
  action: ReviewAction;

  @IsString()
  @IsOptional()
  reason?: string;
}
