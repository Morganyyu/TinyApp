var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')





app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs")

let urlDatabase = {
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
}

function urlsForUser(user_id) {
  // TODO: should return the same TYPE of thing as urlDatabase, but only the right URLs
  var userURLS = {};
  for (let key in urlDatabase)
    if (urlDatabase[key].user_id === user_id) {
      userURLS[key] = urlDatabase[key];
    }
  return userURLS;
}

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

//urls main page
app.get("/urls", (req, res) => {
  let user_id = req.cookies.user_id;
  let templateVars = {
    user_id: req.cookies["user_id"],
    email: req.cookies["email"],
    urlDatabase: urlsForUser(user_id)
  };
  res.render("urls_index", templateVars);
});

//New page
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    let templateVars = { user_id: req.cookies["user_id"], users: users };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  var shortURL = req.params.id;
  let templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user_id: req.cookies["user_id"],
    email: req.cookies["email"]
  };
  res.render("urls_show", templateVars);
});

//Login link
app.get("/login", (req, res) => {
  // let templateVars = {user_id: req.cookies["user_id"],
  //                     users: users,
  //                     email: req.cookies["email"],
  //                     password: req.cookies["password"]};
  res.render("login");
});

//Register link
app.get("/register", (req, res) => {
  let templateVars = {user_id: req.cookies["user_id"],
                      email: req.cookies["email"],
                      password: req.cookies["password"]};
  res.render("register", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  let urlObj = {
     longURL: longURL,
     user_id: req.cookies["user_id"]
  }
  if (longURL) {
     urlDatabase[shortURL] = urlObj;
     console.log(urlDatabase);
     res.redirect("/urls");
  } else {
     res.status(403).send("No Link entered")
  }
});



//Update and redirect
app.post("/urls/:id", (req, res) => {
  var shortURL = req.params.id;
  if (!req.cookies["user_id"]) {
    res.redirect("/urls");
  } else if (urlDatabase[shortURL].user_id === req.cookies["user_id"]) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});

//Delete link
app.post("/urls/:id/delete", (req, res) => {
  var shortURL = req.params.id;
  if (urlDatabase[shortURL].user_id === req.cookies["user_id"]) {
    delete urlDatabase[req.params.id];
    console.log(urlDatabase[req.params.id])
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});



app.post("/login", (req, res) => {
  let {email, password} = req.body;
  if (!email || !password) {
    res.sendStatus(400);
  } else {
    let findEmail = Object.values(users).find(user => user.email === email);
    if (!findEmail || !bcrypt.compareSync(password, findEmail.password)) {
      res.sendStatus(403);
    } else {
      res.cookie("user_id", findEmail.id);
      res.redirect('urls');
    }
  }
});

//Logout link
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("urls");
});



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
      res.cookie("user_id", user_id);
      res.cookie("email", email);
      res.redirect("/urls");
    } else {
      res.status(400).send("Oh uh, bad request...");
    }
  }
});

//json stuff
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/users.json", (req, res) => {
  res.json(users);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


