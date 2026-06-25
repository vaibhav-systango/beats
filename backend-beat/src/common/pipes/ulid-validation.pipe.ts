import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isValid } from 'ulid';

@Injectable()
export class UlidValidationPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!isValid(value)) {
      throw new BadRequestException('Invalid ULID format');
    }

    return value;
  }
}