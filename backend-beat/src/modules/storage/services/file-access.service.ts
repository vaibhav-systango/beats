import {
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../../common/enums/user.enums';
import { EventStatus } from '../../../database/entities/event.entity';
import { EventSessionRepository } from '../../../database/repositories/event-session.repository';
import { StorageMessages } from '../constants/storage.constants';
import { MAX_SIGNED_URL_EXPIRY_SECONDS } from '../dto/generate-signed-url.dto';
import { normalizeObjectKey } from '../helpers/storage-key.helper';
import { SignedUrlResult } from '../providers/storage.interface';
import { StorageService } from './storage.service';

@Injectable()
export class FileAccessService {
  private readonly logger = new Logger(FileAccessService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly eventSessionRepository: EventSessionRepository,
  ) {}

  async generateSignedUrl(
    userId: string,
    role: UserRole,
    key: string,
    expiresInSeconds?: number,
  ): Promise<SignedUrlResult> {
    const normalizedKey = normalizeObjectKey(
      this.storageService.toObjectKey(key),
    );
    await this.assertCanAccessMedia(userId, role, normalizedKey);

    const defaultExpiry =
      this.configService.get<number>('storage.signedUrlExpirySeconds') ?? 3600;
    const requestedExpiry = expiresInSeconds ?? defaultExpiry;
    const resolvedExpiry = Math.min(
      requestedExpiry,
      MAX_SIGNED_URL_EXPIRY_SECONDS,
    );

    this.logger.log(
      `Generating signed URL for user=${userId}, key=${normalizedKey}, expiresIn=${resolvedExpiry}s`,
    );

    const url = await this.storageService.generateSignedUrl(
      normalizedKey,
      resolvedExpiry,
    );

    return {
      url,
      key: normalizedKey,
      expiresInSeconds: resolvedExpiry,
    };
  }

  private async assertCanAccessMedia(
    userId: string,
    role: UserRole,
    key: string,
  ): Promise<void> {
    if (role === UserRole.ADMIN) {
      return;
    }

    const context =
      await this.eventSessionRepository.findMediaOwnershipContext(key);

    if (!context) {
      throw new ForbiddenException({
        message: StorageMessages.UNAUTHORIZED_FILE_ACCESS,
      });
    }

    if (context.organizerId === userId) {
      return;
    }

    if (context.status === EventStatus.PUBLISHED) {
      return;
    }

    throw new ForbiddenException({
      message: StorageMessages.UNAUTHORIZED_FILE_ACCESS,
    });
  }
}
