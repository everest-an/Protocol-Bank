CREATE TABLE `batch_operation_locks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	`lastFailedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batch_operation_locks_id` PRIMARY KEY(`id`),
	CONSTRAINT `batch_operation_locks_userId_unique` UNIQUE(`userId`)
);
