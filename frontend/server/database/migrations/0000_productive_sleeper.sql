CREATE TABLE `boxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`countryId` int,
	`trainedAt` datetime,
	`phase` int NOT NULL DEFAULT 0,
	CONSTRAINT `boxes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`capital` varchar(255) NOT NULL,
	`independent` boolean NOT NULL,
	`region` varchar(255) NOT NULL,
	`subregion` varchar(255) NOT NULL,
	`cca3` varchar(3) NOT NULL,
	`cca2` varchar(2),
	`callingCode` varchar(10),
	CONSTRAINT `countries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameRounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`round` int NOT NULL DEFAULT 0,
	`answers` json,
	CONSTRAINT `gameRounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `gameTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameType` int NOT NULL,
	`round` int NOT NULL DEFAULT 0,
	`rounds` int NOT NULL DEFAULT 10,
	`startedAt` datetime NOT NULL DEFAULT '2025-02-17 19:17:07.633',
	`finishedAt` datetime,
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tld` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tld` varchar(10) NOT NULL,
	`countryId` int NOT NULL,
	CONSTRAINT `tld_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`hash` varchar(255) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boxes` ADD CONSTRAINT `boxes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boxes` ADD CONSTRAINT `boxes_countryId_countries_id_fk` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gameRounds` ADD CONSTRAINT `gameRounds_gameId_games_id_fk` FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_gameType_gameTypes_id_fk` FOREIGN KEY (`gameType`) REFERENCES `gameTypes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tld` ADD CONSTRAINT `tld_countryId_countries_id_fk` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE no action ON UPDATE no action;