const bcrypt = require('bcryptjs')
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


const User = sequelize.define('Users', {
    userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING
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


module.exports.addUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.findAll({ where: { email: userData.email } }).then((data) => {
            users = data.map(value => value.dataValues)
            if (typeof users[0] !== 'undefined') {
                if (users[0].email === userData.email) {
                    reject("User with this email already exist")
                }
            } else if (userData.firstName.trim() === '') {
                reject("First Name can't be empty")
            }
            else if (userData.password !== userData.password2) {
                reject("Passwords do not match")
            }
            else if (userData.lastName.trim() === '') {
                reject("Last Name can't be empty")
            }
            else if (userData.email.trim() === '') {
                reject("Email can't be empty")
            }
            else if (userData.password.trim() === '') {
                reject("Password can't be empty")
            }
            else if (userData.password2.trim() === '') {
                reject("Password re-enter can't be empty")
            }
            else {
                bcrypt.genSalt(10)
                    .then(salt => bcrypt.hash(userData.password, salt))
                    .then(hash => {
                        userData.password = hash
                        User.create({
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            password: userData.password,
                            email: userData.email
                        }).then(() => {
                            resolve()
                        })
                    }).catch(err => {
                        console.log(err)
                    })
            }
        })
    })
}


module.exports.checkUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.findAll({ where: { email: userData.email } }).then((data) => {
            users = data.map(value => value.dataValues)
            try {
                bcrypt.compare(userData.password, users[0].password).then((result) => {
                    if (!result) {
                        reject("Incorrect Password for user: ", users[0].userName)
                    } else {
                        resolve(users[0])
                    }
                })
            } catch (err) {
                reject("There was an error verifying the user: ", err)
            }
        }
        )
    })
}


module.exports.FindUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        User.findAll({ where: { email: email } }).then((data) => {
            users = data.map(value => value.dataValues)
            resolve(users[0].userId)
        }
        )
    })
}


module.exports.getUsers = () => {
    return new Promise((resolve, reject) => {
        User.findAll().then((data) => {
            let users = data.map(value => value.dataValues)
            users = users.map((value) => {
                delete value.password
                delete value.email
                delete value.createdAt
                delete value.updatedAt
                return value
            })
            resolve(users)
        })
    })
}

