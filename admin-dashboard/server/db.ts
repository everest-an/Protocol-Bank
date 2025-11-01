import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

import { accounts, analyticsSnapshots, auditLogs, InsertAccount, InsertAuditLog, InsertTransaction, transactions } from "../drizzle/schema";
import { and, desc, gte, like, lte, or, sql } from "drizzle-orm";

// ==================== Transaction Queries ====================

export async function getTransactions(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return { transactions: [], total: 0 };

  const { page = 1, limit = 20, status, type, search, startDate, endDate } = params;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(transactions.status, status as any));
  if (type) conditions.push(eq(transactions.type, type as any));
  if (search) {
    conditions.push(
      or(
        like(transactions.txHash, `%${search}%`),
        like(transactions.fromAddress, `%${search}%`),
        like(transactions.toAddress, `%${search}%`)
      )!
    );
  }
  if (startDate) conditions.push(gte(transactions.createdAt, startDate));
  if (endDate) conditions.push(lte(transactions.createdAt, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [txList, countResult] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(whereClause),
  ]);

  return {
    transactions: txList,
    total: countResult[0]?.count || 0,
  };
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result[0];
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(transactions).values(data);
  return result;
}

export async function updateTransactionStatus(id: number, status: string, reviewedBy?: number, flaggedReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (reviewedBy) {
    updateData.reviewedBy = reviewedBy;
    updateData.reviewedAt = new Date();
  }

  if (flaggedReason) {
    updateData.flaggedReason = flaggedReason;
  }

  await db.update(transactions).set(updateData).where(eq(transactions.id, id));
}

// ==================== Account Queries ====================

export async function getAccounts(params: {
  page?: number;
  limit?: number;
  status?: string;
  kycStatus?: string;
  riskLevel?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return { accounts: [], total: 0 };

  const { page = 1, limit = 20, status, kycStatus, riskLevel, search } = params;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(accounts.status, status as any));
  if (kycStatus) conditions.push(eq(accounts.kycStatus, kycStatus as any));
  if (riskLevel) conditions.push(eq(accounts.riskLevel, riskLevel as any));
  if (search) {
    conditions.push(
      or(
        like(accounts.address, `%${search}%`),
        sql`${accounts.userId} = ${parseInt(search) || 0}`
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [accountList, countResult] = await Promise.all([
    db
      .select()
      .from(accounts)
      .where(whereClause)
      .orderBy(desc(accounts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(whereClause),
  ]);

  return {
    accounts: accountList,
    total: countResult[0]?.count || 0,
  };
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return result[0];
}

export async function getAccountByAddress(address: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(accounts).where(eq(accounts.address, address)).limit(1);
  return result[0];
}

export async function createAccount(data: InsertAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(accounts).values(data);
  return result;
}

export async function updateAccountStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(accounts).set({ status: status as any, updatedAt: new Date() }).where(eq(accounts.id, id));
}

// ==================== Audit Log Queries ====================

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  adminId?: number;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const { page = 1, limit = 50, adminId, entityType, startDate, endDate } = params;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (adminId) conditions.push(eq(auditLogs.adminId, adminId));
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (startDate) conditions.push(gte(auditLogs.createdAt, startDate));
  if (endDate) conditions.push(lte(auditLogs.createdAt, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [logList, countResult] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause),
  ]);

  return {
    logs: logList,
    total: countResult[0]?.count || 0,
  };
}

// ==================== Analytics Queries ====================

export async function getAnalyticsSnapshots(params: { startDate?: Date; endDate?: Date; limit?: number }) {
  const db = await getDb();
  if (!db) return [];

  const { startDate, endDate, limit = 30 } = params;

  const conditions = [];
  if (startDate) conditions.push(gte(analyticsSnapshots.date, startDate));
  if (endDate) conditions.push(lte(analyticsSnapshots.date, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select()
    .from(analyticsSnapshots)
    .where(whereClause)
    .orderBy(desc(analyticsSnapshots.date))
    .limit(limit);
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [txStats, accountStats, flaggedTx] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
        confirmed: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)`,
        failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
        flagged: sql<number>`sum(case when status = 'flagged' then 1 else 0 end)`,
      })
      .from(transactions),
    db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when status = 'active' then 1 else 0 end)`,
        frozen: sql<number>`sum(case when status = 'frozen' then 1 else 0 end)`,
        highRisk: sql<number>`sum(case when status = 'active' and riskLevel = 'high' then 1 else 0 end)`,
        mediumRisk: sql<number>`sum(case when status = 'active' and riskLevel = 'medium' then 1 else 0 end)`,
        lowRisk: sql<number>`sum(case when status = 'active' and riskLevel = 'low' then 1 else 0 end)`,
      })
      .from(accounts),
    db
      .select()
      .from(transactions)
      .where(eq(transactions.status, "flagged"))
      .orderBy(desc(transactions.createdAt))
      .limit(10),
  ]);

  return {
    transactions: txStats[0],
    accounts: accountStats[0],
    flaggedTransactions: flaggedTx,
  };
}

export async function getActiveAccountsByRisk(riskLevel?: string) {
  const db = await getDb();
  if (!db) return [];

  if (riskLevel && riskLevel !== "all") {
    return await db
      .select()
      .from(accounts)
      .where(and(
        eq(accounts.status, "active"),
        eq(accounts.riskLevel, riskLevel as any)
      ))
      .orderBy(desc(accounts.createdAt))
      .limit(20);
  }

  return await db
    .select()
    .from(accounts)
    .where(eq(accounts.status, "active"))
    .orderBy(desc(accounts.createdAt))
    .limit(20);
}
