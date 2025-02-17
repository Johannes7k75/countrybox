ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-02-17 22:11:32.793';--> statement-breakpoint
ALTER TABLE `users` ADD `session` varchar(32);