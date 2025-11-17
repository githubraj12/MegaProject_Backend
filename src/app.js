import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";

dotenv.config();
const app =express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.json({limit:'16kb'}));
app.use(express.urlencoded({limit:'16kb',extended:true}));
app.use(express.static('public'));
app.use(cookieParser())


//router imports
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/user.routes.js"


// routes declaration
app.use("/api/v1/users",userRouter);
app.use("/api/v1/videos", videoRouter)

export {app}