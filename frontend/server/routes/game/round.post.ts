import { z } from "zod"

const bodySchema = z.object({
    options: z.array(z.object({
        cca2: z.string(),
        correct: z.boolean(),
        guessed: z.boolean(),
    })),
    gameId: z.number().nullable(),
})

export default defineEventHandler(async(event)=>{
    const body = await readValidatedBody(event, bodySchema.parse)
    const user = event.context.user

    const wasWrongGuessed = body.options.filter(o=>!o.correct && o.guessed).length > 0

    console.log(wasWrongGuessed, user)

    await useDrizzle().insert(tables.GuessedFlags).values([
        {
            correct: !wasWrongGuessed,
            userId: user!.id as unknown as number,
            gameId: body.gameId,
        }
    ])

})