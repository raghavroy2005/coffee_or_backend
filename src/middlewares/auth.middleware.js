import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import {User} from "../models/user.model";

export const vetifyJWT = asyncHandler(async (req, _, next) => {

    try{
        const token = req = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ","")

        if(!token){
            throw new ApiError(401, "unauthorized access, no token  provided ")
        }

        const decodedToken = jwt.verify(token, process.env.
        ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).
        select("-password -refresh") 
        
        if(!user){
            // TODO: discuss about frontend
            throw new ApiError(104,"Invalid Access Token")
        }

        req.user = user;
        next()


    }catch(error){
        throw new ApiError(401, error?.message || " Invalid access token")
    }
    
    
})
