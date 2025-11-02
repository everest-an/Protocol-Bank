CREATE TABLE `operationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`operationType` varchar(50) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`affectedIds` text NOT NULL,
	`previousState` text NOT NULL,
	`newState` text NOT NULL,
	`canUndo` int NOT NULL DEFAULT 1,
	`undoneAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operationHistory_id` PRIMARY KEY(`id`)
);
