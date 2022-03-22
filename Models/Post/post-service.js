const moment = require('moment')
const userService = require('../User/user-service')
const { Sequelize, Op, Model, DataTypes } = require('sequelize')
const user = 'postgres'
const host = 'localhost'
const database = 'postgres'
const password = 'Applicant-2020'
const port = '8080'


const sequelize = new Sequelize(database, user, password, {
    port: port,
    host: host,
    dialect: 'postgres'
})


const Post = sequelize.define('Posts', {
    postId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: Sequelize.STRING,
    description: Sequelize.STRING,
    date: Sequelize.STRING,
    userId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'userId' }
    }
})


module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        try {
            sequelize.sync().then((data) => {
                resolve(data)
            })
        } catch (err) {
            reject("unable to sync the database")
        }
    })
}


module.exports.createPost = (userSession, postData) => {
    return new Promise((resolve, reject) => {
        userService.FindUserByEmail(userSession.email).then((userId) => {
            if (postData.title.trim() === '') {
                reject("Title can't be empty")
            } else if (postData.description.trim() === '') {
                reject("Description can't be empty")
            } else {
                Post.create({
                    title: postData.title,
                    description: postData.description,
                    date: (new Date()).toString(),
                    userId: userId
                }).then(() => {
                    resolve()
                })
            }
        })
    })
}


module.exports.getPosts = (userSession) => {
    return new Promise((resolve, reject) => {
        userService.FindUserByEmail(userSession.email).then((userId) => {
            Post.findAll({ where: { userId: userId } }).then((data) => {
                let posts = data.map(value => value.dataValues)
                posts = posts.map((value) => {
                    var result = moment(value.date).format('YYYY.MM.DD hh:mm')
                    value.date = result
                    return value
                })
                resolve(posts)
            })
        })
    })
}


module.exports.getPostById = (postId) => {
    return new Promise((resolve, reject) => {
        Post.findAll({ where: { postId: postId } }).then((data) => {
            const post = data.map(value => value.dataValues)
            resolve(post[0])
        }).catch((err) => {
            reject(err)
        })
    })
}


module.exports.updatePost = (postData) => {
    return new Promise((resolve, reject) => {
        if (postData.title.trim() === '') {
            reject("Title can't be empty")
        } else if (postData.description.trim() === '') {
            reject("Description can't be empty")
        } else {
            Post.update({
                title: postData.title,
                description: postData.description,
                date: postData.date
            }, { where: { postId: postData.postId } }).then(() => {
            }).then(() => {
                resolve()
            }).catch((err) => {
                reject(err)
            })
        }
    })
}


module.exports.getAllPosts = () => {
    return new Promise((resolve, reject) => {
        Post.findAll().then((data) => {
            let posts = data.map(value => value.dataValues)
            userService.getUsers().then((usersData) => {
                posts = posts.map((value) => {
                    var result = moment(value.date).format('YYYY.MM.DD hh:mm')
                    value.date = result
                    usersData.forEach(el => {
                        if (value.userId === el.userId) {
                            value.firstName = el.firstName
                            value.lastName = el.lastName
                        }
                    })
                    return value
                })
                resolve(posts)
            })
        }).catch((err) => {
            reject(err)
        })
    })
}


module.exports.deletePost = (postId) => {
    return new Promise((resolve, reject) => {
        Post.destroy({
            where: { postId: postId }
        }).then(function () {
            resolve()
        }).catch((err) => {
            reject(err)
        })
    })
}




