import { unstable_noStore as noStore } from "next/cache";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";
import type {
  EventPost,
  FeedComment,
  FeedFilters,
  FeedPost,
  HomeStat,
  InteractionType,
  ModerationReport,
  NotificationItem,
  PostVisibility,
  RsvpStatus,
  SavedPostItem,
  ReportStatus,
  SignInUser,
  University,
  User
} from "@/lib/types";

function mapUniversity(university: {
  id: string;
  name: string;
  city: string;
  country: string;
  domain: string;
  summary: string;
}): University {
  return university;
}

function mapUser(user: {
  id: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash?: string;
  universityId: string;
  role: string;
  bio: string;
  interests: string;
  followers: number;
  affiliation: string;
  isVerified: boolean;
}): User {
  return {
    ...user,
    interests: JSON.parse(user.interests) as string[]
  };
}

function mapPost(post: {
  id: string;
  authorId: string;
  universityId: string;
  title: string;
  description: string;
  category: string;
  eventDate: Date;
  location: string;
  visibility: string;
  mediaType: string;
  coverImage: string;
  rsvpLink: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  interestedCount: number;
  createdAt: Date;
  goingCount?: number;
  maybeCount?: number;
}): EventPost {
  return {
    ...post,
    eventDate: post.eventDate.toISOString(),
    visibility: post.visibility as PostVisibility,
    rsvpLink: post.rsvpLink ?? undefined,
    goingCount: post.goingCount ?? 0,
    maybeCount: post.maybeCount ?? 0,
    createdAt: post.createdAt.toISOString()
  };
}

function mapComment(comment: {
  id: string;
  body: string;
  createdAt: Date;
  parentId?: string | null;
  author: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    universityId: string;
    role: string;
    bio: string;
    interests: string;
    followers: number;
    affiliation: string;
    isVerified: boolean;
  };
  replies?: Array<{
    id: string;
    body: string;
    createdAt: Date;
    parentId?: string | null;
    author: {
      id: string;
      fullName: string;
      username: string;
      email: string;
      universityId: string;
      role: string;
      bio: string;
      interests: string;
      followers: number;
      affiliation: string;
      isVerified: boolean;
    };
  }>;
}): FeedComment {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: mapUser(comment.author),
    parentId: comment.parentId ?? undefined,
    replies: Array.isArray(comment.replies)
      ? comment.replies.map((reply) => ({
          id: reply.id,
          body: reply.body,
          createdAt: reply.createdAt.toISOString(),
          author: mapUser(reply.author),
          parentId: reply.parentId ?? undefined,
          replies: []
        }))
      : []
  };
}

function buildFeedPost(post: {
  id: string;
  authorId: string;
  universityId: string;
  title: string;
  description: string;
  category: string;
  eventDate: Date;
  location: string;
  visibility: string;
  mediaType: string;
  coverImage: string;
  rsvpLink: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  interestedCount: number;
  createdAt: Date;
  author: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    passwordHash?: string;
    universityId: string;
    role: string;
    bio: string;
    interests: string;
    followers: number;
    affiliation: string;
    isVerified: boolean;
  };
  university: {
    id: string;
    name: string;
    city: string;
    country: string;
    domain: string;
    summary: string;
  };
  comments: Array<{
    id: string;
    body: string;
    createdAt: Date;
    parentId?: string | null;
    author: {
      id: string;
      fullName: string;
      username: string;
      email: string;
      universityId: string;
      role: string;
      bio: string;
      interests: string;
      followers: number;
      affiliation: string;
      isVerified: boolean;
    };
    replies?: Array<{
      id: string;
      body: string;
      createdAt: Date;
      parentId?: string | null;
      author: {
        id: string;
        fullName: string;
        username: string;
        email: string;
        universityId: string;
        role: string;
        bio: string;
        interests: string;
        followers: number;
        affiliation: string;
        isVerified: boolean;
      };
    }>;
  }>;
  interactions?: Array<{
    type: string;
  }>;
  viewerHasSaved?: boolean;
  viewerFollowsAuthor?: boolean;
  viewerRsvpStatus?: RsvpStatus;
  goingCount?: number;
  maybeCount?: number;
}): FeedPost {
  return {
    ...mapPost(post),
    author: mapUser(post.author),
    university: mapUniversity(post.university),
    comments: post.comments.map(mapComment),
    viewerHasLiked: Array.isArray(post.interactions)
      ? post.interactions.some((interaction) => interaction.type === "LIKE")
      : false,
    viewerIsInterested: Array.isArray(post.interactions)
      ? post.interactions.some((interaction) => interaction.type === "INTEREST")
      : false,
    viewerHasSaved: post.viewerHasSaved ?? false,
    viewerFollowsAuthor: post.viewerFollowsAuthor ?? false,
    viewerRsvpStatus: post.viewerRsvpStatus
  };
}

async function attachViewerSocialState(posts: FeedPost[], viewerId?: string | null) {
  if (!viewerId || posts.length === 0) {
    return posts;
  }

  const [savedPosts, follows, rsvps] = await Promise.all([
    prisma.savedPost.findMany({
      where: {
        userId: viewerId,
        postId: {
          in: posts.map((post) => post.id)
        }
      },
      select: {
        postId: true
      }
    }),
    prisma.follow.findMany({
      where: {
        followerId: viewerId,
        followingId: {
          in: posts
            .map((post) => post.authorId)
            .filter((authorId) => authorId !== viewerId)
        }
      },
      select: {
        followingId: true
      }
    }),
    prisma.eventRsvp.findMany({
      where: {
        userId: viewerId,
        postId: {
          in: posts.map((post) => post.id)
        }
      },
      select: {
        postId: true,
        status: true
      }
    })
  ]);

  const savedPostIds = new Set(savedPosts.map((item) => item.postId));
  const followedUserIds = new Set(follows.map((item) => item.followingId));
  const rsvpStatusByPostId = new Map(rsvps.map((item) => [item.postId, item.status as RsvpStatus]));

  return posts.map((post) => ({
    ...post,
    viewerHasSaved: savedPostIds.has(post.id),
    viewerFollowsAuthor: followedUserIds.has(post.authorId),
    viewerRsvpStatus: rsvpStatusByPostId.get(post.id)
  }));
}

function scoreFeedPost(input: {
  post: FeedPost;
  viewer?: {
    universityId: string;
    interests: string[];
  } | null;
}) {
  const now = Date.now();
  const eventTime = new Date(input.post.eventDate).getTime();
  const msUntilEvent = eventTime - now;
  const daysUntilEvent = msUntilEvent / (1000 * 60 * 60 * 24);
  const totalEngagement =
    input.post.likeCount +
    input.post.commentCount * 2 +
    input.post.shareCount * 3 +
    input.post.interestedCount +
    input.post.goingCount * 2 +
    input.post.maybeCount;

  let score = Math.log10(totalEngagement + 10) * 8;

  if (daysUntilEvent >= 0 && daysUntilEvent <= 7) {
    score += 18;
  } else if (daysUntilEvent > 7 && daysUntilEvent <= 30) {
    score += 10;
  } else if (daysUntilEvent < 0) {
    score -= 18;
  }

  if (input.viewer) {
    if (input.post.universityId === input.viewer.universityId) {
      score += 12;
    }

    if (input.post.viewerFollowsAuthor) {
      score += 18;
    }

    if (input.post.viewerHasSaved) {
      score += 8;
    }

    if (input.post.viewerIsInterested) {
      score += 6;
    }

    if (input.post.viewerRsvpStatus === "GOING") {
      score += 10;
    }

    if (input.post.viewerRsvpStatus === "MAYBE") {
      score += 6;
    }

    const haystack = `${input.post.category} ${input.post.title} ${input.post.description}`.toLowerCase();
    const matchingInterests = input.viewer.interests.filter((interest) =>
      haystack.includes(interest.toLowerCase())
    ).length;
    score += Math.min(matchingInterests, 3) * 4;
  }

  return score;
}

async function rankFeedPosts(posts: FeedPost[], viewerId?: string | null) {
  if (posts.length <= 1) {
    return posts;
  }

  const viewer = viewerId
    ? await prisma.user.findUnique({
        where: {
          id: viewerId
        },
        select: {
          universityId: true,
          interests: true
        }
      })
    : null;

  const viewerContext = viewer
    ? {
        universityId: viewer.universityId,
        interests: JSON.parse(viewer.interests) as string[]
      }
    : null;

  return [...posts].sort((left, right) => {
    const scoreDelta =
      scoreFeedPost({ post: right, viewer: viewerContext }) -
      scoreFeedPost({ post: left, viewer: viewerContext });

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime();
  });
}

export async function getFeedPosts(
  viewerId?: string | null,
  filters: FeedFilters = {}
): Promise<FeedPost[]> {
  noStore();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
  let dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined;

  if (filters.datePreset === "upcoming") {
    dateFrom = startOfToday;
  }

  if (filters.datePreset === "weekend") {
    const day = startOfToday.getDay();
    const daysUntilSaturday = (6 - day + 7) % 7;
    const saturday = new Date(startOfToday);
    saturday.setDate(startOfToday.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);
    dateFrom = saturday;
    dateTo = sunday;
  }

  if (filters.datePreset === "month") {
    dateFrom = startOfToday;
    const monthEnd = new Date(startOfToday);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setHours(23, 59, 59, 999);
    dateTo = monthEnd;
  }

  const where = {
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" as const } },
            { description: { contains: filters.q, mode: "insensitive" as const } },
            { location: { contains: filters.q, mode: "insensitive" as const } },
            { category: { contains: filters.q, mode: "insensitive" as const } },
            { author: { fullName: { contains: filters.q, mode: "insensitive" as const } } },
            { university: { name: { contains: filters.q, mode: "insensitive" as const } } }
          ]
        }
      : {}),
    ...(filters.university ? { universityId: filters.university } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...((dateFrom || dateTo)
      ? {
          eventDate: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {})
          }
        }
      : {})
  };

  const posts = await prisma.eventPost.findMany({
    where,
    include: {
      author: true,
      university: true,
      comments: {
        where: {
          parentId: null
        },
        include: {
          author: true,
          replies: {
            include: {
              author: true
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      },
      interactions: viewerId
        ? {
            where: {
              userId: viewerId
            },
            select: {
              type: true
            }
          }
        : false
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  const rsvpCounts = await prisma.eventRsvp.groupBy({
    by: ["postId", "status"],
    where: {
      postId: {
        in: posts.map((post) => post.id)
      }
    },
    _count: {
      _all: true
    }
  });
  const rsvpCountMap = new Map<string, { goingCount: number; maybeCount: number }>();

  for (const item of rsvpCounts) {
    const existing = rsvpCountMap.get(item.postId) ?? {
      goingCount: 0,
      maybeCount: 0
    };

    if (item.status === "GOING") {
      existing.goingCount = item._count._all;
    }

    if (item.status === "MAYBE") {
      existing.maybeCount = item._count._all;
    }

    rsvpCountMap.set(item.postId, existing);
  }

  const hydratedPosts = await attachViewerSocialState(
    posts.map((post) =>
      buildFeedPost({
        ...post,
        ...(rsvpCountMap.get(post.id) ?? {
          goingCount: 0,
          maybeCount: 0
        })
      })
    ),
    viewerId
  );

  return rankFeedPosts(hydratedPosts, viewerId);
}

export async function getUserById(userId: string) {
  noStore();
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  return user ? mapUser(user) : null;
}

export async function getUserByEmail(email: string) {
  noStore();
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  return user ? mapUser(user) : null;
}

function normalizeUsername(value: string) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);

  return cleaned || `student.${Math.random().toString(36).slice(2, 8)}`;
}

async function getAvailableUsername(baseValue: string) {
  const base = normalizeUsername(baseValue);

  for (let index = 0; index < 25; index += 1) {
    const candidate = index === 0 ? `@${base}` : `@${base}${index + 1}`;
    const existing = await prisma.user.findUnique({
      where: {
        username: candidate
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return candidate;
    }
  }

  return `@${base}${Date.now().toString().slice(-4)}`;
}

export async function syncAuthUserAccount(authUser: SupabaseAuthUser) {
  noStore();
  const email = authUser.email?.toLowerCase();

  if (!email) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existing) {
    return mapUser(existing);
  }

  const firstUniversity = await prisma.university.findFirst({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true
    }
  });

  if (!firstUniversity) {
    throw new Error("No universities exist yet for auth profile sync.");
  }

  const metadata = authUser.user_metadata ?? {};
  const emailPrefix = email.split("@")[0] ?? "student";
  const fullName =
    typeof metadata.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : emailPrefix
          .split(/[._-]+/)
          .filter(Boolean)
          .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
          .join(" ");
  const usernameSource =
    typeof metadata.username === "string" && metadata.username.trim()
      ? metadata.username
      : emailPrefix;
  let universityId =
    typeof metadata.university_id === "string" && metadata.university_id.trim()
      ? metadata.university_id
      : firstUniversity.id;

  if (universityId !== firstUniversity.id) {
    const validUni = await prisma.university.findUnique({
      where: { id: universityId },
      select: { id: true }
    });
    if (!validUni) {
      universityId = firstUniversity.id;
    }
  }

  const username = await getAvailableUsername(usernameSource);

  const user = await prisma.user.create({
    data: {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fullName,
      username,
      email,
      passwordHash: "",
      universityId,
      role: "Student",
      bio: "New to Campus Circles and ready to discover what's happening across campus.",
      interests: JSON.stringify(["Campus events", "Student communities"]),
      followers: 0,
      affiliation: "Independent student",
      isVerified: false
    }
  });

  return mapUser(user);
}

export async function getUserFeedSummary(userId: string) {
  noStore();
  const [user, followingCount, savedRecords, savedCount, followingLinks] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        university: true,
        posts: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    }),
    prisma.follow.count({
      where: {
        followerId: userId
      }
    }),
    prisma.savedPost.findMany({
      where: {
        userId
      },
      include: {
        post: {
          include: {
            author: true,
            university: true,
            comments: {
              where: {
                parentId: null
              },
              include: {
                author: true,
                replies: {
                  include: {
                    author: true
                  },
                  orderBy: {
                    createdAt: "asc"
                  }
                }
              },
              orderBy: {
                createdAt: "asc"
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6
    }),
    prisma.savedPost.count({
      where: {
        userId
      }
    }),
    prisma.follow.findMany({
      where: {
        followerId: userId
      },
      select: {
        followingId: true
      }
    })
  ]);

  if (!user) {
    return null;
  }

  const posts = user.posts.map(mapPost);
  const followedUserIds = new Set(followingLinks.map((item) => item.followingId));
  const savedPosts = savedRecords.map((record) =>
    buildFeedPost({
      ...record.post,
      viewerHasSaved: true,
      viewerFollowsAuthor: followedUserIds.has(record.post.authorId)
    })
  );
  const engagementTotal = posts.reduce(
    (sum, post) => sum + post.likeCount + post.commentCount + post.shareCount,
    0
  );
  const averageEngagement = posts.length > 0 ? Math.round(engagementTotal / posts.length) : 0;

  return {
    user: mapUser(user),
    university: mapUniversity(user.university),
    posts,
    savedPosts,
    metrics: [
      {
        label: "Followers",
        value: formatCompactNumber(user.followers),
        detail: "Students following this organizer for future events."
      },
      {
        label: "Following",
        value: formatCompactNumber(followingCount),
        detail: "Student creators and organizers this account is tracking."
      },
      {
        label: "Events posted",
        value: String(posts.length),
        detail: "Published from this account across the campus network."
      },
      {
        label: "Saved events",
        value: String(savedCount),
        detail: "Events bookmarked so you can come back later."
      },
      {
        label: "Average interactions",
        value: formatCompactNumber(averageEngagement),
        detail: "Likes, comments, and shares per post."
      }
    ]
  };
}

export async function getHomeStats(): Promise<HomeStat[]> {
  noStore();
  const [universityCount, posts] = await Promise.all([
    prisma.university.count(),
    prisma.eventPost.findMany({
      select: {
        mediaType: true,
        eventDate: true
      }
    })
  ]);

  const mediaTypes = new Set(posts.map((post) => post.mediaType));
  const upcomingPosts = posts.filter((post) => post.eventDate >= new Date("2026-03-29"));

  return [
    {
      label: "Universities onboarded",
      value: String(universityCount),
      detail: "Start with verified student ambassadors and club admins."
    },
    {
      label: "Upcoming events",
      value: String(upcomingPosts.length),
      detail: "Students can browse events across their own campus and other universities."
    },
    {
      label: "Media formats tracked",
      value: String(mediaTypes.size),
      detail: "Photos, videos, posters, brochures, reels, and registration links."
    }
  ];
}

export async function createEventPost(input: {
  author: User;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  location: string;
  visibility: PostVisibility;
  mediaType: string;
  coverImage: string;
  rsvpLink?: string;
}) {
  noStore();
  const post = await prisma.eventPost.create({
    data: {
      id: `post-${Date.now()}`,
      authorId: input.author.id,
      universityId: input.author.universityId,
      title: input.title,
      description: input.description,
      category: input.category,
      eventDate: new Date(input.eventDate),
      location: input.location,
      visibility: input.visibility,
      mediaType: input.mediaType,
      coverImage: input.coverImage,
      rsvpLink: input.rsvpLink || null
    }
  });

  return mapPost(post);
}

export async function createNotification(input: {
  userId: string;
  actorId?: string;
  postId?: string;
  type: string;
  title: string;
  body: string;
}) {
  noStore();

  if (input.actorId && input.userId === input.actorId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: input.userId,
      actorId: input.actorId || null,
      postId: input.postId || null,
      type: input.type,
      title: input.title,
      body: input.body
    }
  });
}

export async function updateEventPost(input: {
  postId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  location: string;
  visibility: PostVisibility;
  mediaType: string;
  coverImage: string;
  rsvpLink?: string;
}) {
  noStore();
  const existing = await prisma.eventPost.findUnique({
    where: {
      id: input.postId
    },
    select: {
      authorId: true
    }
  });

  if (!existing || existing.authorId !== input.userId) {
    return null;
  }

  const post = await prisma.eventPost.update({
    where: {
      id: input.postId
    },
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      eventDate: new Date(input.eventDate),
      location: input.location,
      visibility: input.visibility,
      mediaType: input.mediaType,
      coverImage: input.coverImage,
      rsvpLink: input.rsvpLink || null
    }
  });

  return mapPost(post);
}

export async function deleteEventPost(input: { postId: string; userId: string }) {
  noStore();
  const existing = await prisma.eventPost.findUnique({
    where: {
      id: input.postId
    },
    select: {
      authorId: true
    }
  });

  if (!existing || existing.authorId !== input.userId) {
    return false;
  }

  await prisma.eventPost.delete({
    where: {
      id: input.postId
    }
  });

  return true;
}

export async function createPostReport(input: {
  postId: string;
  reporterId: string;
  reason: string;
  details?: string;
}) {
  noStore();
  const post = await prisma.eventPost.findUnique({
    where: {
      id: input.postId
    },
    select: {
      id: true,
      authorId: true
    }
  });

  if (!post || post.authorId === input.reporterId) {
    return null;
  }

  const report = await prisma.report.create({
    data: {
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      postId: input.postId,
      reporterId: input.reporterId,
      reason: input.reason,
      details: input.details || null
    }
  });

  const admins = await prisma.user.findMany({
    where: {
      role: {
        contains: "Admin",
        mode: "insensitive"
      }
    },
    select: {
      id: true
    }
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        actorId: input.reporterId,
        postId: input.postId,
        type: "REPORT",
        title: "A post was reported",
        body: `A student flagged a post for "${input.reason}".`
      })
    )
  );

  return report;
}

export async function togglePostInteraction(input: {
  postId: string;
  userId: string;
  type: InteractionType;
}) {
  noStore();
  const existing = await prisma.postInteraction.findUnique({
    where: {
      postId_userId_type: {
        postId: input.postId,
        userId: input.userId,
        type: input.type
      }
    }
  });

  const countField = input.type === "LIKE" ? "likeCount" : "interestedCount";

  if (existing) {
    await prisma.$transaction([
      prisma.postInteraction.delete({
        where: {
          id: existing.id
        }
      }),
      prisma.eventPost.update({
        where: {
          id: input.postId
        },
        data: {
          [countField]: {
            decrement: 1
          }
        }
      })
    ]);
    return false;
  }

  await prisma.$transaction([
    prisma.postInteraction.create({
      data: {
        id: `interaction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        postId: input.postId,
        userId: input.userId,
        type: input.type
      }
    }),
    prisma.eventPost.update({
      where: {
        id: input.postId
      },
      data: {
        [countField]: {
          increment: 1
        }
      }
    })
  ]);

  const [post, actor] = await Promise.all([
    prisma.eventPost.findUnique({
      where: {
        id: input.postId
      },
      select: {
        id: true,
        title: true,
        authorId: true
      }
    }),
    prisma.user.findUnique({
      where: {
        id: input.userId
      },
      select: {
        fullName: true
      }
    })
  ]);

  if (post?.authorId && actor?.fullName) {
    await createNotification({
      userId: post.authorId,
      actorId: input.userId,
      postId: input.postId,
      type: input.type,
      title: input.type === "LIKE" ? "Someone liked your event" : "Someone is interested in your event",
      body:
        input.type === "LIKE"
          ? `${actor.fullName} liked "${post.title}".`
          : `${actor.fullName} marked "${post.title}" as interested.`
    });
  }

  return true;
}

export async function toggleSavedPost(input: { postId: string; userId: string }) {
  noStore();
  const existing = await prisma.savedPost.findUnique({
    where: {
      postId_userId: {
        postId: input.postId,
        userId: input.userId
      }
    }
  });

  if (existing) {
    await prisma.savedPost.delete({
      where: {
        id: existing.id
      }
    });
    return false;
  }

  const post = await prisma.eventPost.findUnique({
    where: {
      id: input.postId
    },
    select: {
      id: true
    }
  });

  if (!post) {
    return false;
  }

  await prisma.savedPost.create({
    data: {
      id: `save-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      postId: input.postId,
      userId: input.userId
    }
  });

  return true;
}

export async function toggleUserFollow(input: { followerId: string; followingId: string }) {
  noStore();

  if (input.followerId === input.followingId) {
    return false;
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: input.followerId,
        followingId: input.followingId
      }
    }
  });

  if (existing) {
    await prisma.$transaction([
      prisma.follow.delete({
        where: {
          id: existing.id
        }
      }),
      prisma.user.update({
        where: {
          id: input.followingId
        },
        data: {
          followers: {
            decrement: 1
          }
        }
      })
    ]);
    return false;
  }

  await prisma.$transaction([
    prisma.follow.create({
      data: {
        id: `follow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        followerId: input.followerId,
        followingId: input.followingId
      }
    }),
    prisma.user.update({
      where: {
        id: input.followingId
      },
      data: {
        followers: {
          increment: 1
        }
      }
    })
  ]);

  const actor = await prisma.user.findUnique({
    where: {
      id: input.followerId
    },
    select: {
      fullName: true
    }
  });

  if (actor?.fullName) {
    await createNotification({
      userId: input.followingId,
      actorId: input.followerId,
      type: "FOLLOW",
      title: "New follower",
      body: `${actor.fullName} is now following your event updates.`
    });
  }

  return true;
}

export async function togglePostRsvp(input: {
  postId: string;
  userId: string;
  status: RsvpStatus;
}) {
  noStore();
  const existing = await prisma.eventRsvp.findUnique({
    where: {
      postId_userId: {
        postId: input.postId,
        userId: input.userId
      }
    }
  });

  if (existing?.status === input.status) {
    await prisma.eventRsvp.delete({
      where: {
        id: existing.id
      }
    });
    return null;
  }

  const rsvp = existing
    ? await prisma.eventRsvp.update({
        where: {
          id: existing.id
        },
        data: {
          status: input.status
        }
      })
    : await prisma.eventRsvp.create({
        data: {
          id: `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          postId: input.postId,
          userId: input.userId,
          status: input.status
        }
      });

  const [post, actor] = await Promise.all([
    prisma.eventPost.findUnique({
      where: {
        id: input.postId
      },
      select: {
        id: true,
        title: true,
        authorId: true
      }
    }),
    prisma.user.findUnique({
      where: {
        id: input.userId
      },
      select: {
        fullName: true
      }
    })
  ]);

  if (post?.authorId && actor?.fullName) {
    await createNotification({
      userId: post.authorId,
      actorId: input.userId,
      postId: input.postId,
      type: "RSVP",
      title: input.status === "GOING" ? "Someone is going to your event" : "Someone might attend your event",
      body:
        input.status === "GOING"
          ? `${actor.fullName} RSVP’d as going for "${post.title}".`
          : `${actor.fullName} RSVP’d as maybe for "${post.title}".`
    });
  }

  return rsvp.status as RsvpStatus;
}

export async function createComment(input: {
  postId: string;
  userId: string;
  body: string;
  parentId?: string;
}) {
  noStore();
  const post = await prisma.eventPost.findUnique({
    where: {
      id: input.postId
    },
    select: {
      id: true,
      title: true,
      authorId: true
    }
  });

  if (!post) {
    return;
  }

  let parentCommentAuthorId: string | null = null;

  if (input.parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: {
        id: input.parentId
      },
      select: {
        id: true,
        postId: true,
        authorId: true
      }
    });

    if (!parentComment || parentComment.postId !== input.postId) {
      return;
    }

    parentCommentAuthorId = parentComment.authorId;
  }

  await prisma.$transaction([
    prisma.comment.create({
      data: {
        id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        postId: input.postId,
        authorId: input.userId,
        parentId: input.parentId || null,
        body: input.body
      }
    }),
    prisma.eventPost.update({
      where: {
        id: input.postId
      },
      data: {
        commentCount: {
          increment: 1
        }
      }
    })
  ]);

  const actor = await prisma.user.findUnique({
    where: {
      id: input.userId
    },
    select: {
      fullName: true
    }
  });

  if (post.authorId && actor?.fullName) {
    await createNotification({
      userId: post.authorId,
      actorId: input.userId,
      postId: input.postId,
      type: input.parentId ? "REPLY" : "COMMENT",
      title: input.parentId ? "New reply on your event" : "New comment on your event",
      body: input.parentId
        ? `${actor.fullName} replied in "${post.title}".`
        : `${actor.fullName} commented on "${post.title}".`
    });
  }

  if (
    input.parentId &&
    parentCommentAuthorId &&
    parentCommentAuthorId !== input.userId &&
    parentCommentAuthorId !== post.authorId &&
    actor?.fullName
  ) {
    await createNotification({
      userId: parentCommentAuthorId,
      actorId: input.userId,
      postId: input.postId,
      type: "REPLY",
      title: "Someone replied to your comment",
      body: `${actor.fullName} replied to your comment on "${post.title}".`
    });
  }
}

export async function getUniversities() {
  noStore();
  const universities = await prisma.university.findMany({
    orderBy: {
      name: "asc"
    }
  });

  return universities.map(mapUniversity);
}

export async function getSignInUsers(): Promise<SignInUser[]> {
  noStore();
  const users = await prisma.user.findMany({
    include: {
      university: true
    },
    orderBy: {
      fullName: "asc"
    }
  });

  return users.map((user) => ({
    ...mapUser(user),
    university: mapUniversity(user.university)
  }));
}

export async function updateUserProfile(input: {
  userId: string;
  fullName: string;
  username: string;
  bio: string;
  affiliation: string;
  interests: string[];
}) {
  noStore();
  const normalizedUsername = input.username.startsWith("@") ? input.username : `@${input.username}`;
  const existing = await prisma.user.findFirst({
    where: {
      username: normalizedUsername,
      NOT: {
        id: input.userId
      }
    },
    select: {
      id: true
    }
  });

  if (existing) {
    return {
      error: "username-taken" as const
    };
  }

  const user = await prisma.user.update({
    where: {
      id: input.userId
    },
    data: {
      fullName: input.fullName,
      username: normalizedUsername,
      bio: input.bio,
      affiliation: input.affiliation,
      interests: JSON.stringify(input.interests)
    }
  });

  return {
    user: mapUser(user)
  };
}

export async function getFeedCategories() {
  noStore();
  const categories = await prisma.eventPost.findMany({
    distinct: ["category"],
    select: {
      category: true
    },
    orderBy: {
      category: "asc"
    }
  });

  return categories.map((item) => item.category);
}

export async function getFeedPostById(postId: string, viewerId?: string | null) {
  noStore();
  const post = await prisma.eventPost.findUnique({
    where: {
      id: postId
    },
    include: {
      author: true,
      university: true,
      comments: {
        where: {
          parentId: null
        },
        include: {
          author: true,
          replies: {
            include: {
              author: true
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      },
      interactions: viewerId
        ? {
            where: {
              userId: viewerId
            },
            select: {
              type: true
            }
          }
        : false
    }
  });

  if (!post) {
    return null;
  }

  const rsvpCounts = await prisma.eventRsvp.groupBy({
    by: ["status"],
    where: {
      postId
    },
    _count: {
      _all: true
    }
  });
  const goingCount = rsvpCounts.find((item) => item.status === "GOING")?._count._all ?? 0;
  const maybeCount = rsvpCounts.find((item) => item.status === "MAYBE")?._count._all ?? 0;

  const [saved, follow, rsvp] = viewerId
    ? await Promise.all([
        prisma.savedPost.findUnique({
          where: {
            postId_userId: {
              postId,
              userId: viewerId
            }
          },
          select: {
            id: true
          }
        }),
        post.authorId === viewerId
          ? Promise.resolve(null)
          : prisma.follow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: viewerId,
                  followingId: post.authorId
                }
              },
              select: {
                id: true
              }
            }),
        prisma.eventRsvp.findUnique({
          where: {
            postId_userId: {
              postId,
              userId: viewerId
            }
          },
          select: {
            status: true
          }
        })
      ])
    : [null, null, null];

  return buildFeedPost({
    ...post,
    goingCount,
    maybeCount,
    viewerHasSaved: Boolean(saved),
    viewerFollowsAuthor: Boolean(follow),
    viewerRsvpStatus: (rsvp?.status as RsvpStatus | undefined) ?? undefined
  });
}

export async function getSavedPostsForUser(userId: string): Promise<SavedPostItem[]> {
  noStore();
  const savedRecords = await prisma.savedPost.findMany({
    where: {
      userId
    },
    include: {
      post: {
        include: {
          author: true,
          university: true,
          comments: {
            where: {
              parentId: null
            },
            include: {
              author: true,
              replies: {
                include: {
                  author: true
                },
                orderBy: {
                  createdAt: "asc"
                }
              }
            },
            orderBy: {
              createdAt: "asc"
            }
          },
          interactions: {
            where: {
              userId
            },
            select: {
              type: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const follows = await prisma.follow.findMany({
    where: {
      followerId: userId,
      followingId: {
        in: savedRecords.map((record) => record.post.authorId).filter((authorId) => authorId !== userId)
      }
    },
    select: {
      followingId: true
    }
  });
  const followedUserIds = new Set(follows.map((item) => item.followingId));

  return savedRecords.map((record) =>
    buildFeedPost({
      ...record.post,
      viewerHasSaved: true,
      viewerFollowsAuthor: followedUserIds.has(record.post.authorId)
    })
  );
}

function mapModerationReport(report: {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  post: {
    id: string;
    authorId: string;
    universityId: string;
    title: string;
    description: string;
    category: string;
    eventDate: Date;
    location: string;
    visibility: string;
    mediaType: string;
    coverImage: string;
    rsvpLink: string | null;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    interestedCount: number;
    createdAt: Date;
    author: {
      id: string;
      fullName: string;
      username: string;
      email: string;
      universityId: string;
      role: string;
      bio: string;
      interests: string;
      followers: number;
      affiliation: string;
      isVerified: boolean;
    };
    university: {
      id: string;
      name: string;
      city: string;
      country: string;
      domain: string;
      summary: string;
    };
  };
  reporter: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    universityId: string;
    role: string;
    bio: string;
    interests: string;
    followers: number;
    affiliation: string;
    isVerified: boolean;
  };
  reviewer: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    universityId: string;
    role: string;
    bio: string;
    interests: string;
    followers: number;
    affiliation: string;
    isVerified: boolean;
  } | null;
}): ModerationReport {
  return {
    id: report.id,
    reason: report.reason,
    details: report.details ?? undefined,
    status: report.status as ReportStatus,
    createdAt: report.createdAt.toISOString(),
    reviewedAt: report.reviewedAt ? report.reviewedAt.toISOString() : undefined,
    post: {
      ...mapPost(report.post),
      author: mapUser(report.post.author),
      university: mapUniversity(report.post.university)
    },
    reporter: mapUser(report.reporter),
    reviewer: report.reviewer ? mapUser(report.reviewer) : undefined
  };
}

export async function getModerationReports() {
  noStore();
  const reports = await prisma.report.findMany({
    include: {
      post: {
        include: {
          author: true,
          university: true
        }
      },
      reporter: true,
      reviewer: true
    },
    orderBy: [
      {
        status: "asc"
      },
      {
        createdAt: "desc"
      }
    ]
  });

  return reports.map(mapModerationReport);
}

function mapNotification(notification: {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  actor: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    universityId: string;
    role: string;
    bio: string;
    interests: string;
    followers: number;
    affiliation: string;
    isVerified: boolean;
  } | null;
  post: {
    id: string;
    authorId: string;
    universityId: string;
    title: string;
    description: string;
    category: string;
    eventDate: Date;
    location: string;
    visibility: string;
    mediaType: string;
    coverImage: string;
    rsvpLink: string | null;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    interestedCount: number;
    createdAt: Date;
  } | null;
}): NotificationItem {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    actor: notification.actor ? mapUser(notification.actor) : undefined,
    post: notification.post ? mapPost(notification.post) : undefined
  };
}

export async function getNotificationsForUser(userId: string) {
  noStore();
  const notifications = await prisma.notification.findMany({
    where: {
      userId
    },
    include: {
      actor: true,
      post: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 40
  });

  return notifications.map(mapNotification);
}

export async function getUnreadNotificationsCount(userId: string) {
  noStore();
  return prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
}

export async function markNotificationsRead(userId: string) {
  noStore();
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
}

export async function updateReportStatus(input: {
  reportId: string;
  reviewerId: string;
  status: Exclude<ReportStatus, "OPEN">;
}) {
  noStore();
  return prisma.report.update({
    where: {
      id: input.reportId
    },
    data: {
      status: input.status,
      reviewedBy: input.reviewerId,
      reviewedAt: new Date()
    }
  });
}

export async function getOwnedPostById(postId: string, userId: string) {
  noStore();
  const post = await prisma.eventPost.findUnique({
    where: {
      id: postId
    }
  });

  if (!post || post.authorId !== userId) {
    return null;
  }

  return mapPost(post);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function formatVisibilityLabel(value: PostVisibility) {
  switch (value) {
    case "CAMPUS_ONLY":
      return "Campus only";
    case "VERIFIED_ONLY":
      return "Verified students";
    default:
      return "Public campus post";
  }
}
