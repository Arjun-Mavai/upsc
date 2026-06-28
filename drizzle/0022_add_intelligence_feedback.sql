CREATE TABLE `intelligence_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text,
	`question_id` text NOT NULL,
	`question_text` text,
	`test_id` text,
	`reaction` text NOT NULL,
	`message` text,
	`is_pro` integer DEFAULT false,
	`source` text,
	`user_id` text,
	`user_name` text,
	`user_mobile` text,
	`user_email` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`exam_type` text DEFAULT 'upsc' NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `guests` ADD `lead_source` text;