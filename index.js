const express=require("express")

const bcrypt = require('bcrypt');

const jwt=require("jsonwebtoken")

const path=require("path")
const app=express()

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const databasePath = path.join(__dirname, "userdetails.db");

app.use(express.json()) //It is a built-in middleware function it recognizes the incoming request object as a JSON object, parses it, and then calls handler in every API call

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

  //middleware function

  const verfingToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
      response.status(401);
      response.send("Invalid JWT Token");
    } else {
      jwt.verify(jwtToken, "skygoaltech", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          request.username = payload.username;
          next();
        }
      });
    }
  };


  // api call to get highest run getter 
  app.get("/highest_runs/",verfingToken, async (req,res)=> {
    const {limit}=req.query
    try {
      const query=`SELECT 
      name,
      runs,
      team
  FROM 
      player
  ORDER BY 
      runs DESC
  LIMIT ${limit};`

  const responsedb=await database.all(query)
  res.send(responsedb)
    }catch(error) {
      res.status(500).send("Internal Server Error");
    }
  })


  //api call to highest strikerate

  app.get("/highest_strikerate/",verfingToken, async (req,res)=> {
    const {limit}=req.query
    try {
      const query=`SELECT 
      name,
      runs,
      team
  FROM 
      player
  ORDER BY 
  strike_rate DESC
  LIMIT ${limit};`

  const responsedb=await database.all(query)
  res.send(responsedb)
    }catch(error) {
      res.status(500).send("Internal Server Error");
    }
  })