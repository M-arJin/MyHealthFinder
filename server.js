const express = require("express")
const db = require("siennasql")
const EQ = require("./eq")
const crypto = require("crypto")
const Encrypto = require("crypto-js")
const { profile } = require("console")
db.connect("MyHealthFinder.db")

const app = express()
const port = 3000


let ProfileID = ""
let ProfileName = ""

let overallLang = "false"

let totalEnglish = []
let totalSpanish = []

const key = process.env.KEY

onEnglish()
onSpanish()


async function onEnglish() {
    let dataFromAPI = await fetch("https://health.gov/myhealthfinder/api/v3/topicsearch.json?lang=en")
    let data = await dataFromAPI.json()

    let concept = data.Result.Resources.Resource

    for (let i = 0; i < concept.length; i++) {
        let totalObj = {}

        totalObj.Title = concept[i].Title
        totalObj.Categories = concept[i].Categories
        totalObj.LastUpdate = concept[i].LastUpdate
        totalObj.ImageURL = concept[i].ImageUrl

        let Content = concept[i].Sections.section

        totalObj.Detail = []

        for (let j = 0; j < Content.length; j++) {
            let detailObj = {}
            detailObj.Title = Content[j].Title
            detailObj.Content = Content[j].Content
            totalObj.Detail.push(detailObj)
        }
        totalEnglish.push(totalObj)

        //STRING TOTAL ARRAY BEFORE SENDING AND PARSE ON ARRIVAL TO CLIENT
    }

    console.log("active")
}

async function onSpanish() {
    let dataFromAPI = await fetch("https://health.gov/myhealthfinder/api/v3/topicsearch.json?lang=es")
    let data = await dataFromAPI.json()

    let concept = data.Result.Resources.Resource

    for (let i = 0; i < concept.length; i++) {
        let totalObj = {}

        totalObj.Title = concept[i].Title
        totalObj.Categories = concept[i].Categories
        totalObj.LastUpdate = concept[i].LastUpdate
        totalObj.ImageURL = concept[i].ImageUrl

        let Content = concept[i].Sections.section

        totalObj.Detail = []

        for (let j = 0; j < Content.length; j++) {
            let detailObj = {}
            detailObj.Title = Content[j].Title
            detailObj.Content = Content[j].Content
            totalObj.Detail.push(detailObj)
        }
        totalSpanish.push(totalObj)

        //STRING TOTAL ARRAY BEFORE SENDING AND PARSE ON ARRIVAL TO CLIENT
    }

    console.log("active")
}

app.get(
    "/info",
    async function (request, response) {
        if (overallLang === "false") {
            let dataPost = JSON.stringify(totalEnglish)
            response.json(dataPost)
        } else if (overallLang === "true") {
            let dataPost = JSON.stringify(totalSpanish)
            response.json(dataPost)
        }
    }
)

let totalSpecific = []

app.get(
    "/infoSpecific",
    async function (request, response) {
        let dataPost = JSON.stringify(totalSpecific)
        response.json(dataPost)
    }
)

app.get(
    "/LanguageSwitch",
    async function (request, response) {
        let language = request.query.info

        if (language === "true") {
            overallLang = "true"
            response.json(totalSpanish)
            return
        } else if (language === "false") {
            overallLang = "false"
            response.json(totalEnglish)
            return
        }


    }
)

app.get(
    "/bookmark",
    async function (request, response) {
        let Bookmark = request.query.value

        let EBookmark = Encrypto.AES.encrypt(Bookmark, key).toString()

        let sql = "INSERT INTO BOOKMARK (USER_ID, BOOKMARK) VALUES(?, ?) "

        db.run(sql, [ProfileID, EBookmark])

        response.json("success")
    }
)

app.get(
    "/bookmarkUncheck",
    async function (request, response) {
        let info = request.query.value

        let sql = "SELECT * FROM BOOKMARK WHERE USER_ID = ?"
        let result = db.run(sql, [ProfileID])

        for (let i = 0; i < result.length; i++) {
            let current = result[i].BOOKMARK
            let DCurrent = Encrypto.AES.decrypt(current, key).toString(Encrypto.enc.Utf8)

            if (DCurrent === info) {
                let sql2 = "DELETE FROM BOOKMARK WHERE BOOKMARK = ?"
                db.run(sql2, [current])

                response.json("success")
                return
            } 
        }
        response.json("fail")


    }
)

app.get(
    "/ClearBook",
    async function (request, response) {
        let info = request.query.info

        let sql = "SELECT * FROM BOOKMARK WHERE USER_ID = ?"
        let result = db.run(sql, [ProfileID])

        for (let i = 0; i < result.length; i++) {
            let current = result[i].BOOKMARK
            let DCurrent = Encrypto.AES.decrypt(current, key).toString(Encrypto.enc.Utf8)
           
            if (DCurrent === info) {
              
                let sql2 = "DELETE FROM BOOKMARK WHERE BOOKMARK = ?"
                db.run(sql2, [current])

                response.json("success")
                return
            } 
        }
        response.json("fail")
    }
)

app.get(
    "/checkLoad",
    async function (request, response) {
        let info = request.query.value
      

        let sql = "SELECT * FROM BOOKMARK WHERE USER_ID = ?"
        let result = db.run(sql, [ProfileID])



        for (let i = 0; i < result.length; i++) {
            let current = result[i].BOOKMARK
            let DCurrent = Encrypto.AES.decrypt(current, key).toString(Encrypto.enc.Utf8)
       
            if (DCurrent === info) {
                response.json("success")
                return
            } 
        }

        response.json("fail")


    }
)

app.get(
    "/retrieveBook",
    async function (request, response) {
        let sql = "SELECT * FROM BOOKMARK WHERE USER_ID = ?"

        let data = db.run(sql, [ProfileID])

        let holder = []

        for (let i = 0; i < data.length; i++) {
            let held = {}
            let current = data[i].BOOKMARK
            held.result = Encrypto.AES.decrypt(current, key).toString(Encrypto.enc.Utf8)
     

            for (let j = 0; j < totalEnglish.length; j++) {
                let currentTopic = totalEnglish[j].Title
                if (currentTopic === held.result) {
                    let info = totalEnglish[j]
                    holder.push(info)
                }
            }

            for (let j = 0; j < totalSpanish.length; j++) {
                let currentTopic = totalSpanish[j].Title
                if (currentTopic === held.result) {
                    let info = totalSpanish[j]
                    holder.push(info)
                }
            }
        }
        response.json(holder)

    }
)

app.get(
    "/PropertyUpdate",
    async function (request, response) {
        totalSpecific = []
        let data = request.query.userProperty

        data = data.split(",")
        let TobaccoUse = data[0]
        let Pregnancy = data[1]
        let Gender = data[2]
        let Age = data[3]
        let SexuallyA = data[4]
        let language = "en"
        if (overallLang === "false") {
            language = "en"
        } else {
            language = "es"
        }

    



        let dataFromAPI = await fetch("https://health.gov/myhealthfinder/api/v3/myhealthfinder.json?lang=" + language + "&age=" + Age + "&sex=" + Gender + "&tobaccoUse=" + TobaccoUse + "&sexuallyActive=" + SexuallyA + "&pregnant=" + Pregnancy + "&category=All")
        let info = await dataFromAPI.json()

        let concept = info.Result.Resources.all.Resource

        for (let i = 0; i < concept.length; i++) {
            let totalObj = {}

            totalObj.Title = concept[i].Title
            totalObj.Categories = concept[i].Categories
            totalObj.LastUpdate = concept[i].LastUpdate
            totalObj.ImageURL = concept[i].ImageUrl

            let Content = concept[i].Sections.section

            totalObj.Detail = []

            for (let j = 0; j < Content.length; j++) {
                let detailObj = {}
                detailObj.Title = Content[j].Title
                detailObj.Content = Content[j].Content
                totalObj.Detail.push(detailObj)
            }
            totalSpecific.push(totalObj)

            //STRING TOTAL ARRAY BEFORE SENDING AND PARSE ON ARRIVAL TO CLIENT
        }


        console.log("active")
        response.json("success")
        //totalSpecific
    }
)

app.get(
    "/History",
    async function (request, response) {
        let post = request.query.Title

        post = post.split(",")
        let Topic = post[0]
        let userID = post[1]

        let ETopic = Encrypto.AES.encrypt(Topic, key).toString()

        let sql = "INSERT INTO HSEARCH (USER_ID, SEARCH) VALUES(?, ?)"
        db.run(sql, [userID, ETopic])
        response.json("success")
    }
)

app.get(
    "/requestSH",
    async function (request, response) {
        let pull = request.query.info
  

        let sql = "SELECT SEARCH FROM HSEARCH WHERE USER_ID = ?"
        let data = db.run(sql, [pull])
  
        let holder = []

        for (let i = 0; i < data.length; i++) {
            let held = {}
            let current = data[i].SEARCH
            held.result = Encrypto.AES.decrypt(current, key).toString(Encrypto.enc.Utf8)
      

            for (let j = 0; j < totalEnglish.length; j++) {
                let currentTopic = totalEnglish[j].Title
                if (currentTopic === held.result) {
                    let info = totalEnglish[j]
                    holder.push(info)
                }
            }

            for (let j = 0; j < totalSpanish.length; j++) {
                let currentTopic = totalSpanish[j].Title
                if (currentTopic === held.result) {
                    let info = totalSpanish[j]
                    holder.push(info)
                }
            }
        }
        response.json(holder)
    }
)

app.get(
    "/userdetails",
    async function (request, response) {
       
        let userDetails = []
        let userObj = {}

        userObj.ID = ProfileID
        userObj.Name = ProfileName

        userDetails.push(userObj)

        response.json(userDetails)



    }
)



app.get(
    "/detail",
    async function (request, response) {
        let value = request.query.value
     
        for (let i = 0; i < totalEnglish.length; i++) {
            let currentTopic = totalEnglish[i].Title
            if (currentTopic === value) {
                let info = totalEnglish[i]
                let dataPost = JSON.stringify(info)
                response.json(dataPost)
                return
            }
        }

        for (let i = 0; i < totalSpanish.length; i++) {
            let currentTopic = totalSpanish[i].Title
            if (currentTopic === value) {
                let info = totalSpanish[i]
                let dataPost = JSON.stringify(info)
                response.json(dataPost)
                return
            }
        }


    }

)

app.get(
    "/search",
    async function (request, response) {

        let value = request.query.input
        let result = []


        for (let i = 0; i < totalEnglish.length; i++) {
            let currentTopic = totalEnglish[i].Title
            let currentCategory = totalEnglish[i].Categories

            if (currentTopic.toLowerCase().includes(value.toLowerCase())) {
                result.push(totalEnglish[i])
            } else if (currentCategory.toLowerCase().includes(value.toLowerCase())) {
                result.push(totalEnglish[i])
            }
        }

        if (result.length === 0) {
            response.json("fail")
            return
        }
        let dataPost = JSON.stringify(result)


        response.json(dataPost)
    }
)


app.get(
    "/login",
    async function (request, response) {
        let login = request.query.userInfo

        login = login.split(",")

        let Username = login[0].trim()
        let Password = login[1].trim()

        let CurrentHPassword = hashMessage(Password)
      
        let sql = "SELECT USERNAME FROM USERS WHERE USERNAME = ?"
        let UsernameResult = db.run(sql, [Username])
        if (UsernameResult.length === 0) {
            response.json("fail")
            return
        }

        let sql2 = "SELECT PASSWORD FROM USERS WHERE USERNAME = ?"
        let PasswordResult = db.run(sql2, [Username])
      
        if (PasswordResult[0].PASSWORD === CurrentHPassword) {
            let sql3 = "SELECT ID FROM USERS WHERE USERNAME = ? AND PASSWORD = ?"
            let IDresult = db.run(sql3, [Username, CurrentHPassword])
            console.log(IDresult)
            let IDset = IDresult[0].ID
            console.log(IDset)
     
            response.json("success")
            ProfileName = Username
            ProfileID = IDset
            return
        }



        response.json("fail")
    }

)

app.get(
    "/DeleteHistory",
    async function (request, response) {
        let information = request.query.info

        let sql = "SELECT * FROM HSEARCH WHERE USER_ID = ?"
        let Htopics = db.run(sql, [ProfileID])

        for (let i = 0; i < Htopics.length; i++) {
            let current = Htopics[i].SEARCH
            let decrypting = Encrypto.AES.decrypt(current, key).toString(Encrypto.enc.Utf8)
            if (decrypting === information) {
                let sql2 = "SELECT ID FROM HSEARCH WHERE SEARCH = ?"
                let index = db.run(sql2, [Htopics[i].SEARCH])
                index = index[0].ID
                let sql3 = "DELETE FROM HSEARCH WHERE ID = ?"

                db.run(sql3, [index])
                response.json("niggals")
                return
            }
        }

        response.json("Cum")
    }
)


app.get(
    "/deleteProfile",
    async function (request, response) {
        let currentUser = ProfileID

        let sql = "DELETE FROM USERS WHERE ID = ?"
        db.run(sql, [currentUser])

        let sql2 = "DELETE FROM HSEARCH WHERE USER_ID = ?"
        db.run(sql2, [currentUser])

        ProfileID = ""
        ProfileName = ""

        response.json("Confirmed")
    }
)

app.get(
    "/registration",
    async function (request, response) {
        let registration = request.query.userInfo
  

        registration = registration.split(",")

        let Username = registration[0]
        let Password = registration[1].trim()
        let cPassword = registration[2].trim()

        if (Password !== cPassword) {
            response.json("fail")
            return
        }

        let sqlCheck = db.run("SELECT * FROM USERS")
        
        for (let i = 0; i < sqlCheck.length; i++) {
            let egg = sqlCheck[i].USERNAME
            if (egg === Username) {
                response.json("fail")
                return
            }
        }

        let hPassword = hashMessage(Password)


        let sql = "INSERT INTO USERS(USERNAME, PASSWORD) VALUES(?, ?)"

        db.run(sql, [Username, hPassword])



        response.json("success")
    }

)

function hashMessage(message) {
    let hash = crypto.createHash('sha512', process.env.HASH_KEY)
    hash.update(message)
    let cipherText = hash.digest('base64')
    return cipherText
}





//Loads index.html by default
app.use(
    express.static("public")
)

//Confirms Server is Online
app.listen(
    port,
    () => {
        console.log(`Listening on port ${port}`)
    }
)




