CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`address` varchar(42) NOT NULL,
	`balance` varchar(78) NOT NULL DEFAULT '0',
	`currency` varchar(10) NOT NULL DEFAULT 'ETH',
	`accountType` enum('personal','business','escrow') NOT NULL DEFAULT 'personal',
	`status` enum('active','frozen','suspended','closed') NOT NULL DEFAULT 'active',
	`kycStatus` enum('pending','verified','rejected','none') NOT NULL DEFAULT 'none',
	`kycData` text,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_address_unique` UNIQUE(`address`)
);
--> statement-breakpoint
CREATE TABLE `analyticsSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`totalTransactions` int NOT NULL DEFAULT 0,
	`totalVolume` varchar(78) NOT NULL DEFAULT '0',
	`activeUsers` int NOT NULL DEFAULT 0,
	`flaggedTransactions` int NOT NULL DEFAULT 0,
	`averageTransactionValue` varchar(78) NOT NULL DEFAULT '0',
	`metrics` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`changes` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`txHash` varchar(66) NOT NULL,
	`fromAddress` varchar(42) NOT NULL,
	`toAddress` varchar(42) NOT NULL,
	`amount` varchar(78) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'ETH',
	`status` enum('pending','confirmed','failed','flagged') NOT NULL DEFAULT 'pending',
	`type` enum('deposit','withdrawal','transfer','payment') NOT NULL,
	`blockNumber` int,
	`gasUsed` varchar(78),
	`gasFee` varchar(78),
	`metadata` text,
	`riskScore` int DEFAULT 0,
	`flaggedReason` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_txHash_unique` UNIQUE(`txHash`)
);
