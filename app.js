//jshint esversion:6

require('dotenv').config()
const express = require("express")
const app = express()
const ejs=require("ejs")
const mongoose = require("mongoose")
const session =require("express-session")
const passport=require("passport")
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')


app.set('view engine','ejs');
const bodyParser = require('body-parser');



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"))

// imp below body parser above mongoose connect
app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
   }))

//imp below session

app.use(passport.initialize());
app.use(passport.session());


main().catch(err=>console.log(err));

async function main(){
   await mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser:true})
  
}




const userschema=  new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
})

// imp for mongoose schema
userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);

const user=new mongoose.model("user",userschema)

// imp placement





passport.use(user.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
 
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
  

// imp placement

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){

    res.render("home")
})

app.route('/auth/google')
.get(passport.authenticate('google', {scope: ['profile']}));



app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });



app.get("/register",function(req,res){

    res.render("register")
})

app.get("/login",function(req,res){

    res.render("login")


    
})

app.get("/secrets",function(req,res){
   user.find({"secret":{$ne:null}},function(err,foundusers){
    if(err){
        console.log(err)
    }else{
        if(foundusers){
            res.render("secrets",{usersWithSecrets:foundusers})
            console.log("here",foundusers)
        }
    }
   })
})

app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){return next(err) }
        res.redirect("/")
    });
    
})

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login")
    }
})

app.post("/submit",function(req,res){

    const submittedsecret=req.body.secret;

    console.log(req.user.id)

    user.findById(req.user.id,function(err,founduser){
         if(err){
            console.log(err)
         }else{
            if(founduser){
                founduser.secret = submittedsecret;
                founduser.save(function(){
                    res.redirect("/secrets");
                });
            }
         }
    }) 
})
app.post("/register", function(req,res){

    user.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err)
            res.redirect("/register")
        }
        else{
           passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
           })
        }
    })
})


app.post("/login",function(req,res){
    
  const newuser =new user({
    username:req.body.username,
    password:req.body.password
  })

   req.login(newuser,function(err,result){
    if(err){
        console.log(err)
    }
    else{
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets")
        })
    }
   })

})





app.listen(3000,function(){
    console.log("started in 3000")
})

//1234