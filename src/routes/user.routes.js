import { Router } from "express";
import { registerUser,loginUser,logoutUser,refreshAccessToken} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";




const router = Router();

router.route("/register").post(
    // here we add middleware in routes
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

router.route("/login").post(loginUser);

// protected route 
router.route("/logout").post(verifyJWT, logoutUser);
// refresh token route
router.route("/refresh-token").post(refreshAccessToken)

export default router;

