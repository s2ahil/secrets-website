//jshint esversion:6

require('dotenv').config()
const express = require("express")
const app = express()
const ejs=require("ejs")
const mongoose = require("mongoose")
const encrypt =require("mongoose-encryption")
app.set('view engine','ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"))


console.log(process.env.API_KEY)

main().catch(err=>console.log(err));

async function main(){
   await mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser:true})
}


const userschema=  new mongoose.Schema({
    email:String,
    password:String
})



userschema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});

const user=new mongoose.model("user",userschema)

app.get("/",function(req,res){

    res.render("home")
})

app.get("/register",function(req,res){

    res.render("register")
})

app.get("/login",function(req,res){

    res.render("login")
})

app.post("/register", function(req,res){


   const newuser = new user({
      email : req.body.username,
      password : req.body.password
   })

   newuser.save(function(err){

    if(!err){
        console.log("aya");
        res.render("secrets")
       
    }
    else{
        res.send(err) 
    }
   });

})

app.post("/login",function(req,res){
    
    const username = req.body.username;
    const password = req.body.password;

    user.findOne({email:username},function(err,founduser){
        if(err){
            console.log(err)
        }else{
             if(founduser){
                if(founduser.password===password){
                    res.render("secrets")
                }
                else{
                    res.send("wrong password")
                }
             }

        }
    })


})





app.listen(3000,function(){
    console.log("started in 3000")
})

//1234