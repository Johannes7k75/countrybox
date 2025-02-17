CREATE TABLE `callingCodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`countryId` integer NOT NULL,
	FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `callingCodes_id_unique` ON `callingCodes` (`id`);--> statement-breakpoint
CREATE TABLE `countries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`capital` text NOT NULL,
	`independent` integer NOT NULL,
	`region` text NOT NULL,
	`subregion` text NOT NULL,
	`cca3` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `countries_id_unique` ON `countries` (`id`);--> statement-breakpoint
CREATE TABLE `gameRounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`answers` blob,
	FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gameRounds_id_unique` ON `gameRounds` (`id`);--> statement-breakpoint
CREATE TABLE `gameTypes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gameTypes_id_unique` ON `gameTypes` (`id`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`gameType` integer NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`rounds` integer DEFAULT 10 NOT NULL,
	`startedAt` integer DEFAULT '"2025-02-08T13:55:16.472Z"' NOT NULL,
	`finishedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`gameType`) REFERENCES `gameTypes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `games_id_unique` ON `games` (`id`);--> statement-breakpoint
CREATE TABLE `tld` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tld` text NOT NULL,
	`countryId` integer NOT NULL,
	FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tld_id_unique` ON `tld` (`id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`salt` text NOT NULL,
	`pwHash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_unique` ON `users` (`id`);