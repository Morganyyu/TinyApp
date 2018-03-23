var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')


app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs")

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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

function generateRandomString() {
  let output = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++)
  output += possible.charAt(Math.floor(Math.random() * possible.length));
  return output;
};

//Homepage
app.get("/", (req, res) => {
  res.end("Hello!");
});

//New page
app.get("/urls/new", (req, res) => {
  res.render("urls_new", { user: req.cookies["user_id"], email: req.cookies["email"], users: users });
});

//urls main page
app.get("/urls", (req, res) => {
  let arr = Object.entries(urlDatabase);
  let templateVars = { urls: arr, user: req.cookies["user_id"], email: req.cookies["email"], users: users };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body.longURL);
  let shortURL = generateRandomString();
  var longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                       users: users,
                       longURL: urlDatabase[req.params.id],
                       user: req.cookies["user_id"],
                       email: req.cookies["email"] };
  res.render("urls_show", templateVars);
});

//Update and redirect
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id]  = req.body.longURL;
  res.redirect("/urls");
});

//Delete link
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//Login link
app.get("/login", (req, res) => {
  let templateVars = {user: req.cookies["user_id"],
                      users: users,
                      email: req.cookies["email"],
                      password: req.cookies["password"]};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    res.sendStatus(400);
  } else {
    let matchPass = Object.values(users).find(user => user.email === email && user.password === password);
    if (!matchPass) {
      res.sendStatus(403);
    } else {
      res.cookie("user_id", matchPass.id);
      res.redirect('urls');
    }
  }
});

//Logout link
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("urls");
});


//Register link
app.get("/register", (req, res) => {
  let templateVars = {user: req.cookies["user_id"],
                      users: users,
                      email: req.cookies["email"],
                      password: req.cookies["password"]};
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  let { email, password } = req.body;
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Oh uh, bad request...");
  } else {
    let foundEmail = Object.values(users).find(user => user.email === email);
    if (!foundEmail) {
      users[user_id] = {id: user_id, email: email, password: password}
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


