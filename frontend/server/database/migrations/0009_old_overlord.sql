CREATE TABLE `guessedFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`correct` boolean NOT NULL DEFAULT true,
	`guessedAt` datetime DEFAULT '2025-03-10 13:14:10.783',
	CONSTRAINT `guessedFlags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-03-10 13:14:10.782';--> statement-breakpoint
ALTER TABLE `guessedFlags` ADD CONSTRAINT `guessedFlags_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;