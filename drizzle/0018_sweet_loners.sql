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
ALTER TABLE `content_blogs` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'mppsc';--> statement-breakpoint
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
ALTER TABLE `feedbacks` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'mppsc';--> statement-breakpoint
ALTER TABLE `mppsc_users` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'mppsc';--> statement-breakpoint
ALTER TABLE `payments` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'mppsc';--> statement-breakpoint
ALTER TABLE `questions` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'mppsc';--> statement-breakpoint
ALTER TABLE `tests` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'mppsc';--> statement-breakpoint
ALTER TABLE `user_attempts` ALTER COLUMN "exam_type" TO "exam_type" text NOT NULL DEFAULT 'mppsc';