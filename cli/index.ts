import * as readline from 'readline';
import { Cache } from '../extractor/Cache';

import colors from 'colors';
import { randomBytes } from 'node:crypto';



const cache = new Cache()

async function ask(q: string, a: { text: string, correct: boolean, idx?: number }[]) {
    console.log("Q: ", q)
    console.log()
    const correct = a.find((a) => a.correct)

    let i = 1
    while (a.length > 0) {
        const answer = a.splice(Math.floor(Math.random() * a.length), 1)[0]
        answer.idx = i
        console.log(`${i++}: ${answer.text}`)
    }

    const answer = await getAnswer()

    console.clear()
    return answer === correct?.idx
}

async function getAnswer() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((res) => {
        let number;
        rl.input.once('data', (chunk) => {
            const char = chunk.toString()[0];

            process.stdout.write("\n")
            rl.close()
            res(Number.parseInt(char))

            // if (!isNaN(char) && char !== ' ') {
            //     number += char;
            //     process.stdout.write(char); // Echo the input to the console
            // } else if (char === '\r' || char === '\n') {
            //     if (number) {
            //         res(number) 
            //         rl.close();
            //     }
            // }
        })
    });
}

async function askRandomQuestion() {
    const countries = await cache.get("countries.json")

    const answers = []
    const correct = countries[Math.floor(Math.random() * countries.length)]
    answers.push({ correct: true, text: correct.translations.deu.common, idx: undefined })

    let i = 3
    while (i>0) {
        const value = getRandomInt(0, countries.length-1)
        const answer = countries[value]
        if (answers.find((x)=>x.text===answer.translations.deu.common)) {
            console.log(colors.bgMagenta("Duplicate"))
        }

        answers.push({ correct: false, text: answer.translations.deu.common, idx: undefined })
        i--
    }

    const isCorrect = await ask("What flag is this?\n" + correct.flag.emoji, answers)

    if (isCorrect) {
        console.log(colors.bgGreen("Das ist richtig!"))
    } else {
        console.log(colors.bgRed("Das ist falsh! Es war\n") + colors.bgYellow(correct.translations.deu.common))
    }

    askRandomQuestion()
}

function getRandomInt(min: number, max: number) {
    if (min > max) {
      throw new Error('min must be less than or equal to max');
    }
  
    const randomByte = randomBytes(4);
    const randomNumber = randomByte.readUInt32BE() / 0xffffffff; 
  
    return Math.floor(randomNumber * (max - min + 1)) + min;
  }
  

askRandomQuestion()