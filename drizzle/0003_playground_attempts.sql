CREATE TABLE `playground_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`scenario_id` text NOT NULL,
	`scenario_version` text NOT NULL,
	`mode` text NOT NULL,
	`seed` integer NOT NULL,
	`status` text NOT NULL,
	`score` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`cost_units` integer NOT NULL,
	`inputs_json` text NOT NULL,
	`evaluation_json` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`payload_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `playground_attempts_user_idempotency_unique` ON `playground_attempts` (`user_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `playground_attempts_user_created_idx` ON `playground_attempts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `playground_attempts_user_scenario_idx` ON `playground_attempts` (`user_id`,`scenario_id`);