ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-03-10 09:56:00.897';--> statement-breakpoint
ALTER TABLE `countries` ADD `unMember` boolean DEFAULT false NOT NULL;