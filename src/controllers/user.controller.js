
import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uplodeOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


// helper function to generate access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = User.findById(userId)
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
    if(!username || !email){
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
    generateAccessAndRefreshToken(user.id)

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
                refreshToken: undefined}
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
export {registerUser,loginUser, logoutUser};
  