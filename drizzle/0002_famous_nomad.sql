CREATE TABLE `learner_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`goal` text DEFAULT 'professional' NOT NULL,
	`weekly_target_minutes` integer DEFAULT 300 NOT NULL,
	`cloud` text DEFAULT 'multicloud' NOT NULL,
	`onboarding_completed_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
