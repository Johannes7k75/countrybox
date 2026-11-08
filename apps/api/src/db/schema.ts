import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })

/* ───── Better Auth tables (core + username plugin) ───── */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  /** Real address, or a non-deliverable alias `<id>@accounts.countrybox.invalid` for no-email accounts. */
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
})
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: ts('expires_at').notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('session_user_idx').on(t.userId)],
)
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: ts('access_token_expires_at'),
    refreshTokenExpiresAt: ts('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('account_user_idx').on(t.userId)],
)
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: ts('expires_at').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
})

/* ───── Application tables ───── */
export const userSettings = pgTable(
  'user_settings',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull().default('en'),
    prefs: jsonb('prefs').$type<Record<string, unknown>>().notNull().default({}),
    rowVersion: integer('row_version').notNull().default(1),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [check('user_settings_locale', sql`${t.locale} in ('en','de')`)],
)

/** One card = (user, entity, prompt→answer direction). Leitner stage 0–5. */
export const learningCard = pgTable(
  'learning_card',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    entityId: text('entity_id').notNull(),
    direction: text('direction').notNull(),
    catalogVersion: text('catalog_version').notNull(),
    stage: integer('stage').notNull().default(0),
    dueAt: ts('due_at').notNull().defaultNow(),
    lapses: integer('lapses').notNull().default(0),
    lastReviewedAt: ts('last_reviewed_at'),
    schedulerVersion: text('scheduler_version').notNull(),
    rowVersion: integer('row_version').notNull().default(1),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('learning_card_user_card').on(t.userId, t.entityId, t.direction),
    index('learning_card_user_due').on(t.userId, t.dueAt),
    check('learning_card_stage', sql`${t.stage} between 0 and 5`),
    check('learning_card_lapses', sql`${t.lapses} >= 0`),
  ],
)

/** A server-issued review question. Answer evaluation uses this, never client-sent targets. */
export const reviewPresentation = pgTable(
  'review_presentation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: uuid('card_id')
      .notNull()
      .references(() => learningCard.id, { onDelete: 'cascade' }),
    cardRowVersion: integer('card_row_version').notNull(),
    catalogVersion: text('catalog_version').notNull(),
    optionIds: jsonb('option_ids').$type<string[]>().notNull(),
    mapPolicy: text('map_policy').notNull(),
    hintShownAt: ts('hint_shown_at'),
    answeredAt: ts('answered_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('review_presentation_user').on(t.userId, t.createdAt)],
)

export const reviewEvent = pgTable(
  'review_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    cardId: uuid('card_id')
      .notNull()
      .references(() => learningCard.id, { onDelete: 'cascade' }),
    presentationId: uuid('presentation_id')
      .notNull()
      .unique()
      .references(() => reviewPresentation.id, { onDelete: 'cascade' }),
    chosenId: text('chosen_id').notNull(),
    correct: boolean('correct').notNull(),
    assisted: boolean('assisted').notNull(),
    stageBefore: integer('stage_before').notNull(),
    stageAfter: integer('stage_after').notNull(),
    dueBefore: ts('due_before').notNull(),
    dueAfter: ts('due_after').notNull(),
    schedulerVersion: text('scheduler_version').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('review_event_user').on(t.userId, t.createdAt)],
)

/** Imported local practice statistics (labelled practice, never review events). */
export const practiceAttempt = pgTable(
  'practice_attempt',
  {
    id: uuid('id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull(),
    entityId: text('entity_id').notNull(),
    direction: text('direction').notNull(),
    firstCorrect: boolean('first_correct').notNull(),
    assisted: boolean('assisted').notNull(),
    catalogVersion: text('catalog_version').notNull(),
    answeredAt: ts('answered_at').notNull(),
    importedAt: ts('imported_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ name: 'practice_attempt_pk', columns: [t.userId, t.id] })],
)

export const idempotencyRecord = pgTable(
  'idempotency_record',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    key: text('key').notNull(),
    requestHash: text('request_hash').notNull(),
    status: integer('status').notNull(),
    response: jsonb('response').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('idempotency_unique').on(t.userId, t.endpoint, t.key)],
)
