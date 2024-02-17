const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

let db = null
const dbPath = path.join(__dirname, 'userData.db')

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log(e)
  }
}

initializeDBAndServer()

app.post('/register', async (request, response) => {
  try {
    const {username, name, password, gender, location} = request.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const userCheckQuery = `SELECT * FROM user WHERE username = '${username}'`
    const dbUser = await db.get(userCheckQuery)
    if (dbUser !== undefined) {
      response.status(400)
      response.send('User already exists')
    } else {
      if (password.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const userRegistrationQuery = `INSERT INTO user(username, name, password, gender, location) VALUES('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}')`
        const userRegistration = await db.run(userRegistrationQuery)
        response.send('User created successfully')
      }
    }
  } catch (e) {
    console.log(e)
  }
})

app.post('/login', async (request, response) => {
  try {
    const {username, password} = request.body
    const userCheckQuery = `SELECT * FROM user WHERE username = '${username}'`
    const dbUser = await db.get(userCheckQuery)
    if (dbUser === undefined) {
      response.status(400)
      response.send('Invalid user')
    } else {
      const passwordCheck = await bcrypt.compare(password, dbUser.password)
      if (!passwordCheck) {
        response.status(400)
        response.send('Invalid password')
      } else {
        response.send('Login success!')
      }
    }
  } catch (e) {
    console.log(e)
  }
})

app.put('/change-password', async (request, response) => {
  try {
    const {username, oldPassword, newPassword} = request.body
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const userCheckQuery = `SELECT * FROM user WHERE username = '${username}'`
    const dbUser = await db.get(userCheckQuery)
    const passwordCheck = await bcrypt.compare(oldPassword, dbUser.password)
    if (!passwordCheck) {
      response.status(400)
      response.send('Invalid current password')
    } else {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const updateQuery = `UPDATE user SET password = '${hashedPassword}'`
        const updatePassword = await db.run(updateQuery)
        response.send('Password updated')
      }
    }
  } catch (e) {
    console.log(e)
  }
})

app.get('/users', async (request, response) => {
  try {
    const userQuery = `SELECT * FROM user`
    const users = await db.all(userQuery)
    response.send(users)
  } catch (e) {
    console.log(e)
  }
})

module.exports = app
