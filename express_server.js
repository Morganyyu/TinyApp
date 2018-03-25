const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  secret: 'fdisproject'
}));
app.set("view engine", "ejs")


const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    user_id: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    user_id: "userRandomID",
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

function urlsForUser(user_id) {
  var userURLS = {};
  for (let key in urlDatabase)
    if (urlDatabase[key].user_id === user_id) {
      userURLS[key] = urlDatabase[key];
    }
  return userURLS;
};

function generateRandomString() {
  let output = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++)
  output += possible.charAt(Math.floor(Math.random() * possible.length));
  return output;
};

//Homepage
app.get("/", (req, res) => {
  res.end("Hello!");
});

//URLs main page
app.get("/urls", (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = {
    user_id: user_id,
    user: users[user_id],
    urlDatabase: urlsForUser(user_id)
  };
  res.render("urls_index", templateVars);
});

//New page
app.get("/urls/new", (req, res) => {
  let user_id = req.session.user_id;
  if (user_id) {
    let templateVars = { user_id: user_id, user: users[user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//Redirect from shortURL to actual page
app.get("/u/:shortURL", (req, res) => {
  let fullURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(fullURL);
});

//Redirect to your edit URL page if logged in
app.get("/urls/:id", (req, res) => {
  let user_id = req.session.user_id;
  let shortURL = req.params.id;
  let templateVars = {
    shortURL: shortURL,
    user: users[user_id],
    longURL: urlDatabase[shortURL].longURL,
    user_id: req.session.user_id,
    email: req.session["email"]
  };
  res.render("urls_show", templateVars);
});

//Login page
app.get("/login", (req, res) => {
  let user_id = req.session.user_id;
  res.render("login", {user: users[user_id]});
});

//Register page
app.get("/register", (req, res) => {
  res.render("register", {user: users[req.session.user_id]});
});

//Add urls and user data to urlDatabase
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  let user_id = req.session.user_id;
  let urlObj = {
    longURL: longURL,
    user_id: user_id,
    user: users[user_id],
  };
  if (longURL) {
    urlDatabase[shortURL] = urlObj;
    res.redirect("/urls");
  } else {
    res.status(403).send("No Link entered")
  }
});

//Update and redirect
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  if (!req.session["user_id"]) {
    res.redirect("/urls");
  } else if (urlDatabase[shortURL].user_id === req.session["user_id"]) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});

//Delete cookie session
app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  if (urlDatabase[shortURL].user_id === req.session["user_id"]) {
    delete urlDatabase[req.params.id];
    console.log(urlDatabase[req.params.id])
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});

//Login then redirect to urls page
app.post("/login", (req, res) => {
  let {email, password} = req.body;
  if (!email || !password) {
    res.sendStatus(400);
  } else {
    let findEmail = Object.values(users).find(user => user.email === email);
    if (!findEmail || !bcrypt.compareSync(password, findEmail.password)) {
      res.sendStatus(403);
    } else {
      req.session.user_id = findEmail.id;
      res.redirect('urls');
    }
  }
});

//Logout and clear cookie sessions
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("urls");
});

//Register then redirect to urls page
app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  let { email, password } = req.body;
  let hashpassword = bcrypt.hashSync(password, 10)
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Oh uh, bad request...");
  } else {
    let foundEmail = Object.values(users).find(user => user.email === email);
    if (!foundEmail) {
      users[user_id] = {id: user_id, email: email, password: hashpassword}
      req.session.user_id = user_id;
      req.session.email = email;
      res.redirect("/urls");
    } else {
      res.status(400).send("Oh uh, bad request...");
    }
  }
});

//JSON stuff
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/users.json", (req, res) => {
  res.json(users);
});

//Server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


