CREATE TABLE `geoJsonCache` (
	`countryId` int,
	`geoJson` json
);
--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-02-19 21:52:41.130';--> statement-breakpoint
ALTER TABLE `geoJsonCache` ADD CONSTRAINT `geoJsonCache_countryId_countries_id_fk` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE no action ON UPDATE no action;