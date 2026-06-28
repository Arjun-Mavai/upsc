CREATE TABLE `mains_content` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text,
	`concept_hi` text NOT NULL,
	`concept_en` text NOT NULL,
	`expert_strategy_hi` text,
	`expert_strategy_en` text,
	`model_answers` text NOT NULL,
	`key_terms_hi` text,
	`key_terms_en` text,
	`practice_questions` text,
	`rich_payload` text,
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	`exam_type` text DEFAULT 'upsc' NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `mains_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mains_content_topic_id_unique` ON `mains_content` (`topic_id`);--> statement-breakpoint
CREATE TABLE `mains_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`topic_id` text,
	`type` text NOT NULL,
	`message` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`user_id`) REFERENCES `mppsc_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `mains_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mains_papers` (
	`id` text PRIMARY KEY NOT NULL,
	`paper_number` integer NOT NULL,
	`title_hi` text NOT NULL,
	`title_en` text NOT NULL,
	`total_marks` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`display_order` integer DEFAULT 0,
	`description` text,
	`exam_type` text DEFAULT 'upsc' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mains_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`topic_id` text,
	`status` text DEFAULT 'unseen',
	`last_reviewed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `mppsc_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `mains_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_mains_progress_user_topic` ON `mains_progress` (`user_id`,`topic_id`);--> statement-breakpoint
CREATE TABLE `mains_pyq_papers` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`exam_year` integer NOT NULL,
	`paper_number` integer NOT NULL,
	`exam_label` text,
	`title_hi` text,
	`title_en` text,
	`raw_json` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`is_hidden` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mains_pyq_papers_slug_unique` ON `mains_pyq_papers` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_mains_pyq_papers_year_paper` ON `mains_pyq_papers` (`exam_year`,`paper_number`);--> statement-breakpoint
CREATE TABLE `mains_pyq_prepared_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`pyq_question_id` text NOT NULL,
	`variant_slot` integer NOT NULL,
	`style_label` text,
	`style_label_hi` text,
	`structure_breakdown` text,
	`answer_hi` text NOT NULL,
	`answer_en` text,
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`pyq_question_id`) REFERENCES `mains_pyq_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_mains_pyq_prep_unique` ON `mains_pyq_prepared_variants` (`pyq_question_id`,`variant_slot`);--> statement-breakpoint
CREATE INDEX `idx_mains_pyq_prep_q` ON `mains_pyq_prepared_variants` (`pyq_question_id`);--> statement-breakpoint
CREATE TABLE `mains_pyq_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`paper_id` text NOT NULL,
	`part` text NOT NULL,
	`unit_number` integer NOT NULL,
	`unit_title_hi` text,
	`unit_title_en` text,
	`question_number` text NOT NULL,
	`marks` integer NOT NULL,
	`question_type` text NOT NULL,
	`question_hi` text NOT NULL,
	`question_en` text,
	`expert_insights_hi` text,
	`expert_insights_en` text,
	`display_order` integer DEFAULT 0,
	FOREIGN KEY (`paper_id`) REFERENCES `mains_pyq_papers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mains_pyq_q_paper` ON `mains_pyq_questions` (`paper_id`);--> statement-breakpoint
CREATE INDEX `idx_mains_pyq_q_unit` ON `mains_pyq_questions` (`paper_id`,`part`,`unit_number`);--> statement-breakpoint
CREATE TABLE `mains_topic_expected_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`marks` integer NOT NULL,
	`word_limit_hint` integer,
	`question_hi` text NOT NULL,
	`question_en` text,
	`sort_order` integer DEFAULT 0,
	`source_label` text DEFAULT 'expected',
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`exam_type` text DEFAULT 'upsc' NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `mains_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mains_expected_topic` ON `mains_topic_expected_questions` (`topic_id`);--> statement-breakpoint
CREATE INDEX `idx_mains_expected_marks` ON `mains_topic_expected_questions` (`topic_id`,`marks`);--> statement-breakpoint
CREATE TABLE `mains_topic_expected_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`expected_question_id` text NOT NULL,
	`variant_slot` integer NOT NULL,
	`style_label` text,
	`structure_breakdown` text,
	`answer_hi` text NOT NULL,
	`answer_en` text,
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`expected_question_id`) REFERENCES `mains_topic_expected_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_mains_expected_var_unique` ON `mains_topic_expected_variants` (`expected_question_id`,`variant_slot`);--> statement-breakpoint
CREATE TABLE `mains_topic_pyq_links` (
	`topic_id` text NOT NULL,
	`pyq_question_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	PRIMARY KEY(`topic_id`, `pyq_question_id`),
	FOREIGN KEY (`topic_id`) REFERENCES `mains_topics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pyq_question_id`) REFERENCES `mains_pyq_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mains_topic_pyq_q` ON `mains_topic_pyq_links` (`pyq_question_id`);--> statement-breakpoint
CREATE TABLE `mains_topic_theory_structured` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	`exam_type` text DEFAULT 'upsc' NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `mains_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mains_topic_theory_structured_topic_id_unique` ON `mains_topic_theory_structured` (`topic_id`);--> statement-breakpoint
CREATE INDEX `idx_mains_theory_topic` ON `mains_topic_theory_structured` (`topic_id`);--> statement-breakpoint
CREATE TABLE `mains_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text,
	`title_hi` text NOT NULL,
	`title_en` text NOT NULL,
	`display_order` integer DEFAULT 0,
	`status` text DEFAULT 'draft',
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`exam_type` text DEFAULT 'upsc' NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `mains_units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mains_topics_unit` ON `mains_topics` (`unit_id`);--> statement-breakpoint
CREATE TABLE `mains_units` (
	`id` text PRIMARY KEY NOT NULL,
	`paper_id` text,
	`part` text DEFAULT 'NONE',
	`unit_number` integer NOT NULL,
	`title_hi` text NOT NULL,
	`title_en` text NOT NULL,
	`display_order` integer DEFAULT 0,
	`exam_type` text DEFAULT 'upsc' NOT NULL,
	FOREIGN KEY (`paper_id`) REFERENCES `mains_papers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mains_units_paper` ON `mains_units` (`paper_id`);--> statement-breakpoint
CREATE INDEX `idx_mains_units_order` ON `mains_units` (`paper_id`,`part`,`unit_number`);--> statement-breakpoint
DROP INDEX "attempt_id_idx";--> statement-breakpoint
DROP INDEX "question_id_idx";--> statement-breakpoint
DROP INDEX "idx_attempt_question";--> statement-breakpoint
DROP INDEX "content_blogs_slug_unique";--> statement-breakpoint
DROP INDEX "idx_feedbacks_created_at";--> statement-breakpoint
DROP INDEX "idx_feedbacks_category";--> statement-breakpoint
DROP INDEX "idx_feedbacks_role";--> statement-breakpoint
DROP INDEX "idx_free_attempts_test";--> statement-breakpoint
DROP INDEX "idx_free_attempts_guest";--> statement-breakpoint
DROP INDEX "idx_guests_email";--> statement-breakpoint
DROP INDEX "idx_guests_mobile_unique";--> statement-breakpoint
DROP INDEX "mains_content_topic_id_unique";--> statement-breakpoint
DROP INDEX "idx_mains_progress_user_topic";--> statement-breakpoint
DROP INDEX "mains_pyq_papers_slug_unique";--> statement-breakpoint
DROP INDEX "idx_mains_pyq_papers_year_paper";--> statement-breakpoint
DROP INDEX "idx_mains_pyq_prep_unique";--> statement-breakpoint
DROP INDEX "idx_mains_pyq_prep_q";--> statement-breakpoint
DROP INDEX "idx_mains_pyq_q_paper";--> statement-breakpoint
DROP INDEX "idx_mains_pyq_q_unit";--> statement-breakpoint
DROP INDEX "idx_mains_expected_topic";--> statement-breakpoint
DROP INDEX "idx_mains_expected_marks";--> statement-breakpoint
DROP INDEX "idx_mains_expected_var_unique";--> statement-breakpoint
DROP INDEX "idx_mains_topic_pyq_q";--> statement-breakpoint
DROP INDEX "mains_topic_theory_structured_topic_id_unique";--> statement-breakpoint
DROP INDEX "idx_mains_theory_topic";--> statement-breakpoint
DROP INDEX "idx_mains_topics_unit";--> statement-breakpoint
DROP INDEX "idx_mains_units_paper";--> statement-breakpoint
DROP INDEX "idx_mains_units_order";--> statement-breakpoint
DROP INDEX "idx_activities_user_id";--> statement-breakpoint
DROP INDEX "idx_activities_action";--> statement-breakpoint
DROP INDEX "idx_activities_created_at";--> statement-breakpoint
DROP INDEX "mppsc_users_email_unique";--> statement-breakpoint
DROP INDEX "idx_users_email";--> statement-breakpoint
DROP INDEX "payments_payment_id_unique";--> statement-breakpoint
DROP INDEX "idx_payments_order_id";--> statement-breakpoint
DROP INDEX "idx_payments_user_id";--> statement-breakpoint
DROP INDEX "idx_payments_status";--> statement-breakpoint
DROP INDEX "idx_payments_payment_id";--> statement-breakpoint
DROP INDEX "idx_pyq_jobs_status_created";--> statement-breakpoint
DROP INDEX "idx_fact_topic_status";--> statement-breakpoint
DROP INDEX "idx_fact_subject_status";--> statement-breakpoint
DROP INDEX "idx_fact_importance";--> statement-breakpoint
DROP INDEX "pyq_qt_question_topic_unique";--> statement-breakpoint
DROP INDEX "idx_pyq_qt_topic";--> statement-breakpoint
DROP INDEX "idx_pyq_qt_question";--> statement-breakpoint
DROP INDEX "idx_pyq_qt_primary";--> statement-breakpoint
DROP INDEX "idx_pyq_repeated_cluster";--> statement-breakpoint
DROP INDEX "idx_pyq_repeated_unit";--> statement-breakpoint
DROP INDEX "idx_pyq_repeated_count";--> statement-breakpoint
DROP INDEX "pyq_trends_topic_year_unique";--> statement-breakpoint
DROP INDEX "idx_trends_subject_year";--> statement-breakpoint
DROP INDEX "idx_trends_topic_year";--> statement-breakpoint
DROP INDEX "pyq_topics_topic_slug_unique";--> statement-breakpoint
DROP INDEX "idx_pyq_topics_subject";--> statement-breakpoint
DROP INDEX "pyq_unit_cache_year_unit_unique";--> statement-breakpoint
DROP INDEX "idx_pyq_unit_cache_year";--> statement-breakpoint
DROP INDEX "idx_questions_subject";--> statement-breakpoint
DROP INDEX "unit_order_idx";--> statement-breakpoint
DROP INDEX "test_score_idx";--> statement-breakpoint
DROP INDEX "idx_leaderboard_ranking";--> statement-breakpoint
DROP INDEX "tests_slug_unique";--> statement-breakpoint
DROP INDEX "idx_tests_slug";--> statement-breakpoint
DROP INDEX "idx_tests_type_ispro";--> statement-breakpoint
DROP INDEX "user_id_idx";--> statement-breakpoint
DROP INDEX "test_id_idx";--> statement-breakpoint
DROP INDEX "user_test_idx";--> statement-breakpoint
DROP INDEX "completed_idx";--> statement-breakpoint
DROP INDEX "idx_user_test_completed";--> statement-breakpoint
DROP INDEX "idx_attempts_by_date";--> statement-breakpoint
DROP INDEX "idx_user_attempts_completion_score";--> statement-breakpoint
DROP INDEX "idx_verification_tokens_identifier";--> statement-breakpoint
DROP INDEX "idx_verification_tokens_token";--> statement-breakpoint
ALTER TABLE `content_blogs` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
CREATE INDEX `attempt_id_idx` ON `attempt_answers` (`attempt_id`);--> statement-breakpoint
CREATE INDEX `question_id_idx` ON `attempt_answers` (`question_id`);--> statement-breakpoint
CREATE INDEX `idx_attempt_question` ON `attempt_answers` (`attempt_id`,`question_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `content_blogs_slug_unique` ON `content_blogs` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_feedbacks_created_at` ON `feedbacks` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_feedbacks_category` ON `feedbacks` (`category`);--> statement-breakpoint
CREATE INDEX `idx_feedbacks_role` ON `feedbacks` (`role`);--> statement-breakpoint
CREATE INDEX `idx_free_attempts_test` ON `free_quiz_attempts` (`test_id`);--> statement-breakpoint
CREATE INDEX `idx_free_attempts_guest` ON `free_quiz_attempts` (`guest_id`);--> statement-breakpoint
CREATE INDEX `idx_guests_email` ON `guests` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_guests_mobile_unique` ON `guests` (`mobile`);--> statement-breakpoint
CREATE INDEX `idx_activities_user_id` ON `mppsc_user_activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_activities_action` ON `mppsc_user_activities` (`action`);--> statement-breakpoint
CREATE INDEX `idx_activities_created_at` ON `mppsc_user_activities` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `mppsc_users_email_unique` ON `mppsc_users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `mppsc_users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_payment_id_unique` ON `payments` (`payment_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_order_id` ON `payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_user_id` ON `payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_payments_payment_id` ON `payments` (`payment_id`);--> statement-breakpoint
CREATE INDEX `idx_pyq_jobs_status_created` ON `pyq_content_import_jobs` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_fact_topic_status` ON `pyq_fact_bank` (`topic_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_fact_subject_status` ON `pyq_fact_bank` (`subject`,`status`);--> statement-breakpoint
CREATE INDEX `idx_fact_importance` ON `pyq_fact_bank` (`status`,`importance_score`);--> statement-breakpoint
CREATE UNIQUE INDEX `pyq_qt_question_topic_unique` ON `pyq_question_topics` (`question_id`,`topic_id`);--> statement-breakpoint
CREATE INDEX `idx_pyq_qt_topic` ON `pyq_question_topics` (`topic_id`);--> statement-breakpoint
CREATE INDEX `idx_pyq_qt_question` ON `pyq_question_topics` (`question_id`);--> statement-breakpoint
CREATE INDEX `idx_pyq_qt_primary` ON `pyq_question_topics` (`topic_id`,`is_primary`);--> statement-breakpoint
CREATE INDEX `idx_pyq_repeated_cluster` ON `pyq_repeated_cache` (`cluster_id`);--> statement-breakpoint
CREATE INDEX `idx_pyq_repeated_unit` ON `pyq_repeated_cache` (`unit_id`);--> statement-breakpoint
CREATE INDEX `idx_pyq_repeated_count` ON `pyq_repeated_cache` (`repeat_count`);--> statement-breakpoint
CREATE UNIQUE INDEX `pyq_trends_topic_year_unique` ON `pyq_topic_trends` (`topic_id`,`year`);--> statement-breakpoint
CREATE INDEX `idx_trends_subject_year` ON `pyq_topic_trends` (`subject`,`year`);--> statement-breakpoint
CREATE INDEX `idx_trends_topic_year` ON `pyq_topic_trends` (`topic_id`,`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `pyq_topics_topic_slug_unique` ON `pyq_topics` (`topic_slug`);--> statement-breakpoint
CREATE INDEX `idx_pyq_topics_subject` ON `pyq_topics` (`subject`,`is_active`);--> statement-breakpoint
CREATE UNIQUE INDEX `pyq_unit_cache_year_unit_unique` ON `pyq_unit_cache` (`year`,`unit_id`);--> statement-breakpoint
CREATE INDEX `idx_pyq_unit_cache_year` ON `pyq_unit_cache` (`year`);--> statement-breakpoint
CREATE INDEX `idx_questions_subject` ON `questions` (`test_id`,`subject`);--> statement-breakpoint
CREATE INDEX `unit_order_idx` ON `syllabus_topics` (`unit_id`,`order`);--> statement-breakpoint
CREATE INDEX `test_score_idx` ON `test_leaderboard` (`test_id`,`score`);--> statement-breakpoint
CREATE INDEX `idx_leaderboard_ranking` ON `test_leaderboard` (`test_id`,`score`,`time_taken_seconds`);--> statement-breakpoint
CREATE UNIQUE INDEX `tests_slug_unique` ON `tests` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_tests_slug` ON `tests` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_tests_type_ispro` ON `tests` (`type`,`is_pro`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `user_attempts` (`user_id`);--> statement-breakpoint
CREATE INDEX `test_id_idx` ON `user_attempts` (`test_id`);--> statement-breakpoint
CREATE INDEX `user_test_idx` ON `user_attempts` (`user_id`,`test_id`);--> statement-breakpoint
CREATE INDEX `completed_idx` ON `user_attempts` (`is_completed`,`end_time`);--> statement-breakpoint
CREATE INDEX `idx_user_test_completed` ON `user_attempts` (`user_id`,`test_id`,`is_completed`,`end_time`);--> statement-breakpoint
CREATE INDEX `idx_attempts_by_date` ON `user_attempts` (`user_id`,`end_time`);--> statement-breakpoint
CREATE INDEX `idx_user_attempts_completion_score` ON `user_attempts` (`user_id`,`is_completed`,`score`);--> statement-breakpoint
CREATE INDEX `idx_verification_tokens_identifier` ON `verification_tokens` (`identifier`);--> statement-breakpoint
CREATE INDEX `idx_verification_tokens_token` ON `verification_tokens` (`token`);--> statement-breakpoint
ALTER TABLE `feedbacks` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
ALTER TABLE `free_quiz_attempts` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
ALTER TABLE `guests` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
ALTER TABLE `mppsc_users` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
ALTER TABLE `mppsc_users` ADD `access_grants` text DEFAULT '["upsc_pre"]';--> statement-breakpoint
ALTER TABLE `mppsc_users` ADD `session_version` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `payments` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_pricing_config` (
	`exam_type` text PRIMARY KEY NOT NULL,
	`lite_price` integer DEFAULT 99,
	`lite_original_price` integer DEFAULT 299,
	`lite_validity_text` text DEFAULT 'Valid till Exam',
	`lite_months` integer DEFAULT 8,
	`pro_price` integer DEFAULT 299,
	`pro_original_price` integer DEFAULT 999,
	`pro_validity_text` text DEFAULT 'Valid for 1 Year',
	`pro_months` integer DEFAULT 12,
	`upgrade_price` integer DEFAULT 199,
	`upgrade_original_price` integer DEFAULT 299,
	`urgency_text` text DEFAULT 'Special Offer',
	`urgency_text_hi` text DEFAULT 'विशेष ऑफर',
	`students_bought` integer DEFAULT 23,
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
INSERT INTO `__new_pricing_config`("exam_type", "lite_price", "lite_original_price", "lite_validity_text", "lite_months", "pro_price", "pro_original_price", "pro_validity_text", "pro_months", "upgrade_price", "upgrade_original_price", "urgency_text", "urgency_text_hi", "students_bought", "updated_at") SELECT "exam_type", "lite_price", "lite_original_price", "lite_validity_text", "lite_months", "pro_price", "pro_original_price", "pro_validity_text", "pro_months", "upgrade_price", "upgrade_original_price", "urgency_text", "urgency_text_hi", "students_bought", "updated_at" FROM `pricing_config`;--> statement-breakpoint
DROP TABLE `pricing_config`;--> statement-breakpoint
ALTER TABLE `__new_pricing_config` RENAME TO `pricing_config`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `questions` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
ALTER TABLE `test_feedback` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
ALTER TABLE `tests` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
ALTER TABLE `user_attempts` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'upsc';--> statement-breakpoint
ALTER TABLE `payment_exit_reasons` ADD `exam_type` text DEFAULT 'upsc' NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `exam_type` text DEFAULT 'upsc' NOT NULL;--> statement-breakpoint
ALTER TABLE `syllabus_topics` ADD `exam_type` text DEFAULT 'upsc' NOT NULL;