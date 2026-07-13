import { BadRequestException } from '@nestjs/common';
import { StorageMessages } from '../constants/storage.constants';

const MAX_OBJECT_KEY_LENGTH = 1024;

const EVENTS_MEDIA_KEY_PATTERN =
  /^events\/(cover|gallery|venue_gallery|videos|documents|legal_documents)\/[^/]+$/;

const EVENTS_MEDIA_PATH_SEGMENT = 'events/';

export function isStorageObjectKey(reference: string): boolean {
  const normalized = reference?.trim().replace(/^\/+/, '') ?? '';
  return EVENTS_MEDIA_KEY_PATTERN.test(normalized);
}

export function isLegacyStorageUrl(reference: string): boolean {
  if (
    !reference?.startsWith('http://') &&
    !reference?.startsWith('https://')
  ) {
    return false;
  }

  try {
    return new URL(reference).pathname.includes(`/${EVENTS_MEDIA_PATH_SEGMENT}`);
  } catch {
    return false;
  }
}

/**
 * Converts a stored media reference to a provider-independent object key.
 * External media URLs (e.g. YouTube) are returned unchanged.
 */
export function toStorageObjectKey(
  reference: string,
  options?: { publicUrlBase?: string },
): string {
  const trimmed = reference?.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://')
  ) {
    return trimmed.replace(/^\/+/, '');
  }

  if (!isLegacyStorageUrl(trimmed)) {
    return trimmed;
  }

  if (options?.publicUrlBase) {
    try {
      return extractKeyFromUrl(trimmed, options.publicUrlBase);
    } catch {
      // Fall through to provider-agnostic pathname extraction.
    }
  }

  const pathname = new URL(trimmed).pathname;
  const marker = `/${EVENTS_MEDIA_PATH_SEGMENT}`;
  const markerIndex = pathname.indexOf(marker);

  if (markerIndex >= 0) {
    return pathname.slice(markerIndex + 1);
  }

  throw new Error('Unable to resolve storage object key from reference');
}

export function normalizeObjectKey(key: string): string {
  const trimmed = key?.trim();

  if (!trimmed) {
    throw new BadRequestException({ message: StorageMessages.INVALID_OBJECT_KEY });
  }

  if (trimmed.length > MAX_OBJECT_KEY_LENGTH) {
    throw new BadRequestException({ message: StorageMessages.INVALID_OBJECT_KEY });
  }

  if (trimmed.includes('..') || trimmed.includes('\\')) {
    throw new BadRequestException({ message: StorageMessages.INVALID_OBJECT_KEY });
  }

  const normalized = trimmed.replace(/^\/+/, '');

  if (!EVENTS_MEDIA_KEY_PATTERN.test(normalized)) {
    throw new BadRequestException({ message: StorageMessages.INVALID_OBJECT_KEY });
  }

  return normalized;
}

export function resolveObjectKey(
  fileUrlOrKey: string,
  options?: { publicUrlBase?: string },
): string {
  if (!fileUrlOrKey?.trim()) {
    throw new Error('Object key or URL is required');
  }

  if (isLegacyStorageUrl(fileUrlOrKey)) {
    return toStorageObjectKey(fileUrlOrKey, options);
  }

  if (
    fileUrlOrKey.startsWith('http://') ||
    fileUrlOrKey.startsWith('https://')
  ) {
    throw new Error('File URL does not belong to the configured storage bucket');
  }

  return fileUrlOrKey.replace(/^\/+/, '');
}

export function extractKeyFromUrl(fileUrl: string, baseUrl: string): string {
  const base = new URL(`${baseUrl.replace(/\/$/, '')}/`);
  const url = new URL(fileUrl);

  if (
    url.origin !== base.origin ||
    !url.pathname.startsWith(base.pathname)
  ) {
    throw new Error('File URL does not belong to the configured storage bucket');
  }

  return url.pathname.slice(base.pathname.length);
}

export function mediaReferenceMatchesKey(
  storedReference: string,
  objectKey: string,
): boolean {
  const normalizedKey = objectKey.replace(/^\/+/, '');
  const stored = storedReference?.trim();

  if (!stored || !normalizedKey) {
    return false;
  }

  let storedKey = stored;
  if (isLegacyStorageUrl(stored)) {
    try {
      storedKey = toStorageObjectKey(stored);
    } catch {
      return false;
    }
  } else if (stored.startsWith('http://') || stored.startsWith('https://')) {
    return false;
  }

  return storedKey.replace(/^\/+/, '') === normalizedKey;
}
