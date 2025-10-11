import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app =express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.json({limit:'16kb'}));
app.use(express.urlencoded({limit:'16kb',extended:true}));
app.use(express.static('public'));

export {app}