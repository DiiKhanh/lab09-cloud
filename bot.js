const { ActivityHandler, MessageFactory } = require('botbuilder');
const { TextAnalyticsClient, AzureKeyCredential } = require('@azure/ai-text-analytics');

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const replyText = `Echo: ${ context.activity.text }`;
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

async function analyzeText(userText) {
    const endpoint = 'https://lab09-lang.cognitiveservices.azure.com/'; // Add your endpoint here
    const key = '3xlR0EpG2zLnqNgS90vHLv7K9zNYNZ02uHjpjrYAJmb8qWJIe5kVJQQJ99AJACqBBLyXJ3w3AAAaACOGhc9Y'; // Add your key here
    const documents = [
        {
            text: userText,
            id: '0',
            language: 'en'
        }
    ];

    const client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));
    const results = await client.analyzeSentiment(documents, { includeOpinionMining: true });

    if (!results || results.length === 0) {
        console.error('No results found');
        return 'No analysis could be performed.';
    }

    const result = results[0];
    if (result.error) {
        console.error(`Error: ${ result.error }`);
        return 'Error in sentiment analysis.';
    }

    let response = `Analysis for document: ${ documents[0].text }\n`;
    response += `Overall Sentiment: ${ result.sentiment }\n`;

    result.sentences.forEach((sentence) => {
        response += `  - Sentence: ${ sentence.text }\n`;
        response += `    Sentiment: ${ sentence.sentiment }\n`;
        response += `    Confidence Scores: ${ JSON.stringify(sentence.confidenceScores) }\n`;

        sentence.opinions.forEach((opinion) => {
            opinion.assessments.forEach((assessment) => {
                response += `    Phrase: "${ assessment.text }" shows ${ assessment.sentiment } sentiment.\n`;
            });
        });
    });

    console.log('response::', response);
    return response;
}

class SentimentalAnalyticsBot extends ActivityHandler {
    constructor() {
        super();

        this.onMessage(async (context, next) => {
            const userText = context.activity.text;
            const startTime = new Date();

            const response = await analyzeText(userText);

            const endTime = new Date();
            console.log(`Processing time: ${ (endTime - startTime) / 1000 } seconds`);

            await context.sendActivity(response);
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome to our CLOUD LAB09 BOT!';

            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }

            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;
module.exports.SentimentalAnalyticsBot = SentimentalAnalyticsBot;
