import { connectToDatabase } from "@/lib/db";
import { BlogLikeModel } from "@/lib/models/blog-like";
import { BlogMetricModel } from "@/lib/models/blog-metric";

type ToggleBlogLikeInput = {
  slug: string;
  userId: string;
  username: string;
  displayName: string;
};

type BlogMetricDocument = {
  likeCount?: number;
};

type BlogLikeDocument = {
  slug: string;
  userId: string;
};

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function getBlogLikeSnapshot(slug: string, viewerUserId?: string) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      likeCount: 0,
      viewerHasLiked: false,
    };
  }

  const [metric, like] = await Promise.all([
    BlogMetricModel.findOne({ slug }).select({ likeCount: 1, _id: 0 }).lean(),
    viewerUserId
      ? BlogLikeModel.findOne({ slug, userId: viewerUserId })
          .select({ _id: 1 })
          .lean()
      : null,
  ]);

  return {
    available: true,
    likeCount: (metric as BlogMetricDocument | null)?.likeCount ?? 0,
    viewerHasLiked: Boolean(like),
  };
}

export async function getUserLikedPostCount(userId: string) {
  const database = await connectToDatabase();

  if (!database) {
    return 0;
  }

  return BlogLikeModel.countDocuments({ userId });
}

export async function toggleBlogLike({
  slug,
  userId,
  username,
  displayName,
}: ToggleBlogLikeInput) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      likeCount: 0,
      liked: false,
    };
  }

  const removedLike = (await BlogLikeModel.findOneAndDelete({
    slug,
    userId,
  }).lean()) as BlogLikeDocument | null;

  if (removedLike) {
    const currentMetric = (await BlogMetricModel.findOne({ slug })
      .select({ likeCount: 1, _id: 0 })
      .lean()) as BlogMetricDocument | null;
    const nextLikeCount = Math.max(0, (currentMetric?.likeCount ?? 0) - 1);

    await BlogMetricModel.findOneAndUpdate(
      { slug },
      {
        $set: {
          likeCount: nextLikeCount,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return {
      available: true,
      likeCount: nextLikeCount,
      liked: false,
    };
  }

  try {
    await BlogLikeModel.create({
      slug,
      userId,
      username,
      displayName,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }
  }

  const metric = (await BlogMetricModel.findOneAndUpdate(
    { slug },
    {
      $inc: {
        likeCount: 1,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  ).lean()) as BlogMetricDocument | null;

  return {
    available: true,
    likeCount: metric?.likeCount ?? 1,
    liked: true,
  };
}
