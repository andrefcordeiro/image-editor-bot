var gm = require('gm')
var request = require('request');
const graphicks = require("./Graphicks.js")
var dotenv = require('dotenv')
dotenv.config()
const twit = require("twit")
var fs = require('fs');
const { callbackify } = require('util');

const user = new twit({
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token: process.env.access_token,
    access_token_secret: process.env.access_token_secret

})

//função que gerar a imagem com a edição 
async function generateImage(pathInput, pathOutput, tipoDeEdicao) {

    return new Promise(async (resolve) => {

        if (tipoDeEdicao === "negative") {

            await graphicks.negative(pathInput, pathOutput, (pathOutput) => {
                console.log("NEGATIVE >> Arquivo criado em: " + pathOutput)
                resolve()
            })
        }
        else if (tipoDeEdicao === "sepia") {
            await graphicks.sepia(pathInput, pathOutput, (pathOutput) => {
                console.log("SEPIA >> Arquivo criado em: " + pathOutput)
                resolve()
            })

        }
        else if (tipoDeEdicao === "oilpaint") {
            await graphicks.oilpaint(pathInput, pathOutput, (pathOutput) => {
                console.log("OILPAINT >> Arquivo criado em: " + pathOutput)
                resolve()
            })
        }
        else if (tipoDeEdicao === "cyberpunk") {
            await graphicks.cyberpunk(pathInput, pathOutput, (pathOutput) => {
                console.log("CYBERPUNK >> Arquivo criado em: " + pathOutput)
                resolve()
            })

        }
        else if (tipoDeEdicao === "charcoal") {
            await graphicks.charcoal(pathInput, pathOutput, (pathOutput) => {
                console.log("CHARCOAL >> Arquivo criado em: " + pathOutput)
                resolve()
            })

        }
        else if (tipoDeEdicao === "mosaic") {
            await graphicks.mosaic(pathInput, pathOutput, (pathOutput) => {
                console.log("MOSAIC >> Arquivo criado em: " + pathOutput)
                resolve()
            })

        }
        else if (tipoDeEdicao === "noise") {
            await graphicks.noise(pathInput, pathOutput, (pathOutput) => {
                console.log("NOISE >> Arquivo criado em: " + pathOutput)
                resolve()
            })

        }
        else {
            console.log("Tipo inválido")
            resolve()
        }
    })

}

//função que recebe as imagens da api do twitter e faz o download das mesmas, retornando a quantidade de imagens processadas
async function getImageFromTweet(urlImage, pathInput) {

    return new Promise(resolve => {

        // console.log(urlImage)
        gm(request(urlImage)).write(pathInput, async (err) => {
            if (err) console.log(err)
            else {
                console.log(`Arquivo baixado\n`)
                resolve()
            }
        })

    })
}

//função que faz upload das imagens no twitter
async function uploadImage(pathOutput) {

    console.log(pathOutput)

    let imageInBase64 = await fs.readFileSync(pathOutput, { encoding: 'base64' })
    let response = await user.post("media/upload", { media: imageInBase64 })

    // console.log(response.data)
    console.log(`\nmedia ${pathOutput} uploaded\n`)
    return response.data.media_id_string
}

async function postReplyWithImages(mediaIds, idOfTweet, usernameOfTweet) {

    console.log("mediaIds: " + mediaIds)

    let params = {
        in_reply_to_status_id: idOfTweet,
        media_ids: mediaIds,
        status: "@" + usernameOfTweet
    }

    await user.post("statuses/update", params,
        (error) => {
            if (!error) {
                console.log("REPLY ENVIADO")
            }
        })
}

//função que cria e posta o reply
async function reply(Images, idOfTweet, usernameOfTweet, tipoDeEdicao) {

    let urlImage;
    let cont = 0;
    let mediaIds = []
    let pathInput, pathOutput

    for (let image of Images) {
        pathInput = `./images/input${parseInt(cont) + 1}.jpg`
        pathOutput = `./images/output${parseInt(cont) + 1}.jpg`

        urlImage = image.media_url_https //recebe a url da imagem

        await getImageFromTweet(urlImage, pathInput).then(async () => {

            await generateImage(pathInput, pathOutput, tipoDeEdicao).then(async () => {
                mediaIds.push(await uploadImage(pathOutput))
            })

        })
        cont++;
    }

    postReplyWithImages(mediaIds, idOfTweet, usernameOfTweet)
}

//função que busca os últimos 30 tweets de um usuário e compara se um destes está em reply ao tweet encontrado na função searchTweets
//retorna true caso não encontre nenhum tweet do bot ou nenhum tweet que satisfaça a condição acima
//retorna false quando encontra tweet que satisfaça a condição 
async function getLastTweets(username, idOfTweet) {
    console.log("Username do bot: " + username)
    const replies = await user.get("statuses/user_timeline",
        { screen_name: username, count: 30 }
    )

    if (typeof replies.data !== undefined && replies.data.length > 0) {
        // encontrando se já existe um reply do bot para o tweet com a hashtag
        let find = await replies.data.find(e => e.in_reply_to_status_id_str === idOfTweet)
        // console.log("Tweet encontrado: " + find)
        if (find === undefined) {
            return true
        }
        return false
    }

    else {
        return true;
    }
}

//função que retorna o tweet object de um id de tweet específico
//retorna um array contendo as imagens caso elas existam e false caso ela não existam
async function hasImage(idOfTweet) { // id do tweet original (que possui as imagens)

    var response = await user.get("statuses/show/:id", { id: idOfTweet, include_entities: true, tweet_mode: "extended" })
    // console.log(response.data.extended_entities.media);
    let Images = response.data.extended_entities.media

    if (response.data.entities.media.length > 0) {
        return Images
    }
    else {
        return null
    }
}

//função que exclui os arquivos de output gerados na execução anterior do programa
async function deleteFiles() {

    let cont = 1;

    while (fs.existsSync(`./images/output${cont}.png`)) {

        fs.unlink(`./images/output${cont}.png`, (err) => {
            if (err) throw err
            else console.log("arquivo deletado")
        })
        cont++;
    }

}

//função que procura o último tweet com a hashtag e faz a chamada das próximas funções 
async function searchTweets() {

    let tiposDeEdicao = ["negative", "sepia", "oilpaint", "cyberpunk", "charcoal", "mosaic", "noise"]
    await deleteFiles()

    let params = { q: "#ImageEditorBot", result_type: "mixed", count: 5, include_entities: true, exclude: "retweets" }

    await user.get("search/tweets", params, async (err, data, response) => {

        try {
            let tweets = data.statuses

            if (typeof tweets !== 'undefined' && tweets.length > 0) { //verifica a requisição

                for (let tweet of tweets) {

                    let texto = tweet.text.split(" ")
                    console.log(texto)

                    if (tweet.text.split(" ").length >= 2) { // verifica se os parametros do tweet foram passados corretamente

                        if (tweet.entities.media) { //verifica se há mídia no tweet
                            let tipoDeEdicao = texto[1] //pegando o tipo de edição do texto do tweet

                            if (tiposDeEdicao.includes(tipoDeEdicao)) { //verifica se o tipo de edição é valido

                                let shouldReply = await getLastTweets("imageeditorbot", tweet.id_str)

                                if (shouldReply === true) {
                                    console.log("\nTweet: '" + tweet.text + "' Tweet id: " + tweet.id_str + "\n")
                                    await reply(tweet.extended_entities.media, tweet.id_str, tweet.user.screen_name, tipoDeEdicao)
                                    break
                                }
                            }
                        }

                        //procurar se há midia no tweet acima deste (caso ele exista)
                        //verifica se está em reply
                        else if (tweet.in_reply_to_status_id_str) {

                            if (tweet.text.split(" ").length >= 2) { // verifica se os parametros do tweet foram passados corretamente

                                let tipoDeEdicao = texto[2] //pegando o tipo de edição do texto do tweet
                                if (tiposDeEdicao.includes(tipoDeEdicao)) { //verifica se o tipo de edição é valido

                                    let shouldReply = await getLastTweets("imageeditorbot", tweet.id_str)

                                    if (shouldReply === true) {

                                        let images = await hasImage(tweet.in_reply_to_status_id_str)

                                        if (images !== null) {
                                            await reply(images, tweet.id_str, tweet.user.screen_name, tipoDeEdicao)
                                            break
                                        }
                                        else {
                                            console.log("Não há imagem no tweet original")
                                        }

                                    }
                                }
                            }
                        }

                        else {
                            console.log("Não há imagem no tweet")
                        }
                    }
                    else {
                        console.log("Parâmetros passados de maneira errada")
                    }
                }
            }
        }
        catch (err) {
            console.log(err)
        }
    })

}

setInterval(searchTweets, 60000)
// searchTweets()

