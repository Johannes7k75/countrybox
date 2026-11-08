/** Wire contracts shared by browser and API. No database or server imports allowed here. */
import { REGIONS } from '@countrybox/catalog'
import {
  DIRECTIONS,
  FIELDS,
  MAP_CLICK_STYLES,
  MAP_PROMPT_STYLES,
  MAX_SESSION_LENGTH,
  REVIEW_DIRECTIONS,
} from '@countrybox/domain'
import { z } from 'zod'

export const DirectionSchema = z.enum(DIRECTIONS as [string, ...string[]])
/** Server reviews support the 20 classic directions (map questions are practice-only for now). */
export const ReviewDirectionSchema = z.enum(REVIEW_DIRECTIONS as [string, ...string[]])
export const FieldSchema = z.enum(FIELDS)
export const LocaleSchema = z.enum(['en', 'de'])
export const MapPolicySchema = z.enum(['off', 'always', 'after'])
export const EntityIdSchema = z.string().regex(/^[a-z]{2}$/)
export const IdempotencyKeySchema = z.string().uuid()

export const ErrorCode = z.enum([
  'invalid_input',
  'unauthenticated',
  'forbidden',
  'not_found',
  'conflict',
  'reauth_required',
  'rate_limited',
  'internal',
])
export const ErrorSchema = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    requestId: z.string().optional(),
  }),
})
export type ApiError = z.infer<typeof ErrorSchema>

/** Synced preferences. Ownership/version fields are deliberately not part of the writable shape. */
export const PrefsSchema = z
  .object({
    theme: z.enum(['system', 'light', 'dark']),
    auto: z.boolean(),
    map: MapPolicySchema,
    motion: z.boolean(),
    setup: z.object({
      prompt: FieldSchema,
      answer: FieldSchema,
      scope: z.enum(['un', 'all']),
      region: z.enum(['world', ...REGIONS]),
      length: z.number().int().min(1).max(MAX_SESSION_LENGTH),
      mode: z.enum(['practice', 'challenge']),
      difficulty: z.enum(['standard', 'hard']).optional(),
      mapPrompt: z.enum(MAP_PROMPT_STYLES).optional(),
      mapClick: z.enum(MAP_CLICK_STYLES).optional(),
    }),
  })
  .strict()
export const SettingsSchema = z.object({
  locale: LocaleSchema,
  prefs: PrefsSchema.partial(),
  rowVersion: z.number().int(),
})
export const SettingsPatchSchema = z
  .object({ rowVersion: z.number().int(), locale: LocaleSchema.optional(), prefs: PrefsSchema.partial().optional() })
  .strict()

export const PseudonymousSignupSchema = z
  .object({
    password: z.string().min(10).max(128),
    name: z.string().trim().min(1).max(40).optional(),
    rememberMe: z.boolean().optional(),
  })
  .strict()
export const EmailSignupSchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(10).max(128),
    name: z.string().trim().min(1).max(40),
  })
  .strict()

export const MeSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  email: z.string().nullable(),
  emailIsReal: z.boolean(),
  createdAt: z.string(),
})

/* reviews */
export const EnrollSchema = z
  .object({ entityId: EntityIdSchema, directions: z.array(ReviewDirectionSchema).min(1).max(20) })
  .strict()
export const CardSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string(),
  direction: DirectionSchema,
  stage: z.number().int().min(0).max(5),
  dueAt: z.string(),
  lapses: z.number().int(),
})
export const QueueSchema = z.object({
  now: z.string(),
  due: z.array(CardSchema),
  cards: z.array(CardSchema),
  upcoming: z.array(z.number().int()),
})
export const PresentationRequestSchema = z
  .object({ cardId: z.string().uuid(), mapPolicy: MapPolicySchema, idempotencyKey: IdempotencyKeySchema })
  .strict()
export const PresentationSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  entityId: z.string(),
  direction: DirectionSchema,
  optionIds: z.array(z.string()).length(4),
  hintShown: z.boolean(),
})
export const AnswerRequestSchema = z
  .object({ presentationId: z.string().uuid(), optionId: EntityIdSchema, idempotencyKey: IdempotencyKeySchema })
  .strict()
export const AnswerResultSchema = z.object({
  correct: z.boolean(),
  assisted: z.boolean(),
  targetId: z.string(),
  stageBefore: z.number().int(),
  stageAfter: z.number().int(),
  dueAt: z.string(),
})

/* practice import */
export const ImportAttemptSchema = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    entityId: EntityIdSchema,
    direction: DirectionSchema,
    firstCorrect: z.boolean(),
    assisted: z.boolean(),
    catalogVersion: z.string().max(64),
    answeredAt: z.string().datetime(),
  })
  .strict()
export const ImportBatchSchema = z.object({ attempts: z.array(ImportAttemptSchema).min(1).max(500) }).strict()

export type Prefs = z.infer<typeof PrefsSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type Me = z.infer<typeof MeSchema>
export type Card = z.infer<typeof CardSchema>
export type Queue = z.infer<typeof QueueSchema>
export type Presentation = z.infer<typeof PresentationSchema>
export type AnswerResult = z.infer<typeof AnswerResultSchema>
