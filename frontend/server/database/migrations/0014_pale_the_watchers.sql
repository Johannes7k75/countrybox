ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-03-18 12:38:32.474';--> statement-breakpoint
ALTER TABLE `guessedFlags` MODIFY COLUMN `guessedAt` datetime DEFAULT '2025-03-18 12:38:32.475';--> statement-breakpoint
ALTER TABLE `countries` ADD CONSTRAINT `countries_cca3_unique` UNIQUE(`cca3`);--> statement-breakpoint
ALTER TABLE `countries` ADD CONSTRAINT `countries_cca2_unique` UNIQUE(`cca2`);