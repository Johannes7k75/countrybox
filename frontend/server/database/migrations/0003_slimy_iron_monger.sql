ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-02-17 22:29:14.322';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `session` varchar(36);