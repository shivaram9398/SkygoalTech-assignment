const express=require("express")

const bcrypt = require('bcrypt');

const jwt=require("jsonwebtoken")

const path=require("path")
const app=express()

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const databasePath = path.join(__dirname, "userdetails.db");

app.use(express.json())
console.log('Current directory:', __dirname);

let database;

const Server = async () => {
    try {
      database = await open({
        filename: databasePath,
        driver: sqlite3.Database,
      });
      app.listen(3000, () => {
        console.log("Started at 3000port");
      });
    } catch (e) {
      console.log(`DB Error: ${e.message}`);
      process.exit(1);
    }
  };
  
  Server();

//register api call using bycrpt create encrypt password with  hash method

  app.post("/register/", async (request, response) => {
    const {name,username, password, age} = request.body;
    const Password = await bcrypt.hash(request.body.password, 10);
    const Query = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await database.get(Query);
    if (dbUser === undefined) {
      const insertQuery = `
        INSERT INTO 
          user (name,username,password, age) 
        VALUES 
          (
            '${name}', 
            '${username}',
            '${Password}', 
            '${age}'
          )`;
      const dbResponse = await database.run(insertQuery);
      const newUserId = dbResponse.lastID;
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status = 400;
      response.send("User already exists");
    }
  });

// login api call using bycrpt compare method

  app.post("/login", async (request, response) => {
    const { username, password } = request.body;
    const Query = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await database.get(Query);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid User");
    } else {
      const Password = await bcrypt.compare(password, dbUser.password); //comparing passwords
      if (Password === true) {
        const payload = {
            username: username,
          };
          const jwtToken = jwt.sign(payload, "skygoaltech"); // arguments as payload and secret key
          response.send({ jwtToken });
      } else {
        response.status(400);
        response.send("Invalid Password");
      }
    }
  });
