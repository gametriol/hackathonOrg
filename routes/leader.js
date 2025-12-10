import express from 'express';
import authentication from '../middleware/authMiddleware.js';
import detailModel from '../models/teamModel.js';

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({
    extended: true
}));

router.get('/leads', authentication, async (req, res) => {
    try {
        const users = await detailModel.find().sort({ points: -1 });
        console.log("Leaderboard fetched Successfully");
        return res.status(200).json({
            message: "Here is your data",
            users
        });
    }
    catch (err) {
        console.log("Facing issues while fetching leaderboards", err);
        return res.status(500).json({
            message: "Server Down"
        });
    }
});
router.get('/teamDetails', async (req, res) => {
    try {
        const users = await detailModel.find();
        console.log("Teams fetched Successfully");
        return res.status(200).json({
            message: "Here is your data",
            users
        });
    }
    catch (err) {
        console.log("Facing issues while fetching teams", err);
        return res.status(500).json({
            message: "Server Down"
        });
    }
});

export default router;