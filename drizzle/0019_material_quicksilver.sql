ALTER TABLE `free_quiz_attempts` ADD `exam_type` text DEFAULT 'mppsc' NOT NULL;--> statement-breakpoint
ALTER TABLE `guests` ADD `exam_type` text DEFAULT 'mppsc' NOT NULL;--> statement-breakpoint
ALTER TABLE `test_feedback` ADD `exam_type` text DEFAULT 'mppsc' NOT NULL;