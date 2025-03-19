ALTER TABLE `geoJsonCache` RENAME COLUMN `countryId` TO `countryCode`;--> statement-breakpoint
ALTER TABLE `geoJsonCache` DROP FOREIGN KEY `geoJsonCache_countryId_countries_id_fk`;
--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-03-18 12:37:59.342';--> statement-breakpoint
ALTER TABLE `geoJsonCache` MODIFY COLUMN `countryCode` varchar(2);--> statement-breakpoint
ALTER TABLE `guessedFlags` MODIFY COLUMN `guessedAt` datetime DEFAULT '2025-03-18 12:37:59.343';--> statement-breakpoint
ALTER TABLE `geoJsonCache` ADD CONSTRAINT `geoJsonCache_countryCode_countries_cca2_fk` FOREIGN KEY (`countryCode`) REFERENCES `countries`(`cca2`) ON DELETE no action ON UPDATE no action;