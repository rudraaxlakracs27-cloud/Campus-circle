TRUNCATE TABLE "PostInteraction", "Comment", "EventPost", "User", "University" RESTART IDENTITY CASCADE;

INSERT INTO "University" ("id", "name", "city", "country", "domain", "summary", "createdAt", "updatedAt")
VALUES
  ('uni-iit-delhi', 'IIT Delhi', 'New Delhi', 'India', 'iitd.ac.in', 'Large cultural fests, performance nights, and competitive tech events.', NOW(), NOW()),
  ('uni-bits-pilani', 'BITS Pilani', 'Pilani', 'India', 'bits-pilani.ac.in', 'Hackathons, startup showcases, and cross-campus innovation programs.', NOW(), NOW()),
  ('uni-du', 'Delhi University', 'New Delhi', 'India', 'du.ac.in', 'Society meetups, college fests, tournaments, and student-run markets.', NOW(), NOW());

INSERT INTO "User" (
  "id", "fullName", "username", "email", "passwordHash", "universityId", "role", "bio",
  "interests", "followers", "affiliation", "isVerified", "createdAt", "updatedAt"
)
VALUES
  (
    'user-aarav',
    'Aarav Mehta',
    '@aarav.on.campus',
    'aarav@iitd.ac.in',
    'a9b3fd0edac316a56cc7181b964c75df:c8f3827826ba48d0726d888c9002033ae6148f92d2d7b6fece897eb94a858fa97d806a9f06c62ba25cd81e2f0a280dcafe030ea0bdea801c3202c7e048bb66fb',
    'uni-iit-delhi',
    'Cultural Council Lead',
    'I organize music nights, founder meetups, and creator collabs on campus. My profile acts like both a personal identity and an event publishing hub so students can trust who is behind each announcement.',
    '["Live music","Campus media","Startup mixers","Student communities"]',
    5100,
    'Cultural Council',
    true,
    NOW(),
    NOW()
  ),
  (
    'user-naina',
    'Naina Kapoor',
    '@naina.builds',
    'naina@bits-pilani.ac.in',
    'a9b3fd0edac316a56cc7181b964c75df:c8f3827826ba48d0726d888c9002033ae6148f92d2d7b6fece897eb94a858fa97d806a9f06c62ba25cd81e2f0a280dcafe030ea0bdea801c3202c7e048bb66fb',
    'uni-bits-pilani',
    'Tech Club Organizer',
    'I host late-night hack sessions, demo days, and startup collabs across campuses.',
    '["Hackathons","AI demos","Startup events","Mentorship"]',
    3200,
    'Tech Club',
    true,
    NOW(),
    NOW()
  ),
  (
    'user-sana',
    'Sana Arora',
    '@sana.in.the.quad',
    'sana@du.ac.in',
    'a9b3fd0edac316a56cc7181b964c75df:c8f3827826ba48d0726d888c9002033ae6148f92d2d7b6fece897eb94a858fa97d806a9f06c62ba25cd81e2f0a280dcafe030ea0bdea801c3202c7e048bb66fb',
    'uni-du',
    'Student Founder',
    'I bring together student founders, campus vendors, and creators for community-driven event experiences.',
    '["Student brands","Community events","Food pop-ups","Pitch nights"]',
    4100,
    'Entrepreneurship Cell',
    true,
    NOW(),
    NOW()
  );

INSERT INTO "EventPost" (
  "id", "authorId", "universityId", "title", "description", "category", "eventDate", "location",
  "visibility", "mediaType", "coverImage", "rsvpLink", "likeCount", "commentCount", "shareCount",
  "interestedCount", "createdAt", "updatedAt"
)
VALUES
  (
    'post-1',
    'user-aarav',
    'uni-iit-delhi',
    'Crescendo ''26: Battle of the Bands',
    'The music society is opening our annual campus stage to indie bands, solo artists, and DJs. Expect food trucks, pop-up merch booths, and a live aftermovie crew capturing the night for reels and recap posts.',
    'Music Fest',
    '2026-04-12T00:00:00.000Z',
    'Open Air Theatre',
    'PUBLIC',
    'Video + Poster',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    'https://example.com/crescendo',
    2400,
    0,
    309,
    1800,
    '2026-03-26T18:30:00.000Z',
    NOW()
  ),
  (
    'post-2',
    'user-naina',
    'uni-bits-pilani',
    'Inter-University Hack Night',
    'A midnight build sprint where students from multiple colleges team up around AI, climate, and fintech tracks. Mentors, sponsor challenges, and internship scouts will join the live showcase the next morning.',
    'Hackathon',
    '2026-04-18T00:00:00.000Z',
    'Innovation Lab',
    'VERIFIED_ONLY',
    'Carousel + Registration Link',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    'https://example.com/hacknight',
    1600,
    0,
    267,
    940,
    '2026-03-27T09:15:00.000Z',
    NOW()
  ),
  (
    'post-3',
    'user-sana',
    'uni-du',
    'Street Food and Startup Market',
    'Entrepreneurship cell meets food carnival. Student founders can showcase brands, campus chefs can host stalls, and creators can publish teaser clips ahead of the weekend rush.',
    'Community Event',
    '2026-04-20T00:00:00.000Z',
    'North Campus Greens',
    'PUBLIC',
    'Photo Reel + Menu PDF',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    'https://example.com/startup-market',
    3200,
    0,
    410,
    2100,
    '2026-03-28T14:45:00.000Z',
    NOW()
  );
