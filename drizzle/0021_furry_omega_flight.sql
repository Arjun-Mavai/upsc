CREATE TABLE `support_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`guest_id` text,
	`guest_name` text,
	`guest_phone` text,
	`language` text DEFAULT 'PENDING',
	`status` text DEFAULT 'open',
	`human_active` integer DEFAULT false,
	`unread_count` integer DEFAULT 0,
	`last_message_at` integer DEFAULT (strftime('%s', 'now')),
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_support_conv_guest_phone_upsc` ON `support_conversations` (`guest_phone`);--> statement-breakpoint
CREATE INDEX `idx_support_conv_last_msg_upsc` ON `support_conversations` (`last_message_at`);--> statement-breakpoint
CREATE TABLE `support_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender` text NOT NULL,
	`text` text NOT NULL,
	`media_url` text,
	`message_type` text DEFAULT 'text',
	`status` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`conversation_id`) REFERENCES `support_conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_support_msg_conv_id_upsc` ON `support_messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_support_msg_created_at_upsc` ON `support_messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
ALTER TABLE `mains_pyq_questions` ADD `current_affairs_data` text;--> statement-breakpoint
ALTER TABLE `syllabus_topics` ADD `current_affairs_data` text;