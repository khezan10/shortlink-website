export const siteConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://mzg.my.id",
  deadStrikes: Number(process.env.DEAD_LINK_STRIKES || 2),
  minRecheckHours: Number(process.env.MIN_RECHECK_HOURS || 6),
  /** Link tanpa klik selama N hari dihapus dari database. */
  inactivePurgeDays: Number(process.env.INACTIVE_PURGE_DAYS || 7),
};
