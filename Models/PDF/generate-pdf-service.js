var pdf = require("pdf-creator-node")
var fs = require("fs")


module.exports.generatePDFdoc = (data) => {
    return new Promise((resolve, reject) => {

        const template = fs.readFileSync("./Views/myPosts.hbs", "utf8")

        const document = {
            html: template,
            data: { data: data },
            path: "./output.pdf",
            type: "",
        }

        pdf.create(document).then((res) => {
            console.log(res)
        }).catch((error) => {
            console.error(error)
        })
        resolve()
    })
}