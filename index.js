if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");

// sql import
var mysql = require("mysql");

// creating connection between sql and node js
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "loginModules"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("sql Connected!");

  //   returning email
  const find_email = async (email) => {
    let user = await {};
    await con.query(
      `select * from user where email = ?`,
      [email],
      async (err, row, field) => {
        if (err) throw err;
        user = await {...row[0]};
      }
    );
    return await user;
  }

  //   returning Id
  function find_Id(id) {
    const User = con.query(
      `select * from user where Id = ?`,
      [id],
      (err, row, field) => {
        if (err) throw err;
        
        return row[0];
      }
    );

    return User;
  }

  con.query(`select * from user`, (err, user, field) => {
    if (err) throw err;
    //console.log(user);

    const initializedPassport = require("./passport-config");
    initializedPassport(
      passport,
      email => find_email(email),
      id => find_Id(id)
    );

    app.set("view-engine", "ejs");
    app.use(express.urlencoded({ extended: false }));
    app.use(flash());
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
      })
    );

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(methodOverride("_method"));

    app.get("/", checkAuthenticated, (req, res) => {
      res.render("index.ejs", { name: req.user.name });
    });

    // Login######################################
    app.get("/login", checkNotAuthenticated, (req, res) => {
      res.render("login.ejs");
    });

    app.post(
      "/login",
      checkNotAuthenticated,
      passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "login",
        failureFlash: true
      })
    );

    // register##################################
    app.get("/register", checkNotAuthenticated, (req, res) => {
      res.render("register.ejs");
    });

    app.post("/register", checkNotAuthenticated, async (req, res) => {
      try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const values = {
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword
        };
        con.query(`insert into user set ?`, values, (err, row, fields) => {
          if (err) throw err;
          console.log(row);
        });
        res.redirect("/login");
      } catch {
        res.redirect("/register");
      }
    });

    app.delete("/logout", (req, res) => {
      req.logout();
      res.redirect("/login");
    });

    function checkAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect("/login");
    }

    function checkNotAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return res.redirect("/");
      }
      next();
    }
    // databse query ends here
  });
  //   connect ends here
});

app.listen(5000);
