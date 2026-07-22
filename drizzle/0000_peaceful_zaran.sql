CREATE TABLE `assessment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`assignment_id` text,
	`assessment_id` text NOT NULL,
	`module_id` text,
	`kind` text NOT NULL,
	`assessment_version` text NOT NULL,
	`seed` text,
	`timing_mode` text DEFAULT 'untimed' NOT NULL,
	`duration_seconds` integer,
	`expires_at` text,
	`provenance` text DEFAULT 'server_graded' NOT NULL,
	`public_payload_json` text DEFAULT '{}' NOT NULL,
	`answer_key_json` text DEFAULT '{}' NOT NULL,
	`selections_json` text DEFAULT '{}' NOT NULL,
	`domain_breakdown_json` text,
	`status` text DEFAULT 'started' NOT NULL,
	`score` integer,
	`max_score` integer,
	`percent` integer,
	`passed` integer,
	`idempotency_key` text NOT NULL,
	`started_at` text NOT NULL,
	`submitted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_attempts_idempotency_unique` ON `assessment_attempts` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `assessment_attempts_user_assessment_idx` ON `assessment_attempts` (`user_id`,`assessment_id`,`submitted_at`);--> statement-breakpoint
CREATE TABLE `assessment_responses` (
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`selected_option_id` text NOT NULL,
	`correct` integer NOT NULL,
	`objective_id` text,
	PRIMARY KEY(`attempt_id`, `question_id`),
	FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessment_responses_objective_idx` ON `assessment_responses` (`objective_id`,`correct`);--> statement-breakpoint
CREATE TABLE `assignment_cohorts` (
	`assignment_id` text NOT NULL,
	`cohort_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`assignment_id`, `cohort_id`),
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assignment_users` (
	`assignment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`assignment_id`, `user_id`),
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assignment_users_user_idx` ON `assignment_users` (`user_id`);--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`auto_enroll` integer DEFAULT false NOT NULL,
	`default_duration_days` integer DEFAULT 140 NOT NULL,
	`starts_at` text,
	`due_at` text,
	`completion_policy_json` text NOT NULL,
	`created_by_user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `curriculum_versions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `assignments_org_status_idx` ON `assignments` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `assignments_curriculum_idx` ON `assignments` (`curriculum_version_id`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text,
	`payload_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_events_org_created_idx` ON `audit_events` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_events_target_idx` ON `audit_events` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `cohort_managers` (
	`cohort_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`cohort_id`, `user_id`),
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cohort_managers_user_idx` ON `cohort_managers` (`user_id`);--> statement-breakpoint
CREATE TABLE `cohort_members` (
	`cohort_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`removed_at` text,
	PRIMARY KEY(`cohort_id`, `user_id`),
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cohort_members_user_idx` ON `cohort_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`starts_on` text,
	`ends_on` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cohorts_org_slug_unique` ON `cohorts` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `cohorts_org_status_idx` ON `cohorts` (`organization_id`,`status`);--> statement-breakpoint
CREATE TABLE `credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`assignment_id` text NOT NULL,
	`status` text DEFAULT 'issued' NOT NULL,
	`title` text NOT NULL,
	`certificate_number` text NOT NULL,
	`content_version` text NOT NULL,
	`criteria_json` text NOT NULL,
	`verification_code` text NOT NULL,
	`issued_at` text NOT NULL,
	`revoked_at` text,
	`revoked_by_user_id` text,
	`revocation_reason` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`revoked_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credentials_assignment_user_unique` ON `credentials` (`assignment_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `credentials_number_unique` ON `credentials` (`certificate_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `credentials_verification_unique` ON `credentials` (`verification_code`);--> statement-breakpoint
CREATE TABLE `curriculum_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`learning_path_id` text NOT NULL,
	`version` text NOT NULL,
	`manifest_hash` text NOT NULL,
	`manifest_json` text NOT NULL,
	`completion_policy_json` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `curriculum_versions_path_version_unique` ON `curriculum_versions` (`learning_path_id`,`version`);--> statement-breakpoint
CREATE INDEX `curriculum_versions_status_idx` ON `curriculum_versions` (`status`);--> statement-breakpoint
CREATE TABLE `earned_rewards` (
	`user_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`reward_id` text NOT NULL,
	`reward_type` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`earned_at` text NOT NULL,
	`source` text DEFAULT 'native' NOT NULL,
	PRIMARY KEY(`user_id`, `curriculum_version_id`, `reward_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gamification_summaries` (
	`user_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`streak_days` integer DEFAULT 0 NOT NULL,
	`last_study_on` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `curriculum_version_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lab_attestations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`assignment_id` text,
	`lab_id` text NOT NULL,
	`status` text DEFAULT 'self_attested' NOT NULL,
	`checks_json` text DEFAULT '[]' NOT NULL,
	`idempotency_key` text NOT NULL,
	`attested_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lab_attestations_idempotency_unique` ON `lab_attestations` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `lab_attestations_user_lab_idx` ON `lab_attestations` (`user_id`,`curriculum_version_id`,`lab_id`);--> statement-breakpoint
CREATE TABLE `learner_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`assigned_at` text NOT NULL,
	`due_at` text NOT NULL,
	`started_at` text,
	`completed_at` text,
	`waived_at` text,
	`waiver_reason` text,
	`progress_revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_assignments_assignment_user_unique` ON `learner_assignments` (`assignment_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `learner_assignments_user_status_idx` ON `learner_assignments` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `learner_assignments_assignment_status_idx` ON `learner_assignments` (`assignment_id`,`status`);--> statement-breakpoint
CREATE INDEX `learner_assignments_due_idx` ON `learner_assignments` (`due_at`,`status`);--> statement-breakpoint
CREATE TABLE `learning_events` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`assignment_id` text,
	`type` text NOT NULL,
	`object_type` text NOT NULL,
	`object_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`payload_hash` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`occurred_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_events_idempotency_unique` ON `learning_events` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `learning_events_user_occurred_idx` ON `learning_events` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `learning_events_assignment_occurred_idx` ON `learning_events` (`assignment_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_paths_org_slug_unique` ON `learning_paths` (`organization_id`,`slug`);--> statement-breakpoint
CREATE TABLE `legacy_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`client_mutation_id` text NOT NULL,
	`payload_hash` text NOT NULL,
	`imported_at` text NOT NULL,
	`requires_professional_revalidation` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legacy_imports_user_curriculum_unique` ON `legacy_imports` (`user_id`,`curriculum_version_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `legacy_imports_mutation_unique` ON `legacy_imports` (`client_mutation_id`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`user_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`module_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`completed_at` text,
	`source` text DEFAULT 'native' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `curriculum_version_id`, `lesson_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_progress_curriculum_status_idx` ON `lesson_progress` (`curriculum_version_id`,`status`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`assignment_id` text,
	`kind` text NOT NULL,
	`status` text DEFAULT 'unread' NOT NULL,
	`dedupe_key` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`action_href` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`read_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_dedupe_unique` ON `notifications` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `notifications_user_status_idx` ON `notifications` (`user_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `organization_branding` (
	`organization_id` text PRIMARY KEY NOT NULL,
	`organization_name` text NOT NULL,
	`product_name` text NOT NULL,
	`logo_url` text,
	`logo_alt` text,
	`primary_color` text NOT NULL,
	`accent_color` text NOT NULL,
	`support_url` text,
	`privacy_url` text,
	`updated_by_user_id` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `organization_memberships` (
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`organization_id`, `user_id`),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `organization_memberships_user_idx` ON `organization_memberships` (`user_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`timezone` text DEFAULT 'Europe/Madrid' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `privacy_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`subject_user_id` text NOT NULL,
	`requested_by_user_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`requested_at` text NOT NULL,
	`completed_at` text,
	`resolution_note` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requested_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `privacy_requests_org_status_idx` ON `privacy_requests` (`organization_id`,`status`,`requested_at`);--> statement-breakpoint
CREATE TABLE `progress_snapshots` (
	`assignment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content_version` text NOT NULL,
	`completed_modules` integer NOT NULL,
	`total_modules` integer NOT NULL,
	`completed_lessons` integer NOT NULL,
	`total_lessons` integer NOT NULL,
	`labs_passed` integer NOT NULL,
	`quiz_average_percent` integer NOT NULL,
	`progress_percent` integer NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`payload_hash` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`captured_at` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`assignment_id`, `user_id`),
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `progress_snapshots_assignment_progress_idx` ON `progress_snapshots` (`assignment_id`,`progress_percent`);--> statement-breakpoint
CREATE TABLE `review_schedules` (
	`user_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`module_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`due_on` text NOT NULL,
	`interval_days` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_rating` text NOT NULL,
	`last_reviewed_on` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `curriculum_version_id`, `lesson_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_schedules_user_due_idx` ON `review_schedules` (`user_id`,`due_on`);--> statement-breakpoint
CREATE TABLE `role_grants` (
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`granted_by_user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`organization_id`, `user_id`, `role`),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `role_grants_user_idx` ON `role_grants` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email_normalized` text NOT NULL,
	`display_name` text NOT NULL,
	`locale` text DEFAULT 'es' NOT NULL,
	`timezone` text DEFAULT 'Europe/Madrid' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text NOT NULL,
	`last_activity_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_normalized_unique` ON `users` (`email_normalized`);