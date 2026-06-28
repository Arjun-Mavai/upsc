import { sqliteTable, text, integer, real, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// MPPSC Users Table
export const mppscUsers = sqliteTable(
  'mppsc_users',
  {
    id: text('id').primaryKey(), // UUID handled in application logic
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    email: text('email').unique().notNull(),
    password: text('password').notNull(),
    name: text('name'),
    isSubscribed: integer('is_subscribed', { mode: 'boolean' }).default(false),
    planTier: text('plan_tier', { enum: ['free', 'lite', 'pro'] }).default('free'),
    role: text('role').default('guest'), // 'guest' | 'admin'
    adminSecret: text('admin_secret'), // Secure key for admin operations (nullable)
    deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete support
    // Active flag — admin toggle. Inactive = can't login. Default ON.
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    // ── New Fields ────────────────────────────────────────────────
    // Access expiry — after this timestamp, user can't access content
    // Default: 6 months from creation. Admin can extend per user.
    accessExpiresAt: integer('access_expires_at', { mode: 'timestamp' }),
    // Phone number — optional, for contact
    phone: text('phone'),
    category: text('category', { enum: ['UR', 'OBC', 'SC', 'ST', 'EWS', 'PH'] }).default('UR'),
    gender: text('gender', { enum: ['M', 'F', 'OTHER'] }).default('M'),
    // Metadata — JSON field for location, notes, any extra info admin wants to store
    metadata: text('metadata', { mode: 'json' }),
    // Previous user ID — when lite→pro upgrade happens via soft-delete+recreate
    // Links to the old record for tracking migration history
    previousUserId: text('previous_user_id'),
    // Exam type segregation - UPSC/MPPSC isolation
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
    /** Product entitlements JSON string, e.g. `["upsc_pre","upsc_mains"]`. */
    accessGrants: text('access_grants').$type<string | null>().default(sql`'["upsc_pre"]'`),
    // Session version for single-device login enforcement
    sessionVersion: integer('session_version').default(1),
  },
  (table) => [index('idx_users_email').on(table.email)]
);

// Tests Table
export const tests = sqliteTable(
  'tests',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    titleEn: text('title_en'),
    description: text('description'),
    slug: text('slug').unique().notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    totalQuestions: integer('total_questions').default(0),
    totalMarks: integer('total_marks').notNull(),
    type: text('type', {
      enum: ['FLT', 'UNIT', 'CSAT', 'PYQ', 'TOPIC', 'MISC', 'UPSC_PYQ', 'UPSC_FLT', 'UPSC_FREE_QUIZ'],
    }).notNull(),
    unitId: text('unit_id'), // To link directly to a syllabus unit e.g., 'unit_1'
    topicId: text('topic_id'), // To link to specific topic ID from syllabusData
    tags: text('tags', { mode: 'json' }), // JSON array of related tags e.g., ['history', 'ancient']
    isPro: integer('is_pro', { mode: 'boolean' }).default(false),
    // ── Access Control Flags ──────────────────────────────────────────
    // Ye 3 flags admin panel se control hote hain
    // isFreeAccess = true → Free/Guest users bhi de sakte hain test
    // isLiteAccess = true → Lite plan wale de sakte hain
    // isProAccess = true  → Pro plan wale de sakte hain (default true)
    // Admin ko ye check nahi lagta — wo sab de sakta hai
    isFreeAccess: integer('is_free_access', { mode: 'boolean' }).default(false),
    isLiteAccess: integer('is_lite_access', { mode: 'boolean' }).default(false),
    isProAccess: integer('is_pro_access', { mode: 'boolean' }).default(true),
    displayOrder: integer('display_order').default(0),
    isHidden: integer('is_hidden', { mode: 'boolean' }).default(false),
    maxRetries: integer('max_retries'), // null = unlimited. Standard: Unit=5, FLT=3
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete support
    // Category cutoffs JSON for result analysis
    // e.g. { "UR_OPEN": 154, "UR_FEMALE": 150, "OBC_OPEN": 148, ... }
    cutoffs: text('cutoffs', { mode: 'json' }).$type<Record<string, number>>(),
    // Exam type segregation - UPSC/MPPSC isolation
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
  },
  (table) => [
    index('idx_tests_slug').on(table.slug),
    index('idx_tests_type_ispro').on(table.type, table.isPro),
  ]
);

// Questions Table
export const questions = sqliteTable(
  'questions',
  {
    id: text('id').primaryKey(),
    testId: text('test_id')
      .references(() => tests.id, { onDelete: 'cascade' })
      .notNull(),
    questionText: text('question_text').notNull(), // Hindi (Default)
    questionTextEn: text('question_text_en'), // English
    options: text('options', { mode: 'json' }).notNull(), // JSON: [{ id: 'A', text: 'Hi', text_en: 'En' }]
    correctAnswer: text('correct_answer').notNull(), // Option ID (e.g., 'A') or Text
    explanation: text('explanation'), // Hindi
    explanationEn: text('explanation_en'), // English
    marks: integer('marks').notNull(),
    negativeMarks: real('negative_marks').default(1),
    idealTime: integer('ideal_time').default(60), // Expected time in seconds
    order: integer('order').notNull(),
    subject: text('subject'), // e.g., 'Indian History', 'Polity'
    // New fields for Matching Support
    type: text('type', { enum: ['standard', 'matching'] }).default('standard'),
    matchPairs: text('match_pairs', { mode: 'json' }), // JSON Array: [{ id: '1', label: 'A', match: 'B', ... }]
    extendedData: text('extended_data', { mode: 'json' }), // New flexible schema for UPSC statement/table questions
    deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete support
    // Exam type segregation - UPSC/MPPSC isolation
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
  },
  (table) => [index('idx_questions_subject').on(table.testId, table.subject)]
);

// PYQ Canonical Topics
export const pyqTopics = sqliteTable(
  'pyq_topics',
  {
    id: text('id').primaryKey(),
    subject: text('subject').notNull(),
    topicSlug: text('topic_slug').notNull(),
    topicTitle: text('topic_title').notNull(),
    topicTitleEn: text('topic_title_en'),
    description: text('description'),
    aiContent: text('ai_content', { mode: 'json' }), // New field for deep_learning
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex('pyq_topics_topic_slug_unique').on(table.topicSlug),
    index('idx_pyq_topics_subject').on(table.subject, table.isActive),
  ]
);

// PYQ Question <> Topic Mapping
export const pyqQuestionTopics = sqliteTable(
  'pyq_question_topics',
  {
    id: text('id').primaryKey(),
    questionId: text('question_id')
      .references(() => questions.id, { onDelete: 'cascade' })
      .notNull(),
    topicId: text('topic_id')
      .references(() => pyqTopics.id, { onDelete: 'cascade' })
      .notNull(),
    confidence: real('confidence').default(1),
    isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
    source: text('source', { enum: ['manual', 'ai', 'rule'] }).default('manual'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex('pyq_qt_question_topic_unique').on(table.questionId, table.topicId),
    index('idx_pyq_qt_topic').on(table.topicId),
    index('idx_pyq_qt_question').on(table.questionId),
    index('idx_pyq_qt_primary').on(table.topicId, table.isPrimary),
  ]
);

// PYQ Facts Bank (Student Revision)
export const pyqFactBank = sqliteTable(
  'pyq_fact_bank',
  {
    id: text('id').primaryKey(),
    topicId: text('topic_id')
      .references(() => pyqTopics.id, { onDelete: 'cascade' })
      .notNull(),
    subject: text('subject').notNull(),
    factText: text('fact_text').notNull(),
    factTextEn: text('fact_text_en'),
    memoryTip: text('memory_tip'),
    memoryTipEn: text('memory_tip_en'),
    scamAlert: text('scam_alert'),
    scamAlertEn: text('scam_alert_en'),
    difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).default('medium'),
    frequencyScore: real('frequency_score').default(0),
    importanceScore: real('importance_score').default(0),
    pyqRefs: text('pyq_refs', { mode: 'json' })
      .$type<{ testId?: string; questionId?: string; year?: number }[]>()
      .default(sql`'[]'`)
      .notNull(),
    tags: text('tags', { mode: 'json' })
      .$type<string[]>()
      .default(sql`'[]'`),
    status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
    source: text('source', { enum: ['manual', 'ai'] }).default('manual'),
    createdBy: text('created_by'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index('idx_fact_topic_status').on(table.topicId, table.status),
    index('idx_fact_subject_status').on(table.subject, table.status),
    index('idx_fact_importance').on(table.status, table.importanceScore),
  ]
);

// PYQ Topic Trends Snapshot
export const pyqTopicTrends = sqliteTable(
  'pyq_topic_trends',
  {
    id: text('id').primaryKey(),
    topicId: text('topic_id')
      .references(() => pyqTopics.id, { onDelete: 'cascade' })
      .notNull(),
    subject: text('subject').notNull(),
    year: integer('year').notNull(),
    questionCount: integer('question_count').default(0).notNull(),
    weightPercent: real('weight_percent').default(0).notNull(),
    trendDelta: real('trend_delta').default(0),
    computedAt: integer('computed_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex('pyq_trends_topic_year_unique').on(table.topicId, table.year),
    index('idx_trends_subject_year').on(table.subject, table.year),
    index('idx_trends_topic_year').on(table.topicId, table.year),
  ]
);

// PYQ Import Jobs (Admin Audit)
export const pyqContentImportJobs = sqliteTable(
  'pyq_content_import_jobs',
  {
    id: text('id').primaryKey(),
    uploadedBy: text('uploaded_by'),
    inputHash: text('input_hash').notNull(),
    totalRecords: integer('total_records'),
    successCount: integer('success_count'),
    failureCount: integer('failure_count'),
    status: text('status', { enum: ['pending', 'processed', 'failed'] }).default('pending'),
    errorReport: text('error_report', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index('idx_pyq_jobs_status_created').on(table.status, table.createdAt)]
);

// PYQ Repeated Questions Cache (Pre-computed for fast reads)
export const pyqRepeatedCache = sqliteTable(
  'pyq_repeated_cache',
  {
    id: text('id').primaryKey(),
    questionId: text('question_id')
      .references(() => questions.id, { onDelete: 'cascade' })
      .notNull(),
    clusterId: text('cluster_id').notNull(), // Groups similar questions
    unitId: text('unit_id'), // unit_1, unit_2, etc.
    unitTitle: text('unit_title'),
    repeatCount: integer('repeat_count').default(1).notNull(),
    years: text('years', { mode: 'json' }).$type<number[]>().notNull(), // [2020, 2021, 2023]
    occurrences: text('occurrences', { mode: 'json' })
      .$type<{ year: number; qNo: number; testId: string }[]>()
      .notNull(),
    relatedQuestionIds: text('related_question_ids', { mode: 'json' }).$type<string[]>().notNull(), // All question IDs in this cluster
    computedAt: integer('computed_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index('idx_pyq_repeated_cluster').on(table.clusterId),
    index('idx_pyq_repeated_unit').on(table.unitId),
    index('idx_pyq_repeated_count').on(table.repeatCount),
  ]
);

// PYQ Unit Distribution Cache (Pre-computed for fast reads)
export const pyqUnitCache = sqliteTable(
  'pyq_unit_cache',
  {
    id: text('id').primaryKey(),
    year: integer('year').notNull(),
    unitId: text('unit_id').notNull(),
    unitTitle: text('unit_title').notNull(),
    questionCount: integer('question_count').default(0).notNull(),
    questionIds: text('question_ids', { mode: 'json' }).$type<string[]>().notNull(),
    computedAt: integer('computed_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex('pyq_unit_cache_year_unit_unique').on(table.year, table.unitId),
    index('idx_pyq_unit_cache_year').on(table.year),
  ]
);

// User Attempts Table
export const userAttempts = sqliteTable(
  'user_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => mppscUsers.id, { onDelete: 'cascade' })
      .notNull(), // Linked to users table
    testId: text('test_id')
      .references(() => tests.id, { onDelete: 'cascade' })
      .notNull(),
    startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
    endTime: integer('end_time', { mode: 'timestamp' }),
    score: real('score'),
    isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete support
    // Exam type segregation - UPSC/MPPSC isolation
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
  },
  (table) => [
    index('user_id_idx').on(table.userId),
    index('test_id_idx').on(table.testId),
    index('user_test_idx').on(table.userId, table.testId),
    // Optimized for analytics and completion history
    index('completed_idx').on(table.isCompleted, table.endTime),
    // Composite index for fast history lookups
    index('idx_user_test_completed').on(
      table.userId,
      table.testId,
      table.isCompleted,
      table.endTime
    ),
    // Time-based analytics index
    index('idx_attempts_by_date').on(table.userId, table.endTime),
    // NEW: Requested by code review
    index('idx_user_attempts_completion_score').on(table.userId, table.isCompleted, table.score),
  ]
);

// Attempt Answers (Granular tracking)
export const attemptAnswers = sqliteTable(
  'attempt_answers',
  {
    id: text('id').primaryKey(),
    attemptId: text('attempt_id')
      .references(() => userAttempts.id, { onDelete: 'cascade' })
      .notNull(),
    questionId: text('question_id')
      .references(() => questions.id)
      .notNull(),
    userAnswer: text('user_answer'),
    isCorrect: integer('is_correct', { mode: 'boolean' }),
    timeTakenSeconds: integer('time_taken_seconds'),
  },
  (table) => [
    index('attempt_id_idx').on(table.attemptId),
    index('question_id_idx').on(table.questionId),
    // Performance: Composite index for granular analytics
    index('idx_attempt_question').on(table.attemptId, table.questionId),
  ]
);

// Syllabus Topics Table (New)
export const syllabusTopics = sqliteTable(
  'syllabus_topics',
  {
    id: text('id').primaryKey(),
    unitId: text('unit_id').notNull(), // e.g. 'unit_1'
    title: text('title').notNull(),
    titleEn: text('title_en'),
    // Content stored as JSON for flexibility
    // Expected default keys: front, back, details, mnemonic, impact_emoji, important_facts
    content: text('content', { mode: 'json' }).notNull(),
    contentEn: text('content_en', { mode: 'json' }),
    // New AI-enriched content (Points, PYQ, Mnemonic) - Separate from official syllabus text
    aiContent: text('ai_content', { mode: 'json' }),
    aiContentEn: text('ai_content_en', { mode: 'json' }),
    currentAffairsData: text('current_affairs_data'),
    order: integer('order').notNull(),
    // ── Access Control Flags ──────────────────────────────────────
    // isFree = old flag (backward compat) — same as isFreeAccess
    isFree: integer('is_free', { mode: 'boolean' }).default(false),
    // New tier-based flags — admin panel se control karo
    isLiteAccess: integer('is_lite_access', { mode: 'boolean' }).default(false),
    isProAccess: integer('is_pro_access', { mode: 'boolean' }).default(true),
    imgUrl: text('img_url'), // For image support
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    // Exam type segregation - UPSC/MPPSC isolation
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
  },
  (table) => [index('unit_order_idx').on(table.unitId, table.order)]
);

// Test Attempt Limits — category wise max attempts (source of truth)
// null maxAttempts = unlimited
export const testAttemptLimits = sqliteTable('test_attempt_limits', {
  testType: text('test_type', {
    enum: ['FLT', 'UNIT', 'CSAT', 'PYQ', 'TOPIC', 'MISC', 'UPSC_PYQ', 'UPSC_FLT', 'UPSC_FREE_QUIZ'],
  }).primaryKey(),
  maxAttempts: integer('max_attempts'), // null = unlimited
});

// Blog/Vlog Content Table
export const contentBlogs = sqliteTable('content_blogs', {
  id: text('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  excerpt: text('excerpt'), // Auto-generated plain text summary (200-300 chars) that is SEO friendly
  content: text('content', { mode: 'json' }).notNull(), // Mixed content: text, images, etc.
  category: text('category').notNull(), // e.g., 'history', 'geography', 'current_affairs_mp'
  examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice', 'all'] })
    .default('upsc')
    .notNull(), // Blog exam type for segregation
  imageUrl: text('image_url'),
  readingTime: integer('reading_time'), // in minutes
  contentType: text('content_type', { enum: ['blog', 'vlog'] })
    .default('blog')
    .notNull(),
  unitId: text('unit_id'), // Linked to syllabusUnit e.g., 'unit_1', 'unit_10'
  topicId: text('topic_id'), // Linked to syllabusData topic.id (e.g. '1', '2')
  isPremium: integer('is_premium', { mode: 'boolean' }).default(true), // Legacy flag (kept for backward compat)
  // ── Access Control Flags ──────────────────────────────────────
  // Same pattern as tests — admin panel se toggle karo
  isFreeAccess: integer('is_free_access', { mode: 'boolean' }).default(false),
  isLiteAccess: integer('is_lite_access', { mode: 'boolean' }).default(false),
  isProAccess: integer('is_pro_access', { mode: 'boolean' }).default(true),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  isHidden: integer('is_hidden', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// Relations
export const testsRelations = relations(tests, ({ many }) => ({
  questions: many(questions),
  userAttempts: many(userAttempts),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  test: one(tests, {
    fields: [questions.testId],
    references: [tests.id],
  }),
}));

export const userAttemptsRelations = relations(userAttempts, ({ one, many }) => ({
  user: one(mppscUsers, {
    fields: [userAttempts.userId],
    references: [mppscUsers.id],
  }),
  test: one(tests, {
    fields: [userAttempts.testId],
    references: [tests.id],
  }),
  answers: many(attemptAnswers),
}));

// Support Tickets Table
export const supportTickets = sqliteTable('support_tickets', {
  id: text('id').primaryKey(),
  userId: text('user_id'), // Optional, if user is logged in
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  category: text('category').default('general'), // 'general', 'technical', 'payment', 'content'
  message: text('message').notNull(),
  status: text('status', { enum: ['open', 'in_progress', 'resolved', 'closed'] }).default('open'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  // Exam type segregation - UPSC/MPPSC isolation
  examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
    .default('upsc')
    .notNull(),
});

export const attemptAnswersRelations = relations(attemptAnswers, ({ one }) => ({
  attempt: one(userAttempts, {
    fields: [attemptAnswers.attemptId],
    references: [userAttempts.id],
  }),
  question: one(questions, {
    fields: [attemptAnswers.questionId],
    references: [questions.id],
  }),
}));

// Payment Exit Reasons Table
export const paymentExitReasons = sqliteTable('payment_exit_reasons', {
  id: text('id').primaryKey(),
  reason: text('reason').notNull(),
  customReason: text('custom_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  // Exam type segregation - UPSC/MPPSC isolation
  examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
    .default('upsc')
    .notNull(),
});

// Topic Revisions Table (User Progress)
export const topicRevisions = sqliteTable('topic_revisions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => mppscUsers.id, { onDelete: 'cascade' })
    .notNull(),
  topicId: text('topic_id').notNull(), // Matching syllabusData IDs
  unitId: text('unit_id').notNull(),
  revisionCount: integer('revision_count').default(0),
  lastRevisedAt: integer('last_revised_at', { mode: 'timestamp' }).default(
    sql`(strftime('%s', 'now'))`
  ),
});

// Test Leaderboard Table (Ranking Feature)
export const testLeaderboard = sqliteTable(
  'test_leaderboard',
  {
    id: text('id').primaryKey(),
    testId: text('test_id').notNull(),
    userId: text('user_id'), // Nullable for fake users
    displayName: text('display_name').notNull(),
    score: real('score').notNull(),
    percentage: real('percentage'),
    timeTakenSeconds: integer('time_taken_seconds'),
    rank: integer('rank'),
    isFake: integer('is_fake').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index('test_score_idx').on(table.testId, table.score),
    // Ranking index: Score DESC, Time ASC
    index('idx_leaderboard_ranking').on(table.testId, table.score, table.timeTakenSeconds),
  ]
);

// Free Quiz Attempts (Guest score tracking)
export const freeQuizAttempts = sqliteTable(
  'free_quiz_attempts',
  {
    id: text('id').primaryKey(),
    testId: text('test_id')
      .references(() => tests.id, { onDelete: 'cascade' })
      .notNull(),
    guestId: text('guest_id'),
    score: real('score'),
    totalQuestions: integer('total_questions'),
    percentage: real('percentage'),
    timeTakenSeconds: integer('time_taken_seconds'),
    completedAt: integer('completed_at', { mode: 'timestamp' }).default(
      sql`(strftime('%s', 'now'))`
    ),
    // Exam type segregation - UPSC/MPPSC isolation  
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')  // Preserve existing attempts as UPSC
      .notNull(),
  },
  (table) => [
    index('idx_free_attempts_test').on(table.testId),
    index('idx_free_attempts_guest').on(table.guestId),
  ]
);

// User Feedback Table
export const feedbacks = sqliteTable(
  'feedbacks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'), // Optional, if user is logged in
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'), // Optional phone number
    message: text('message').notNull(),
    rating: integer('rating').notNull(), // 1 to 5
    // Categories: 'bug', 'content', 'ui', 'feature_request', 'other'
    category: text('category').default('other'),
    // Alignment with Testimonials
    role: text('role'), // e.g., 'Aspirant', 'Selected Officer', 'Teacher'
    location: text('location'), // e.g., 'Indore', 'Bhopal'
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    // Exam type segregation - UPSC/MPPSC isolation
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
  },
  (table) => [
    index('idx_feedbacks_created_at').on(table.createdAt),
    index('idx_feedbacks_category').on(table.category),
    index('idx_feedbacks_role').on(table.role),
  ]
);

// Guests Table (Lead Generation)
export const guests = sqliteTable(
  'guests',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    mobile: text('mobile'), // Primary identifier for upsert (last 10 digits stored)
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    // Exam type segregation - UPSC/MPPSC isolation  
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')  // Preserve existing guests as UPSC
      .notNull(),
    leadSource: text('lead_source'),
  },
  (table) => [
    index('idx_guests_email').on(table.email),
    uniqueIndex('idx_guests_mobile_unique').on(table.mobile), // Unique for upsert logic
  ]
);

// User Activity Logs (Audit Trail)
export const mppscUserActivities = sqliteTable(
  'mppsc_user_activities',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'), // Kept even if user is deleted (for history)
    userEmail: text('user_email').notNull(),
    userName: text('user_name'),
    adminId: text('admin_id'), // Who performed the action
    action: text('action', {
      enum: ['PLAN_CHANGE', 'DELETE', 'GRANT', 'UPDATE', 'LOGIN'],
    }).notNull(),
    details: text('details', { mode: 'json' }), // Store old/new values
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index('idx_activities_user_id').on(table.userId),
    index('idx_activities_action').on(table.action),
    index('idx_activities_created_at').on(table.createdAt),
  ]
);

// Payments Table
export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => mppscUsers.id, { onDelete: 'set null' }), // Set null on user delete
    orderId: text('order_id').notNull(),
    paymentId: text('payment_id').unique(),
    signature: text('signature'),
    amount: integer('amount').notNull(),
    planTier: text('plan_tier', { enum: ['lite', 'pro'] }),
    status: text('status', { enum: ['created', 'captured', 'failed'] })
      .default('created')
      .notNull(),
    currency: text('currency').default('INR').notNull(),
    receipt: text('receipt'),
    notes: text('notes', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    // Exam type segregation - UPSC/MPPSC isolation
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
  },
  (table) => [
    index('idx_payments_order_id').on(table.orderId),
    index('idx_payments_user_id').on(table.userId),
    index('idx_payments_status').on(table.status),
    index('idx_payments_payment_id').on(table.paymentId),
  ]
);

// Verification Tokens Table (for set password / email verification)
export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(), // email or userId
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index('idx_verification_tokens_identifier').on(table.identifier),
    index('idx_verification_tokens_token').on(table.token),
  ]
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 PRICING CONFIG TABLE — Dynamic pricing, admin se change karo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Single row table (key-value style) — stores current pricing.
// Admin updates → cache busts → pricing page shows new prices.
// No deploy needed to change prices!
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const pricingConfig = sqliteTable('pricing_config', {
  examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice', 'all'] }).primaryKey(),
  litePrice: integer('lite_price').default(99),
  liteOriginalPrice: integer('lite_original_price').default(299),
  liteValidityText: text('lite_validity_text').default('Valid till Exam'),
  liteMonths: integer('lite_months').default(8),
  proPrice: integer('pro_price').default(299),
  proOriginalPrice: integer('pro_original_price').default(999),
  proValidityText: text('pro_validity_text').default('Valid for 1 Year'),
  proMonths: integer('pro_months').default(12),
  upgradePrice: integer('upgrade_price').default(199),
  upgradeOriginalPrice: integer('upgrade_original_price').default(299),
  urgencyText: text('urgency_text').default('Special Offer'),
  urgencyTextHi: text('urgency_text_hi').default('विशेष ऑफर'),
  studentsBought: integer('students_bought').default(23),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// Intelligence Feedback Table
export const intelligenceFeedback = sqliteTable(
  'intelligence_feedback',
  {
    id: text('id').primaryKey(),
    guestId: text('guest_id').references(() => guests.id),
    questionId: text('question_id').notNull(),
    questionText: text('question_text'), // Cache of the question stem for admin display
    testId: text('test_id'),
    reaction: text('reaction', { enum: ['helpful', 'insightful', 'unhelpful', 'doubt'] }).notNull(),
    message: text('message'), // For doubt details
    isPro: integer('is_pro', { mode: 'boolean' }).default(false),
    source: text('source'), // e.g., 'intelligence_page', 'paper_solution', 'mains_pyq'
    userId: text('user_id'), // For logged-in users
    userName: text('user_name'),
    userMobile: text('user_mobile'),
    userEmail: text('user_email'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'all', 'mppolice'] })
      .default('upsc')
      .notNull(),
  },
);

export const intelligenceFeedbackRelations = relations(intelligenceFeedback, ({ one }) => ({
  guest: one(guests, {
    fields: [intelligenceFeedback.guestId],
    references: [guests.id],
  }),
  question: one(questions, {
    fields: [intelligenceFeedback.questionId],
    references: [questions.id],
  }),
}));

// Test Feedback Table
export const testFeedback = sqliteTable('test_feedback', {
  id: text('id').primaryKey(),
  testId: text('test_id').notNull(),
  userId: text('user_id'), // Optional for guest users
  testType: text('test_type', { enum: ['free', 'premium', 'pyq'] }).notNull(),
  testName: text('test_name'), // Identifies the test title (e.g., 'Modern History Quiz')

  // Feedback ratings
  overallRating: integer('overall_rating').notNull(), // 1-5 stars
  difficultyLevel: text('difficulty_level', {
    enum: ['too_easy', 'just_right', 'too_hard'],
  }).notNull(),
  questionQuality: text('question_quality', {
    enum: ['excellent', 'good', 'average', 'poor'],
  }).notNull(),
  wouldRecommend: text('would_recommend', {
    enum: ['definitely', 'probably', 'maybe', 'no'],
  }).notNull(),

  // Optional text feedback
  comments: text('comments'),

  // User Info (Added to identify guest/logged-in users easily)
  userName: text('user_name'),
  userEmail: text('user_email'),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  
  // Exam type segregation - UPSC/MPPSC isolation  
  examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
    .default('upsc')  // Preserve existing test feedback as UPSC
    .notNull(),
});

export const testFeedbackRelations = relations(testFeedback, ({ one }) => ({
  user: one(mppscUsers, {
    fields: [testFeedback.userId],
    references: [mppscUsers.id],
  }),
  test: one(tests, {
    fields: [testFeedback.testId],
    references: [tests.id],
  }),
}));


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏛️ MPPSC MAINS SECTION TABLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 2. Mains Papers (Paper 1-6)
export const mainsPapers = sqliteTable('mains_papers', {
  id: text('id').primaryKey(),
  paperNumber: integer('paper_number').notNull(),
  titleHi: text('title_hi').notNull(),
  titleEn: text('title_en').notNull(),
  totalMarks: integer('total_marks').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  displayOrder: integer('display_order').default(0),
  description: text('description'),
  examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
    .default('upsc')
    .notNull(),
});

// 3. Mains Units (Unit 1-10 per part/paper)
export const mainsUnits = sqliteTable('mains_units', {
  id: text('id').primaryKey(),
  paperId: text('paper_id').references(() => mainsPapers.id, { onDelete: 'cascade' }),
  part: text('part', { enum: ['A', 'B', 'NONE'] }).default('NONE'),
  unitNumber: integer('unit_number').notNull(),
  titleHi: text('title_hi').notNull(),
  titleEn: text('title_en').notNull(),
  displayOrder: integer('display_order').default(0),
  examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
    .default('upsc')
    .notNull(),
}, (t) => [
  index('idx_mains_units_paper').on(t.paperId),
  index('idx_mains_units_order').on(t.paperId, t.part, t.unitNumber)
]);

// 4. Mains Topics (Specific syllabus points)
export const mainsTopics = sqliteTable('mains_topics', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').references(() => mainsUnits.id, { onDelete: 'cascade' }),
  titleHi: text('title_hi').notNull(),
  titleEn: text('title_en').notNull(),
  displayOrder: integer('display_order').default(0),
  status: text('status', { enum: ['draft', 'published'] }).default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
    .default('upsc')
    .notNull(),
}, (t) => [
  index('idx_mains_topics_unit').on(t.unitId)
]);


// 5. Mains Content (The Deep Explanation & Model Answers)
export const mainsContent = sqliteTable('mains_content', {
  id: text('id').primaryKey(),
  topicId: text('topic_id').references(() => mainsTopics.id, { onDelete: 'cascade' }).unique(),
  
  // Concept Explanation
  conceptHi: text('concept_hi').notNull(),
  conceptEn: text('concept_en').notNull(),
  
  // Expert Strategy & Value Addition (Articles, Cases, MP Context, Mnemonics)
  expertStrategyHi: text('expert_strategy_hi'),
  expertStrategyEn: text('expert_strategy_en'),
  
  // Model Answers JSON: { "2m": [{ variant1: "" }], "7m": [...], "11m": [...] }
  modelAnswers: text('model_answers', { mode: 'json' }).notNull(),
  
  // 🚀 Future-Proofing: Practice & Revision
  keyTermsHi: text('key_terms_hi'), // For Quick Revision
  keyTermsEn: text('key_terms_en'),
  practiceQuestions: text('practice_questions', { mode: 'json' }), // For student self-practice
  /** Extended structured JSON (e.g. History-rich bilingual v1). Legacy rows stay null. */
  richPayload: text('rich_payload', { mode: 'json' }).$type<Record<string, unknown> | null>(),

  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
    .default('upsc')
    .notNull(),
});

// 6. Mains Progress Tracking
export const mainsProgress = sqliteTable('mains_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => mppscUsers.id, { onDelete: 'cascade' }),
  topicId: text('topic_id').references(() => mainsTopics.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['unseen', 'done', 'revision'] }).default('unseen'),
  lastReviewedAt: integer('last_reviewed_at', { mode: 'timestamp' }),
}, (table) => [
  uniqueIndex('idx_mains_progress_user_topic').on(table.userId, table.topicId)
]);

// 7. Mains Feedback & Doubts
export const mainsFeedback = sqliteTable('mains_feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => mppscUsers.id, { onDelete: 'cascade' }),
  topicId: text('topic_id').references(() => mainsTopics.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['insightful', 'doubt', 'dislike'] }).notNull(),
  message: text('message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// Relations for easy joining
export const mainsPapersRelations = relations(mainsPapers, ({ many }) => ({
  units: many(mainsUnits),
}));

export const mainsUnitsRelations = relations(mainsUnits, ({ one, many }) => ({
  paper: one(mainsPapers, { fields: [mainsUnits.paperId], references: [mainsPapers.id] }),
  topics: many(mainsTopics),
}));

/** Official previous-year mains papers (e.g. 2024 Paper 1) — JSON import + unit-wise questions */
export const mainsPyqPapers = sqliteTable(
  'mains_pyq_papers',
  {
    id: text('id').primaryKey(),
    slug: text('slug').unique().notNull(),
    examYear: integer('exam_year').notNull(),
    paperNumber: integer('paper_number').notNull(),
    examLabel: text('exam_label'),
    titleHi: text('title_hi'),
    titleEn: text('title_en'),
    rawJson: text('raw_json'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    /** Admin: omit from `/mains/syllabus/pyq-library` & non-admin PYQ prompt pools when true */
    isHidden: integer('is_hidden', { mode: 'boolean' }).default(false).notNull(),
  },
  (t) => [index('idx_mains_pyq_papers_year_paper').on(t.examYear, t.paperNumber)]
);

export const mainsPyqQuestions = sqliteTable(
  'mains_pyq_questions',
  {
    id: text('id').primaryKey(),
    paperId: text('paper_id')
      .references(() => mainsPyqPapers.id, { onDelete: 'cascade' })
      .notNull(),
    part: text('part').notNull(),
    unitNumber: integer('unit_number').notNull(),
    unitTitleHi: text('unit_title_hi'),
    unitTitleEn: text('unit_title_en'),
    questionNumber: text('question_number').notNull(),
    marks: integer('marks').notNull(),
    questionType: text('question_type').notNull(),
    questionHi: text('question_hi').notNull(),
    questionEn: text('question_en'),
    /** Deep coaching: patterns, reading list, intro–body–close, sources — Hindi */
    expertInsightsHi: text('expert_insights_hi'),
    expertInsightsEn: text('expert_insights_en'),
    currentAffairsData: text('current_affairs_data'),
    displayOrder: integer('display_order').default(0),
  },
  (t) => [
    index('idx_mains_pyq_q_paper').on(t.paperId),
    index('idx_mains_pyq_q_unit').on(t.paperId, t.part, t.unitNumber),
  ]
);

/** Optional structured theory JSON per topic (vault “Deep Dive” pipeline; complements mains_content). */
export const mainsTopicTheoryStructured = sqliteTable(
  'mains_topic_theory_structured',
  {
    id: text('id').primaryKey(),
    topicId: text('topic_id')
      .references(() => mainsTopics.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    payload: text('payload', { mode: 'json' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
  },
  (t) => [index('idx_mains_theory_topic').on(t.topicId)]
);

/** Two exam-ready answer variants per imported PYQ stem. */
export const mainsPyqPreparedVariants = sqliteTable(
  'mains_pyq_prepared_variants',
  {
    id: text('id').primaryKey(),
    pyqQuestionId: text('pyq_question_id')
      .references(() => mainsPyqQuestions.id, { onDelete: 'cascade' })
      .notNull(),
    variantSlot: integer('variant_slot').notNull(),
    styleLabel: text('style_label'),
    /** Short angle label shown when UI language is Hindi (parallel to English `style_label`). */
    styleLabelHi: text('style_label_hi'),
    structureBreakdown: text('structure_breakdown'),
    answerHi: text('answer_hi').notNull(),
    answerEn: text('answer_en'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (t) => [
    uniqueIndex('idx_mains_pyq_prep_unique').on(t.pyqQuestionId, t.variantSlot),
    index('idx_mains_pyq_prep_q').on(t.pyqQuestionId),
  ]
);

/** Demo / expected questions generated for a topic when no PYQ match. */
export const mainsTopicExpectedQuestions = sqliteTable(
  'mains_topic_expected_questions',
  {
    id: text('id').primaryKey(),
    topicId: text('topic_id')
      .references(() => mainsTopics.id, { onDelete: 'cascade' })
      .notNull(),
    marks: integer('marks').notNull(),
    wordLimitHint: integer('word_limit_hint'),
    questionHi: text('question_hi').notNull(),
    questionEn: text('question_en'),
    sortOrder: integer('sort_order').default(0),
    sourceLabel: text('source_label').default('expected'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    examType: text('exam_type', { enum: ['upsc', 'mppsc', 'mppolice'] })
      .default('upsc')
      .notNull(),
  },
  (t) => [
    index('idx_mains_expected_topic').on(t.topicId),
    index('idx_mains_expected_marks').on(t.topicId, t.marks),
  ]
);

export const mainsTopicExpectedVariants = sqliteTable(
  'mains_topic_expected_variants',
  {
    id: text('id').primaryKey(),
    expectedQuestionId: text('expected_question_id')
      .references(() => mainsTopicExpectedQuestions.id, { onDelete: 'cascade' })
      .notNull(),
    variantSlot: integer('variant_slot').notNull(),
    styleLabel: text('style_label'),
    structureBreakdown: text('structure_breakdown'),
    answerHi: text('answer_hi').notNull(),
    answerEn: text('answer_en'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (t) => [
    uniqueIndex('idx_mains_expected_var_unique').on(t.expectedQuestionId, t.variantSlot),
  ]
);

/** Manual topic ↔ PYQ link for badges and precise vault filtering. */
export const mainsTopicPyqLinks = sqliteTable(
  'mains_topic_pyq_links',
  {
    topicId: text('topic_id')
      .references(() => mainsTopics.id, { onDelete: 'cascade' })
      .notNull(),
    pyqQuestionId: text('pyq_question_id')
      .references(() => mainsPyqQuestions.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  },
  (t) => [
    primaryKey({ columns: [t.topicId, t.pyqQuestionId] }),
    index('idx_mains_topic_pyq_q').on(t.pyqQuestionId),
  ]
);

export const mainsTopicTheoryStructuredRelations = relations(mainsTopicTheoryStructured, ({ one }) => ({
  topic: one(mainsTopics, {
    fields: [mainsTopicTheoryStructured.topicId],
    references: [mainsTopics.id],
  }),
}));

export const mainsPyqPreparedVariantsRelations = relations(mainsPyqPreparedVariants, ({ one }) => ({
  pyqQuestion: one(mainsPyqQuestions, {
    fields: [mainsPyqPreparedVariants.pyqQuestionId],
    references: [mainsPyqQuestions.id],
  }),
}));

export const mainsTopicExpectedQuestionsRelations = relations(mainsTopicExpectedQuestions, ({ one, many }) => ({
  topic: one(mainsTopics, {
    fields: [mainsTopicExpectedQuestions.topicId],
    references: [mainsTopics.id],
  }),
  variants: many(mainsTopicExpectedVariants),
}));

export const mainsTopicExpectedVariantsRelations = relations(mainsTopicExpectedVariants, ({ one }) => ({
  question: one(mainsTopicExpectedQuestions, {
    fields: [mainsTopicExpectedVariants.expectedQuestionId],
    references: [mainsTopicExpectedQuestions.id],
  }),
}));

export const mainsTopicPyqLinksRelations = relations(mainsTopicPyqLinks, ({ one }) => ({
  topic: one(mainsTopics, { fields: [mainsTopicPyqLinks.topicId], references: [mainsTopics.id] }),
  pyqQuestion: one(mainsPyqQuestions, {
    fields: [mainsTopicPyqLinks.pyqQuestionId],
    references: [mainsPyqQuestions.id],
  }),
}));

export const mainsPyqPapersRelations = relations(mainsPyqPapers, ({ many }) => ({
  questions: many(mainsPyqQuestions),
}));

export const mainsPyqQuestionsRelations = relations(mainsPyqQuestions, ({ one, many }) => ({
  paper: one(mainsPyqPapers, { fields: [mainsPyqQuestions.paperId], references: [mainsPyqPapers.id] }),
  preparedVariants: many(mainsPyqPreparedVariants),
  topicLinks: many(mainsTopicPyqLinks),
}));

export const mainsTopicsRelations = relations(mainsTopics, ({ one, many }) => ({
  unit: one(mainsUnits, { fields: [mainsTopics.unitId], references: [mainsUnits.id] }),
  content: one(mainsContent, { fields: [mainsTopics.id], references: [mainsContent.topicId] }),
  theoryStructured: one(mainsTopicTheoryStructured, {
    fields: [mainsTopics.id],
    references: [mainsTopicTheoryStructured.topicId],
  }),
  expectedQuestions: many(mainsTopicExpectedQuestions),
  pyqLinks: many(mainsTopicPyqLinks),
}));

// System Settings Table (Scalable and isolated configuration storage)
export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});


export const supportConversations = sqliteTable('support_conversations', {
  id: text('id').primaryKey(),
  platform: text('platform', { enum: ['whatsapp', 'telegram'] }).notNull(),
  guestId: text('guest_id').references(() => guests.id),
  guestName: text('guest_name'),
  guestPhone: text('guest_phone'), // WhatsApp number or Telegram ID
  language: text('language').default('PENDING'), // EN, HI, PENDING
  status: text('status', { enum: ['open', 'resolved'] }).default('open'),
  humanActive: integer('human_active', { mode: 'boolean' }).default(false), // true = admin replied, suppress bot
  unreadCount: integer('unread_count').default(0),
  lastMessageAt: integer('last_message_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  guestPhoneIdx: index('idx_support_conv_guest_phone_upsc').on(table.guestPhone),
  lastMessageAtIdx: index('idx_support_conv_last_msg_upsc').on(table.lastMessageAt),
}));

export const supportMessages = sqliteTable('support_messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => supportConversations.id, { onDelete: 'cascade' }).notNull(),
  sender: text('sender', { enum: ['user', 'bot', 'admin'] }).notNull(),
  text: text('text').notNull(),
  mediaUrl: text('media_url'), // For image messages (WhatsApp image URLs)
  messageType: text('message_type', { enum: ['text', 'image', 'interactive'] }).default('text'),
  status: text('status', { enum: ['sent', 'delivered', 'read', 'failed'] }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  conversationIdIdx: index('idx_support_msg_conv_id_upsc').on(table.conversationId),
  createdAtIdx: index('idx_support_msg_created_at_upsc').on(table.createdAt),
}));

export const supportConversationsRelations = relations(supportConversations, ({ many, one }) => ({
  messages: many(supportMessages),
  guest: one(guests, {
    fields: [supportConversations.guestId],
    references: [guests.id],
  }),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  conversation: one(supportConversations, {
    fields: [supportMessages.conversationId],
    references: [supportConversations.id],
  }),
}));
