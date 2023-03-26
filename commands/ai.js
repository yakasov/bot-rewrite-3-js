const { Configuration, OpenAIApi } = require("openai");
const { openaiToken } = require('./../resources/config.json');

const config = new Configuration({
    apiKey: openaiToken
});
const openai = new OpenAIApi(config);

exports.run = async(client, msg, args) => {
    if (!config.apiKey) {
        return;
    };

    const prompt = `${args.join(' ')}`;
    var res;

    try {
        res = await openai.createCompletion({
            model: "text-davinci-002",
            prompt: prompt,
            temperature: 0.9,
            top_p: 0.9,
            max_tokens: 1024,
            stop: ["<|endoftext|>"],
        });
    } catch(err) {
        console.warn(err);
    };

    if (res) {
        res = res.data.choices[0].text;
        if (res.length > 2000) {
            const resArray = res.match(/[\s\S]{1,2000}/g)
            resArray.forEach((r) => {
                msg.channel.send(r);
            })
        } else {
            msg.channel.send(res);
        }
    }
}