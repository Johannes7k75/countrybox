ALTER TABLE `users` RENAME COLUMN `hash` TO `password`;--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-02-25 19:10:35.597';--> statement-breakpoint
ALTER TABLE `users` ADD `roles` json;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `session`;