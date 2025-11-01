import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Starting database seeding...");

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });

  // Generate random addresses
  const generateAddress = () => {
    return "0x" + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  };

  const generateTxHash = () => {
    return "0x" + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  };

  try {
    // Seed Accounts
    console.log("📊 Seeding accounts...");
    const accountStatuses = ["active", "frozen", "suspended", "closed"];
    const kycStatuses = ["verified", "pending", "rejected", "not_started"];
    const riskLevels = ["low", "medium", "high"];
    const accountTypes = ["personal", "business", "escrow"];

    const accounts = [];
    for (let i = 1; i <= 50; i++) {
      accounts.push({
        userId: i,
        address: generateAddress(),
        balance: (Math.random() * 10000).toFixed(4),
        currency: "ETH",
        accountType: accountTypes[Math.floor(Math.random() * accountTypes.length)],
        status: accountStatuses[Math.floor(Math.random() * accountStatuses.length)],
        kycStatus: kycStatuses[Math.floor(Math.random() * kycStatuses.length)],
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        lastActivityAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    await db.insert(schema.accounts).values(accounts);
    console.log(`✅ Created ${accounts.length} accounts`);

    // Seed Transactions
    console.log("💸 Seeding transactions...");
    const txStatuses = ["pending", "confirmed", "failed", "flagged"];
    const txTypes = ["deposit", "withdrawal", "transfer", "payment"];

    const transactions = [];
    for (let i = 1; i <= 200; i++) {
      const status = txStatuses[Math.floor(Math.random() * txStatuses.length)];
      const riskScore = Math.floor(Math.random() * 100);
      const fromAccount = accounts[Math.floor(Math.random() * accounts.length)];
      const toAccount = accounts[Math.floor(Math.random() * accounts.length)];

      transactions.push({
        txHash: generateTxHash(),
        fromAddress: fromAccount.address,
        toAddress: toAccount.address,
        amount: (Math.random() * 100).toFixed(4),
        currency: "ETH",
        type: txTypes[Math.floor(Math.random() * txTypes.length)],
        status: status,
        blockNumber: Math.floor(Math.random() * 1000000) + 10000000,
        gasUsed: (Math.random() * 0.01).toFixed(6),
        gasFee: (Math.random() * 0.001).toFixed(6),
        riskScore: riskScore,
        flaggedReason: status === "flagged" ? "High risk score detected" : null,
        reviewedBy: status === "flagged" ? 1 : null,
        reviewedAt: status === "flagged" ? new Date() : null,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    await db.insert(schema.transactions).values(transactions);
    console.log(`✅ Created ${transactions.length} transactions`);

    // Seed Analytics Snapshots
    console.log("📈 Seeding analytics snapshots...");
    const snapshots = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      snapshots.push({
        date: date,
        totalTransactions: Math.floor(Math.random() * 100) + 50,
        totalVolume: (Math.random() * 10000).toFixed(4),
        activeAccounts: Math.floor(Math.random() * 50) + 20,
        newAccounts: Math.floor(Math.random() * 10) + 1,
        flaggedTransactions: Math.floor(Math.random() * 5),
        averageTransactionValue: (Math.random() * 100).toFixed(4),
        currency: "ETH",
      });
    }

    await db.insert(schema.analyticsSnapshots).values(snapshots);
    console.log(`✅ Created ${snapshots.length} analytics snapshots`);

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
