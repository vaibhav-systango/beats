import type { AdminEventDetail, AdminEventListItem } from './admin-event.types'

const MOCK_EVENT_DETAILS: AdminEventDetail[] = [
  {
    id: '01HQVN8K3M2P4R6S8T0W2X4Y6Z',
    organiserName: 'Riya Sharma',
    title: 'Underground Pulse: Delhi Edition',
    startAt: 1_752_009_600_000,
    status: 'PENDING_APPROVAL',
    slug: 'underground-pulse-delhi-edition',
    description:
      'A late-night electronic showcase featuring emerging DJs from across North India. Expect immersive visuals, curated sound, and a limited-capacity warehouse experience.',
    submittedAt: 1_751_884_800_000,
    sessions: [
      {
        id: '01HQVN8K3M2P4R6S8T0W2X4Y6A',
        title: 'Main Floor',
        startAt: 1_752_009_600_000,
        endAt: 1_752_046_800_000,
        locationType: 'VENUE',
        venueName: 'The Warehouse, Okhla',
        ticketTypes: [
          { name: 'Early Bird', price: 799, quantity: 120 },
          { name: 'General Admission', price: 1_199, quantity: 280 },
        ],
        bannerUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
        galleryUrls: [
          'https://images.unsplash.com/photo-1459746661175-04dbef3ebfb3?w=800',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        ],
      },
    ],
  },
  {
    id: '01HQVN8K3M2P4R6S8T0W2X4Y7B',
    organiserName: 'Beat Collective',
    title: 'Sunset Rooftop Sessions',
    startAt: 1_752_096_000_000,
    status: 'PENDING_APPROVAL',
    slug: 'sunset-rooftop-sessions',
    description:
      'Open-air house and disco set on a rooftop overlooking the city skyline. Food partners and a sunset golden hour slot included.',
    submittedAt: 1_751_970_560_000,
    sessions: [
      {
        id: '01HQVN8K3M2P4R6S8T0W2X4Y7C',
        title: 'Rooftop Stage',
        startAt: 1_752_096_000_000,
        endAt: 1_752_122_400_000,
        locationType: 'VENUE',
        venueName: 'Skyline Terrace, Bandra',
        ticketTypes: [{ name: 'Standard', price: 1_499, quantity: 150 }],
        bannerUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ecdad24?w=1200',
      },
    ],
  },
  {
    id: '01HQVN8K3M2P4R6S8T0W2X4Y8D',
    organiserName: 'Aman Verma',
    title: 'Producer Masterclass Live',
    startAt: 1_752_182_400_000,
    status: 'PENDING_APPROVAL',
    slug: 'producer-masterclass-live',
    description:
      'Interactive online masterclass on arrangement, mixdown, and release strategy for independent producers.',
    submittedAt: 1_752_052_800_000,
    sessions: [
      {
        id: '01HQVN8K3M2P4R6S8T0W2X4Y8E',
        title: 'Live Stream',
        startAt: 1_752_182_400_000,
        endAt: 1_752_194_400_000,
        locationType: 'ONLINE',
        ticketTypes: [
          { name: 'Participant', price: 499, quantity: 500 },
          { name: 'Replay Access', price: 299, quantity: 1_000 },
        ],
        bannerUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200',
      },
    ],
  },
  {
    id: '01HQVN8K3M2P4R6S8T0W2X4Y9F',
    organiserName: 'Neon Archives',
    title: 'Archived Sets Vol. 3',
    startAt: null,
    status: 'PENDING_APPROVAL',
    slug: 'archived-sets-vol-3',
    description:
      'On-demand access to three recorded performances from the Neon Archives vault. Session timings are flexible for viewers.',
    submittedAt: 1_752_118_400_000,
    sessions: [
      {
        id: '01HQVN8K3M2P4R6S8T0W2X4Y9G',
        title: 'Recorded Bundle',
        startAt: 1_752_118_400_000,
        endAt: 1_754_710_400_000,
        locationType: 'RECORDED',
        ticketTypes: [{ name: 'Full Access', price: 349, quantity: 2_000 }],
        galleryUrls: [
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
          'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
        ],
      },
    ],
  },
  {
    id: '01HQVN8K3M2P4R6S8T0W2X4Y0H',
    organiserName: 'Kolkata Jazz Forum',
    title: 'Monsoon Jazz Night',
    startAt: 1_752_268_800_000,
    status: 'PENDING_APPROVAL',
    slug: 'monsoon-jazz-night',
    description:
      'An intimate jazz evening with a four-piece ensemble and guest vocalists. Seated format with table service.',
    submittedAt: 1_752_144_000_000,
    sessions: [
      {
        id: '01HQVN8K3M2P4R6S8T0W2X4Y0J',
        title: 'Evening Set',
        startAt: 1_752_268_800_000,
        endAt: 1_752_291_600_000,
        locationType: 'VENUE',
        venueName: 'The Listening Room, Park Street',
        ticketTypes: [
          { name: 'Table for 2', price: 2_499, quantity: 40 },
          { name: 'Single Seat', price: 1_299, quantity: 80 },
        ],
        bannerUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0f35b08b0?w=1200',
      },
    ],
  },
]

export const MOCK_PENDING_EVENTS: AdminEventListItem[] = MOCK_EVENT_DETAILS.map(
  ({ id, organiserName, title, startAt, status }) => ({
    id,
    organiserName,
    title,
    startAt,
    status,
  })
)

export function getMockEventById(id: string): AdminEventDetail | undefined {
  return MOCK_EVENT_DETAILS.find((event) => event.id === id)
}

export function getMockEventDetails(): AdminEventDetail[] {
  return MOCK_EVENT_DETAILS
}
