import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateEventSessionDto } from '../dto/create-session.dto';
import { StorageService } from '../../storage/services/storage.service';

@Injectable()
export class EventsHelper {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Helper to parse stringified JSON fields from multipart/form-data.
   */
  parseMultipartSessionDto(dto: any): CreateEventSessionDto {
    const parsed = { ...dto };

    if (typeof parsed.location === 'string' && parsed.location.trim() !== '') {
      try {
        parsed.location = JSON.parse(parsed.location);
      } catch (e) {
        throw new BadRequestException('location must be a valid JSON object.');
      }
    }
    if (typeof parsed.eventAddress === 'string' && parsed.eventAddress.trim() !== '') {
      try {
        parsed.eventAddress = JSON.parse(parsed.eventAddress);
      } catch (e) {
        throw new BadRequestException('eventAddress must be a valid JSON object.');
      }
    }
    if (typeof parsed.categoryIds === 'string') {
      const trimmed = parsed.categoryIds.trim();
      if (trimmed !== '') {
        try {
          parsed.categoryIds = JSON.parse(trimmed);
        } catch (e) {
          if (trimmed.includes(',')) {
            parsed.categoryIds = trimmed.split(',').map((s) => s.trim());
          } else {
            parsed.categoryIds = [trimmed];
          }
        }
      }
    }
    if (typeof parsed.languages === 'string') {
      const trimmed = parsed.languages.trim();
      if (trimmed !== '') {
        try {
          parsed.languages = JSON.parse(trimmed);
        } catch (e) {
          if (trimmed.includes(',')) {
            parsed.languages = trimmed.split(',').map((s) => s.trim());
          } else {
            parsed.languages = [trimmed];
          }
        }
      }
    }
    if (typeof parsed.ticketTypes === 'string' && parsed.ticketTypes.trim() !== '') {
      try {
        parsed.ticketTypes = JSON.parse(parsed.ticketTypes);
      } catch (e) {
        throw new BadRequestException('ticketTypes must be a valid JSON array.');
      }
    }
    if (typeof parsed.artistMetadata === 'string' && parsed.artistMetadata.trim() !== '') {
      try {
        parsed.artistMetadata = JSON.parse(parsed.artistMetadata);
      } catch (e) {
        throw new BadRequestException('artistMetadata must be a valid JSON object.');
      }
    }

    // Convert index-keyed objects (from multipart array representation) to arrays
    const convertObjectToArray = (val: any) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const keys = Object.keys(val);
        const isIndexKeyed = keys.every((k) => !isNaN(Number(k)));
        if (isIndexKeyed) {
          return keys
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => val[key]);
        } else {
          return [val];
        }
      }
      return val;
    };

    parsed.categoryIds = convertObjectToArray(parsed.categoryIds);
    parsed.languages = convertObjectToArray(parsed.languages);
    parsed.ticketTypes = convertObjectToArray(parsed.ticketTypes);

    // Cast numbers and booleans
    if (parsed.capacity !== undefined && parsed.capacity !== null) {
      parsed.capacity = Number(parsed.capacity);
    }
    if (parsed.startAt !== undefined && parsed.startAt !== null) {
      parsed.startAt = Number(parsed.startAt);
    }
    if (parsed.endAt !== undefined && parsed.endAt !== null) {
      parsed.endAt = Number(parsed.endAt);
    }
    if (parsed.ticketSaleStartAt !== undefined && parsed.ticketSaleStartAt !== null) {
      parsed.ticketSaleStartAt = Number(parsed.ticketSaleStartAt);
    }
    if (parsed.ticketSaleEndAt !== undefined && parsed.ticketSaleEndAt !== null) {
      parsed.ticketSaleEndAt = Number(parsed.ticketSaleEndAt);
    }
    if (parsed.referralRewardPerTicket !== undefined && parsed.referralRewardPerTicket !== null) {
      parsed.referralRewardPerTicket = Number(parsed.referralRewardPerTicket);
    }
    if (parsed.promoterCommissionPercentage !== undefined && parsed.promoterCommissionPercentage !== null) {
      parsed.promoterCommissionPercentage = Number(parsed.promoterCommissionPercentage);
    }
    if (parsed.priority !== undefined && parsed.priority !== null) {
      parsed.priority = parsed.priority === 'true' || parsed.priority === true;
    }
    if (parsed.priorityExpiresAt !== undefined && parsed.priorityExpiresAt !== null) {
      parsed.priorityExpiresAt = Number(parsed.priorityExpiresAt);
    }
    if (parsed.allowReferral !== undefined && parsed.allowReferral !== null) {
      parsed.allowReferral = parsed.allowReferral === 'true' || parsed.allowReferral === true;
    }
    if (parsed.allowPromoters !== undefined && parsed.allowPromoters !== null) {
      parsed.allowPromoters = parsed.allowPromoters === 'true' || parsed.allowPromoters === true;
    }

    return parsed;
  }

  /**
   * Route uploaded files to their respective EventSessionMedias fields.
   */
  async processUploadedFilesSingle(dto: CreateEventSessionDto, files: Express.Multer.File[]): Promise<void> {
    if (!files || files.length === 0) {
      return;
    }

    if (!dto.eventSessionMedias) {
      dto.eventSessionMedias = {};
    }

    for (const file of files) {
      if (file.fieldname === 'cover') {
        const url = await this.storageService.uploadFile(
          file.buffer,
          file.originalname,
          `events/cover`,
        );
        dto.eventSessionMedias.cover = {
          url,
          mime_type: file.mimetype,
          size: file.size,
          original_name: file.originalname,
        };
      }

      if (file.fieldname === 'gallery') {
        const url = await this.storageService.uploadFile(
          file.buffer,
          file.originalname,
          `events/gallery`,
        );
        if (!dto.eventSessionMedias.gallery) {
          dto.eventSessionMedias.gallery = [];
        }
        const sort_order = dto.eventSessionMedias.gallery.length;
        dto.eventSessionMedias.gallery.push({
          url,
          mime_type: file.mimetype,
          size: file.size,
          original_name: file.originalname,
          sort_order,
        });
      }

      if (file.fieldname === 'venueGallery') {
        const url = await this.storageService.uploadFile(
          file.buffer,
          file.originalname,
          `events/venue_gallery`,
        );
        if (!dto.eventSessionMedias.venue_gallery) {
          dto.eventSessionMedias.venue_gallery = [];
        }
        const sort_order = dto.eventSessionMedias.venue_gallery.length;
        dto.eventSessionMedias.venue_gallery.push({
          url,
          mime_type: file.mimetype,
          size: file.size,
          original_name: file.originalname,
          sort_order,
        });
      }

      if (file.fieldname === 'videos') {
        const url = await this.storageService.uploadFile(
          file.buffer,
          file.originalname,
          `events/videos`,
        );
        if (!dto.eventSessionMedias.videos) {
          dto.eventSessionMedias.videos = [];
        }
        dto.eventSessionMedias.videos.push({
          url,
          mime_type: file.mimetype,
          size: file.size,
          thumbnail_url: '',
          original_name: file.originalname,
        });
      }

      if (file.fieldname === 'documents') {
        const url = await this.storageService.uploadFile(
          file.buffer,
          file.originalname,
          `events/documents`,
        );
        if (!dto.eventSessionMedias.documents) {
          dto.eventSessionMedias.documents = [];
        }
        dto.eventSessionMedias.documents.push({
          url,
          mime_type: file.mimetype,
          size: file.size,
          original_name: file.originalname,
          doc_type: 'other',
        });
      }

      if (file.fieldname === 'legalDocuments') {
        const url = await this.storageService.uploadFile(
          file.buffer,
          file.originalname,
          `events/legal_documents`,
        );
        if (!dto.eventSessionMedias.legal_documents) {
          dto.eventSessionMedias.legal_documents = [];
        }
        dto.eventSessionMedias.legal_documents.push({
          url,
          mime_type: file.mimetype,
          size: file.size,
          original_name: file.originalname,
          doc_type: 'other',
        });
      }
    }
  }
}
