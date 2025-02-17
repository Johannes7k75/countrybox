ALTER TABLE `countries` MODIFY COLUMN `cca2` varchar(2) NOT NULL;--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-02-17 19:17:26.516';