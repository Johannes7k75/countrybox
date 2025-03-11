ALTER TABLE `games` RENAME COLUMN `gameType` TO `firstType`;--> statement-breakpoint
ALTER TABLE `games` DROP FOREIGN KEY `games_gameType_gameTypes_id_fk`;
--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `startedAt` datetime NOT NULL DEFAULT '2025-03-11 12:33:35.933';--> statement-breakpoint
ALTER TABLE `guessedFlags` MODIFY COLUMN `guessedAt` datetime DEFAULT '2025-03-11 12:33:35.933';--> statement-breakpoint
ALTER TABLE `games` ADD `secondType` int NOT NULL;--> statement-breakpoint
ALTER TABLE `guessedFlags` ADD `gameId` int;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_firstType_gameTypes_id_fk` FOREIGN KEY (`firstType`) REFERENCES `gameTypes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_secondType_gameTypes_id_fk` FOREIGN KEY (`secondType`) REFERENCES `gameTypes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guessedFlags` ADD CONSTRAINT `guessedFlags_gameId_games_id_fk` FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON DELETE no action ON UPDATE no action;