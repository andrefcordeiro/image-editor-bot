var gm = require('gm')
const fs = require('fs')

async function deletaArquivo(path) {

    if (fs.existsSync(path)) { //verifica se o arquivo existe
        fs.unlink(path, (err) => {
            if (err) throw err

        })
    }
}

//alterando o tamanho da logo com base no tamanho da imagem de input
async function resizeImage(pathInput, pathOutput, width, height, callback) {

    await gm(pathInput)
        .resize(width, height)
        .write(pathOutput, (err) => {
            if (err) console.log(err)
            else {

                callback(pathOutput.substring(2), height / 1.7)
            }
        })
}

async function negative(pathInput, pathOutput, callback) {

    await gm(pathInput)
        .negative()
        .write(pathOutput, function (err) {
            if (err) return console.log(err)
            else {
                callback(pathOutput)
            }
        }
        )
}

async function sepia(pathInput, pathOutput, callback) {

    await gm(pathInput)
        .sepia()
        .write(pathOutput, function (err) {
            if (err) return console.log(err)
            else {
                callback(pathOutput)
            }
        }
        )
}

async function rotate90(pathInput, pathOutput, callback) {
    await gm(pathInput)
        .rotate("none", 90)
        .write(pathOutput, function (err) {
            if (err) return console.log(err)
            else {
                callback(pathOutput)
            }
        }
        )
}

async function cyberpunk(pathInput, pathOutput, callback) {

    let id = pathInput[pathInput.length - 5]

    await gm(pathInput)
        .identify((err, data) => {

            if (!err) {
                resizeImage("./images/utils/cyber-logo.png", `./images/utils/cyber-logo-resized${id}.png`, data.size.width, data.size.height, (pathOutLogo, y) => {

                    gm(pathInput)
                        .matteColor("yellow")
                        .draw(`image Over 0,${y} 0,0 ${pathOutLogo}`)
                        .write(pathOutput, (err) => {
                            if (err) console.log(err)
                            else {
                                deletaArquivo(pathOutLogo)
                                callback(pathOutput)
                            }
                        })

                })
            }
        })

}

async function oilpaint(pathInput, pathOutput, callback) {
    await gm(pathInput)
        .paint(8)
        .write(pathOutput, function (err) {
            if (err) return console.log(err)
            else {
                callback(pathOutput)
            }
        }
        )
}

async function charcoal(pathInput, pathOutput, callback) {

    await gm(pathInput)
        .charcoal()
        .write(pathOutput, function (err) {
            if (err) return console.log(err)
            else {
                callback(pathOutput)
            }
        }
        )
}

async function mosaic(pathInput, pathOutput, callback) {

    await gm(pathInput)
        .mosaic()
        .write(pathOutput, function (err) {
            if (err) return console.log(err)
            else {
                callback(pathOutput)
            }
        }
        )
}

async function noise(pathInput, pathOutput, callback) {

    await gm(pathInput)
        .noise("Multiplicative")
        .write(pathOutput, function (err) {
            if (err) return console.log(err)
            else {
                callback(pathOutput)
            }
        }
        )
}

module.exports = {

    negative: negative,
    sepia: sepia,
    rotate90: rotate90,
    cyberpunk: cyberpunk,
    oilpaint: oilpaint,
    charcoal: charcoal,
    mosaic: mosaic,
    noise: noise
}