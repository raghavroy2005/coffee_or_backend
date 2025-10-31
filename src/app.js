import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors";

const app = express()
// middlewares to handle request data and cookies from client
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// import user router
import userRouter from "./routes/user.routes.js"

//routes use to handle user related request
app.use("/api/v1/users", userRouter)

export { app }