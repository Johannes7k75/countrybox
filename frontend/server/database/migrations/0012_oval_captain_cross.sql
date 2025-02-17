PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_countries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`capital` text NOT NULL,
	`independent` integer NOT NULL,
	`region` text NOT NULL,
	`subregion` text NOT NULL,
	`cca3` text NOT NULL,
	`cca2` text,
	`callingCode` text
);
--> statement-breakpoint
INSERT INTO `__new_countries`("id", "name", "capital", "independent", "region", "subregion", "cca3", "cca2", "callingCode") SELECT "id", "name", "capital", "independent", "region", "subregion", "cca3", "cca2", "callingCode" FROM `countries`;--> statement-breakpoint
DROP TABLE `countries`;--> statement-breakpoint
ALTER TABLE `__new_countries` RENAME TO `countries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `countries_id_unique` ON `countries` (`id`);--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`gameType` integer NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`rounds` integer DEFAULT 10 NOT NULL,
	`startedAt` integer DEFAULT '"2025-02-12T20:01:49.118Z"' NOT NULL,
	`finishedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`gameType`) REFERENCES `gameTypes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games`("id", "userId", "gameType", "round", "rounds", "startedAt", "finishedAt") SELECT "id", "userId", "gameType", "round", "rounds", "startedAt", "finishedAt" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;--> statement-breakpoint
CREATE UNIQUE INDEX `games_id_unique` ON `games` (`id`);