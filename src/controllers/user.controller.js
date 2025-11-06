
import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uplodeOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

// helper function to generate access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}
    }catch (erroer){
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

// register user controller
 const registerUser = asyncHandler (async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    // it store date in req.body server
    const {fullname, email,username, password} = req.body;
    console.log(req.body);
 


    // all fields are required
    if(
        [fullname , email, username, password].some((field) => 
        field?.trim() === "" )
    ) {
        throw new ApiError(400," All file are required")
    }


    // it find user exist or not
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    


    // how to store avatar and coverImage 
    // due to cause of multer we have we have req.files or req.file
    // ?. this is optional changing if file exist access it otherwis
    //  give undefine not  error

    const avatarLocalPath = req.files?.avatar[0]?.path;
   /// const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
   let coverImageLocalPath ;
   if(req.files && Array.isArray(req.files.coverImage) && 
   req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
   }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar files is required")
    }

    
    // uplode avatar on cloudinary
    const avatar = await uplodeOnCloudinary(avatarLocalPath)
    const coverImage = await uplodeOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Failed to uplode avatar image")
    }

    // create user object and store in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email : String(email).trim().toLowerCase(),
        password,
        username: username.toLowerCase(),
    })

    // remove password and refresh token from response
    const createdUser = await User.findById(user.id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong wlile registering the user")
    }

    // API response
    return res.status(201).json(
        new ApiResponse(201, createdUser ,"User registered successfully")
    )


 })

// login user controller
const loginUser = asyncHandler(async (req, res) =>{
    //req body -> data
    // username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie 

    const {email, username, password} = req.body;

    // validation
    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    // find the user
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    // check for user existence
    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    // check for password
    const isPasswordValid = await user.isPasswordCorrect
    (password)

    // invalid password
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    } 

    // generate access and refresh token
    const {accessToken, refreshToken} = await 
    generateAccessAndRefreshToken(user._id)

    //  set cookie
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    // send response
    const options = {
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken,
            },
            "User logged in successfully"
        )
    )

 })

 // logout user controller can be added here
const logoutUser = asyncHandler (async (req, res) => {
    // get refresh token from cookies
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )
})

const refreshAccessToken = asyncHandler( async (req, res) =>{
    
    try {

        // get refresh token from cookies or request body
        const incomingRefreshToken = req.cookies.refreshToken || 
        req.body.refreshToken

        // validate token 
        if(!incomingRefreshToken){
            throw new ApiError(401, "unauthorized request")
        }
        
        // verify token for validity
        const decodedToken =jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        // find the user
        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401, "unauthorized request, user not found")
        }

        // match the refresh token
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired and userd")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken,newrefreshToken} = await 
        generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken:
                    newrefreshToken
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message ||
            "Invalid refresh token"
        )
    }

} )

const chandeCurrentUserPassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword; 
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{}, "Password changed successfully")
    )
}) 

// get current user details 
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    )
}) 

const updateAccountDetails = asyncHandler(async (req, res) => {

    const {fullname, email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400, "fullname and email are required")
    }

    User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname: fullname, 
                email:email
            }
        },
        {new: true}
    ).select("-password ")

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Account details updated successfully")
    )
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uplodeOnCloudinary
    (avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is required")
    }

    const coverImage = await uplodeOnCloudinary
    (coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading coverimage")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        {new: true}
    ).select("-password ")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
});
 

export {
        
    registerUser,
    loginUser, 
    logoutUser,
    refreshAccessToken,
    chandeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage

};
  