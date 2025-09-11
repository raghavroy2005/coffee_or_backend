// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path:'./env'
})






connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () =>{
        console.log(` Server is running on port :
        ${process.env.PORT}`); 
    })
})
.catch((err) => {
    console.error("MONGO db connection error", err);
})



/*
import express from "express";
const app=express()

( async () => {
    try {
        mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERRR", error);
            throw error
        } ) 

        app.listen(process.env.PORT,() => {
            console.log
        })
    } catch (error) {
        console.error("ERROR",error)
        throw err

    }
})()
    */