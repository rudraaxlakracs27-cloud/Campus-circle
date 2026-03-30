export type PostVisibility = "PUBLIC" | "VERIFIED_ONLY" | "CAMPUS_ONLY";
export type InteractionType = "LIKE" | "INTEREST";
export type ReportStatus = "OPEN" | "REVIEWED" | "DISMISSED";
export type RsvpStatus = "GOING" | "MAYBE";

export type University = {
  id: string;
  name: string;
  city: string;
  country: string;
  domain: string;
  summary: string;
};

export type User = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash?: string;
  universityId: string;
  role: string;
  bio: string;
  interests: string[];
  followers: number;
  affiliation: string;
  isVerified: boolean;
};

export type EventPost = {
  id: string;
  authorId: string;
  universityId: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  location: string;
  visibility: PostVisibility;
  mediaType: string;
  coverImage: string;
  rsvpLink?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  interestedCount: number;
  goingCount: number;
  maybeCount: number;
  createdAt: string;
};

export type FeedPost = EventPost & {
  author: User;
  university: University;
  comments: FeedComment[];
  viewerHasLiked: boolean;
  viewerIsInterested: boolean;
  viewerHasSaved: boolean;
  viewerFollowsAuthor: boolean;
  viewerRsvpStatus?: RsvpStatus;
};

export type FeedComment = {
  id: string;
  body: string;
  createdAt: string;
  author: User;
  parentId?: string;
  replies: FeedComment[];
};

export type FeedFilters = {
  q?: string;
  university?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  datePreset?: "upcoming" | "weekend" | "month";
};

export type HomeStat = {
  label: string;
  value: string;
  detail: string;
};

export type SignInUser = User & {
  university: University;
};

export type ModerationReport = {
  id: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt?: string;
  post: EventPost & {
    author: User;
    university: University;
  };
  reporter: User;
  reviewer?: User;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  actor?: User;
  post?: EventPost;
};

export type SavedPostItem = FeedPost;
