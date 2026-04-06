ALTER TABLE `feedbacks` ADD `exam_type` text DEFAULT 'upsc' NOT NULL;--> statement-breakpoint
ALTER TABLE `mppsc_users` ADD `exam_type` text DEFAULT 'upsc' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `exam_type` text DEFAULT 'upsc' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `exam_type` text DEFAULT 'upsc' NOT NULL;--> statement-breakpoint
ALTER TABLE `tests` ADD `exam_type` text DEFAULT 'upsc' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_attempts` ADD `exam_type` text DEFAULT 'upsc' NOT NULL;