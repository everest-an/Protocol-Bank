import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Transactions table - stores all transaction records
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  txHash: varchar("txHash", { length: 66 }).notNull().unique(),
  fromAddress: varchar("fromAddress", { length: 42 }).notNull(),
  toAddress: varchar("toAddress", { length: 42 }).notNull(),
  amount: varchar("amount", { length: 78 }).notNull(), // Store as string to avoid precision issues
  currency: varchar("currency", { length: 10 }).notNull().default("ETH"),
  status: mysqlEnum("status", ["pending", "confirmed", "failed", "flagged"]).default("pending").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "transfer", "payment"]).notNull(),
  blockNumber: int("blockNumber"),
  gasUsed: varchar("gasUsed", { length: 78 }),
  gasFee: varchar("gasFee", { length: 78 }),
  metadata: text("metadata"), // JSON string for additional data
  riskScore: int("riskScore").default(0), // 0-100, AI-generated risk score
  flaggedReason: text("flaggedReason"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Accounts table - stores user account balances and info
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  address: varchar("address", { length: 42 }).notNull().unique(),
  balance: varchar("balance", { length: 78 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("ETH"),
  accountType: mysqlEnum("accountType", ["personal", "business", "escrow"]).default("personal").notNull(),
  status: mysqlEnum("status", ["active", "frozen", "suspended", "closed"]).default("active").notNull(),
  kycStatus: mysqlEnum("kycStatus", ["pending", "verified", "rejected", "none"]).default("none").notNull(),
  kycData: text("kycData"), // JSON string for KYC information
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("low").notNull(),
  lastActivityAt: timestamp("lastActivityAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Audit logs table - tracks all admin actions
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(), // transaction, account, user
  entityId: int("entityId").notNull(),
  changes: text("changes"), // JSON string of before/after values
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Analytics snapshots table - stores daily aggregated statistics
 */
export const analyticsSnapshots = mysqlTable("analyticsSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  totalTransactions: int("totalTransactions").default(0).notNull(),
  totalVolume: varchar("totalVolume", { length: 78 }).default("0").notNull(),
  activeUsers: int("activeUsers").default(0).notNull(),
  flaggedTransactions: int("flaggedTransactions").default(0).notNull(),
  averageTransactionValue: varchar("averageTransactionValue", { length: 78 }).default("0").notNull(),
  metrics: text("metrics"), // JSON string for additional metrics
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;