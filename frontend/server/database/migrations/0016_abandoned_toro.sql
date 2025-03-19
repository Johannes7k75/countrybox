ALTER TABLE `boxes` RENAME COLUMN `countryId` TO `countryCode`;--> statement-breakpoint
ALTER TABLE `tld` RENAME COLUMN `countryId` TO `countryCode`;--> statement-breakpoint
ALTER TABLE `boxes` DROP FOREIGN KEY `boxes_countryId_countries_id_fk`;
--> statement-breakpoint
ALTER TABLE `tld` DROP FOREIGN KEY `tld_countryId_countries_id_fk`;
--> statement-breakpoint
ALTER TABLE `boxes` MODIFY COLUMN `countryCode` varchar(2);--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-03-18 12:49:33.672';--> statement-breakpoint
ALTER TABLE `guessedFlags` MODIFY COLUMN `guessedAt` datetime DEFAULT '2025-03-18 12:49:33.672';--> statement-breakpoint
ALTER TABLE `tld` MODIFY COLUMN `countryCode` varchar(2) NOT NULL;--> statement-breakpoint
ALTER TABLE `boxes` ADD CONSTRAINT `boxes_countryCode_countries_cca2_fk` FOREIGN KEY (`countryCode`) REFERENCES `countries`(`cca2`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tld` ADD CONSTRAINT `tld_countryCode_countries_cca2_fk` FOREIGN KEY (`countryCode`) REFERENCES `countries`(`cca2`) ON DELETE no action ON UPDATE no action;