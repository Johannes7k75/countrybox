PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_boxes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`countryId` integer,
	`phase` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_boxes`("id", "userId", "countryId", "phase") SELECT "id", "userId", "countryId", "phase" FROM `boxes`;--> statement-breakpoint
DROP TABLE `boxes`;--> statement-breakpoint
ALTER TABLE `__new_boxes` RENAME TO `boxes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `boxes_id_unique` ON `boxes` (`id`);--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`gameType` integer NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`rounds` integer DEFAULT 10 NOT NULL,
	`startedAt` integer DEFAULT '"2025-02-09T00:29:40.018Z"' NOT NULL,
	`finishedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`gameType`) REFERENCES `gameTypes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games`("id", "userId", "gameType", "round", "rounds", "startedAt", "finishedAt") SELECT "id", "userId", "gameType", "round", "rounds", "startedAt", "finishedAt" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;--> statement-breakpoint
CREATE UNIQUE INDEX `games_id_unique` ON `games` (`id`);