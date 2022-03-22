// Import
const express = require('express')
const { engine } = require('express-handlebars')
const bodyParser = require('body-parser')
const clientSessions = require("client-sessions")
const app = express()
const HTTP_PORT = 3000
const hbs = require('handlebars')


// Databases
const userService = require('./Models/User/user-service')
const postService = require('./Models/Post/post-service')
const generatePDFService = require('./Models/PDF/generate-pdf-service')


// Сonfiguration 
app.use(express.static(__dirname + '/public'))
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: "panel" }))
app.set('view engine', 'hbs')
app.set("views", "./Views")
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())


// Client sessions configuration
app.use(clientSessions({
    cookieName: "session",
    secret: "somesecret",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}))


// Sets session
app.use((req, res, next) => {
    res.locals.session = req.session
    next()
})


// Detect active route
app.use(function (req, res, next) {
    let route = req.baseUrl + req.path
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "")
    next()
})


// Highlights route
hbs.registerHelper("navLink", (url, options) => {
    let activeCssClass = ' class="nav-link'
    const liCssClass = 'class="nav-item me-5"'
    if (url == app.locals.activeRoute) {
        activeCssClass += ' active"'
    }
    const navLinkCode = '<li ' + liCssClass + '><a href="' + url + '"' + activeCssClass + '">' + options.fn(this) + '</a ></li> '
    return navLinkCode
})


// Verification check, protector function
const ensureLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect("/login")
    } else {
        return next
    }
}


// Logs user out
app.get('/logout', (req, res) => {
    req.session.reset()
    res.redirect('/')
})


// Page with all users posts
app.get('/', (req, res) => {
    postService.getAllPosts().then((data) => {
        if (data.length > 0) {
            res.render('home', { data: data })
        } else {
            res.render('home', { error: "No data" })
        }
    }).catch((err) => {
        res.render('home', { error: "No data" })
    })
})


// Posts page
app.get('/myPosts', (req, res) => {
    ensureLogin(req, res)
    postService.getPosts(req.session.user).then((data) => {
        res.render('myPosts', { data: data })
    }).catch((err) => {
        res.render('myPosts', { error: "No data" })
    })
})


// Page where user can create posts
app.get('/createPost', (req, res) => {
    ensureLogin(req, res)
    res.render('createPost')
})


// Post process controller
app.post('/createPost', (req, res) => {
    ensureLogin(req, res)
    postService.createPost(req.session.user, req.body).then(() => {
        res.redirect('/myPosts')
    }).catch((err) => {
        res.render('/createPost', { error: err }, req.body)
    })
})


// Goes to post update page
app.get('/updatePost/:postId', (req, res) => {
    ensureLogin(req, res)
    postService.getPostById(req.params.postId).then((data) => {
        res.render('updatePost', { data: data })
    }).catch((err) => {
        res.render('updatePost', { error: err })
    })
})


// Post update process
app.post('/updatePost', (req, res) => {
    ensureLogin(req, res)
    postService.updatePost(req.body).then(() => {
        res.redirect('myPosts')
    }).catch((err) => {
        res.redirect('myPosts')
    })
})


// Deletes post
app.get('/deletePost/:postId', (req, res) => {
    ensureLogin(req, res)
    postService.deletePost(req.params.postId).then(() => {
        res.redirect('/myPosts')
    }).catch((err) => {
        res.redirect('/myPosts')
    })
})


// Refers to login page
app.get('/login', (req, res) => {
    res.render('login')
})


// Login process
app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent')
    userService.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        res.redirect('/')
    }).catch(err => {
        res.render("login", { errorMessage: err, userName: req.body.userName })
    })
})


// Go to register page
app.get('/register', (req, res) => {
    res.render('register')
})


// Registration process
app.post('/register', (req, res) => {
    userService.addUser(req.body).then(() => {
        res.redirect('/login')
    }).catch((err) => {
        res.render("register", { errorMessage: err, display: "", data: req.body })
    })
})


// Generates .pdf file with user information and posts
app.get('/generatePDF', (req, res) => {
    postService.getAllPosts().then((data) => {
        generatePDFService.generatePDFdoc(data).then(() => {
            res.redirect('/')
        })
    })
})


// 404 error, page handler
app.use((req, res) => {
    res.status(404).send("ERROR 404, NO PAGE FOUND")
})


// Start point of program, initialize date from database 
userService.initialize().then(postService.initialize).then(function () {
    app.listen(HTTP_PORT, function () {
        console.log("App listening on: " + HTTP_PORT)
    })
}).catch(function (err) {
    console.log("Unable to start server: " + err)
})