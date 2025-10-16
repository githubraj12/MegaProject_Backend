import connectDB from "./db/index.js";
import dotenv from "dotenv";
import express from "express";
import { app } from "./app.js";
const port = process.env.PORT || 8000;

dotenv.config({
    path : './.env'
});


connectDB()
.then(()=>{

    app.listen(port,()=>{
        console.log(`Server is running at port ${port}`);
    })
})
.catch((err)=>{
    console.log('MONGODB connection failed !! : ', err)
})





































// password
//  3uRSt95OhQUHZjyp