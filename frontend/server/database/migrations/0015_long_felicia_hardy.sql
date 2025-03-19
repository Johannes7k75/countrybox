CREATE TABLE `geoJson` (
	`countryCode` varchar(2),
	`geoJson` json
);
--> statement-breakpoint
DROP TABLE `geoJsonCache`;--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-03-18 12:40:31.873';--> statement-breakpoint
ALTER TABLE `guessedFlags` MODIFY COLUMN `guessedAt` datetime DEFAULT '2025-03-18 12:40:31.874';--> statement-breakpoint
ALTER TABLE `geoJson` ADD CONSTRAINT `geoJson_countryCode_countries_cca2_fk` FOREIGN KEY (`countryCode`) REFERENCES `countries`(`cca2`) ON DELETE no action ON UPDATE no action;