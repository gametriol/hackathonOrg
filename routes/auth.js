import express from "express";
import jwt from "jsonwebtoken";
import authentication from "../middleware/authMiddleware.js";
import userModel from "../models/auth.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const isUser = await userModel.findOne({ email });
        if (isUser) {
            console.log("User already exists");
            return res.status(400).json({
                message: "User already Exists",
            });
        }
        const newUser = new userModel({
            name,
            email,
            password
        });
        const createdUser = await newUser.save();
        console.log(
            "User Created Successfuly , tap in to detail under user in response"
        );
        const { password: _, ...userData } = createdUser.toObject();
        res.status(201).json({
            message:
                "User created successfully, got a .user in response with user details",
            user: userData,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server Problem : coming from sign in catch block in auth.js ,routes",
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            console.log("Nobody of that email mittar");
            return res.status(400).json({
                message: "We dont have anyone with the given mail",
            });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Wrong passcode" });
        }
        if (!process.env.JWT_SECRET) {
            console.log("NO JWT KEY PROVIDED");
            return res.status(500).json({
                message: "NO JWT KEY",
            });
        }
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                name: user.name,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );
        const { password: _, ...userData } = user.toObject();
        console.log("Logged In");
        res.status(200).json({
            message: "Logged In",
            token,
            user: userData,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server Down",
        });
    }
});

router.get("/profile", authentication, (req, res) => {
    console.log(req.user.name);
    res.json({
        message: `hello ${req.user.name}`,
    });
});

export default router;
