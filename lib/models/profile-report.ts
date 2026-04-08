import { model, models, Schema } from "mongoose";

const profileReportSchema = new Schema(
  {
    reportedUserId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    reportedUsername: {
      type: String,
      required: true,
      trim: true,
    },
    reportedDisplayName: {
      type: String,
      required: true,
      trim: true,
    },
    reportedSocialLinks: {
      steamHandle: {
        type: String,
        default: "",
        trim: true,
      },
      discordHandle: {
        type: String,
        default: "",
        trim: true,
      },
      xboxHandle: {
        type: String,
        default: "",
        trim: true,
      },
      playstationHandle: {
        type: String,
        default: "",
        trim: true,
      },
      twitchHandle: {
        type: String,
        default: "",
        trim: true,
      },
    },
    reporterUserId: {
      type: String,
      required: true,
      trim: true,
    },
    reporterUsername: {
      type: String,
      required: true,
      trim: true,
    },
    reporterDisplayName: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    readByUserId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

profileReportSchema.index({ isRead: 1, createdAt: -1 });
profileReportSchema.index(
  { reportedUserId: 1, reporterUserId: 1 },
  { unique: true },
);

export const ProfileReportModel =
  models.ProfileReport || model("ProfileReport", profileReportSchema);