import type { ObjectId } from "mongodb";

export type LinkDoc = {
  _id?: ObjectId;
  code: string;
  url: string;
  createdAt: Date;
  lastCheckedAt: Date;
  failCount: number;
  clicks: number;
  lastClickedAt?: Date;
};

export type RateLimitDoc = {
  _id: string;
  count: number;
  expireAt: Date;
};
