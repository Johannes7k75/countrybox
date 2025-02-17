PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`gameType` integer NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`rounds` integer DEFAULT 10 NOT NULL,
	`startedAt` integer DEFAULT '"2025-02-10T13:09:51.072Z"' NOT NULL,
	`finishedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`gameType`) REFERENCES `gameTypes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games`("id", "userId", "gameType", "round", "rounds", "startedAt", "finishedAt") SELECT "id", "userId", "gameType", "round", "rounds", "startedAt", "finishedAt" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `games_id_unique` ON `games` (`id`);