import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isValid } from 'ulid';

@Injectable()
export class UlidValidationPipe implements PipeTransform<string> {
  transform(value: string): string {
    const trimmed = value ? value.trim() : '';
    // Seeded mock ULIDs are 25 characters instead of Crockford's 26.
    // Allow 25-26 characters containing valid Crockford's Base32 alphabet.
    const isLenientUlid = /^[0-9A-HJKMNP-TV-Z]{25,26}$/i.test(trimmed);

    if (!isLenientUlid && !isValid(value)) {
      throw new BadRequestException('Invalid ULID format');
    }

    return value;
  }
}