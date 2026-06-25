import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

export interface MulterFileInfo {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface FileUploadConfig {
  fieldName?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

const DEFAULT_MAX_FILE_SIZE =
  Number(process.env.STORAGE_MAX_FILE_SIZE_MB || 20) * 1024 * 1024;

const createFileFilter =
  (allowedMimeTypes: string[], allowedExtensions: string[]) =>
  (
    _req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (allowedExtensions.length > 0) {
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return callback(
          new BadRequestException(
            `Only ${allowedExtensions.join(', ')} files are allowed`,
          ),
          false,
        );
      }
    }

    if (
      allowedMimeTypes.length > 0 &&
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      return callback(
        new BadRequestException(
          `Only ${allowedMimeTypes.join(', ')} files are allowed`,
        ),
        false,
      );
    }

    callback(null, true);
  };

export const createFileUploadInterceptor = (config: FileUploadConfig = {}) => {
  const {
    fieldName = 'file',
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes = [],
    allowedExtensions = [],
  } = config;

  return FileInterceptor(fieldName, {
    storage: memoryStorage(),
    limits: { fileSize: maxFileSize },
    fileFilter: createFileFilter(allowedMimeTypes, allowedExtensions),
  });
};

export const imageFileFilter = createFileFilter(
  ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  ['jpg', 'jpeg', 'png', 'webp', 'gif'],
);

export const createImageUploadInterceptor = (fieldName = 'image') => {
  return FileInterceptor(fieldName, {
    storage: memoryStorage(),
    limits: { fileSize: DEFAULT_MAX_FILE_SIZE },
    fileFilter: imageFileFilter,
  });
};

export const ImageUploadInterceptor = createImageUploadInterceptor('image');

export const createImageArrayUploadInterceptor = (
  fieldName = 'files',
  maxCount = 10,
) => {
  return FilesInterceptor(fieldName, maxCount, {
    storage: memoryStorage(),
    limits: { fileSize: DEFAULT_MAX_FILE_SIZE },
    fileFilter: imageFileFilter,
  });
};

export const createEventFileUploadInterceptor = () => {
  const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const documentMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  return FileFieldsInterceptor(
    [
      { name: 'coverImage', maxCount: 1 },
      { name: 'galleryImages', maxCount: 10 },
      { name: 'videos', maxCount: 5 },
      { name: 'documents', maxCount: 5 },
    ],
    {
      storage: memoryStorage(),
      limits: {
        fileSize: DEFAULT_MAX_FILE_SIZE,
        files: 21,
      },
      fileFilter: (_req, file, callback) => {
        const fieldMimeMap: Record<string, string[]> = {
          coverImage: imageMimeTypes,
          galleryImages: imageMimeTypes,
          videos: videoMimeTypes,
          documents: documentMimeTypes,
        };

        const allowed = fieldMimeMap[file.fieldname];
        if (!allowed) {
          return callback(
            new BadRequestException(`Unexpected file field: ${file.fieldname}`),
            false,
          );
        }

        if (!allowed.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              `Invalid file type for ${file.fieldname}: ${file.mimetype}`,
            ),
            false,
          );
        }

        callback(null, true);
      },
    },
  );
};

export const FileUploadConfigs = {
  IMAGE: {
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
  VIDEO: {
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedExtensions: ['mp4', 'webm', 'mov'],
  },
  DOCUMENT: {
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['pdf', 'doc', 'docx'],
  },
} as const;

export const EventFileUploadInterceptor = createEventFileUploadInterceptor();
