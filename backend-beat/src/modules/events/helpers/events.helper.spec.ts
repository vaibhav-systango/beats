import { BadRequestException } from '@nestjs/common';

import { StorageService } from '../../storage/services/storage.service';
import { EventsHelper } from './events.helper';

describe('EventsHelper', () => {
  let helper: EventsHelper;

  beforeEach(() => {
    helper = new EventsHelper({} as StorageService);
  });

  describe('parseMultipartSessionDto', () => {
    it('normalizes YouTube video metadata from eventSessionMedias JSON', () => {
      const dto = helper.parseMultipartSessionDto({
        eventSessionMedias: JSON.stringify({
          videos: [
            {
              url: 'https://youtu.be/dQw4w9WgXcQ',
              mime_type: 'video/youtube',
              size: 0,
              thumbnail_url: '',
              original_name: 'promo',
            },
          ],
        }),
      });

      expect(dto.eventSessionMedias?.videos?.[0]).toEqual({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        mime_type: 'video/youtube',
        size: 0,
        thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        original_name: 'promo',
      });
    });

    it('rejects invalid YouTube URLs in eventSessionMedias', () => {
      expect(() =>
        helper.parseMultipartSessionDto({
          eventSessionMedias: JSON.stringify({
            videos: [
              {
                url: 'https://example.com/not-youtube',
                mime_type: 'video/youtube',
                size: 0,
                thumbnail_url: '',
                original_name: 'bad',
              },
            ],
          }),
        }),
      ).toThrow(BadRequestException);
    });
  });
});
