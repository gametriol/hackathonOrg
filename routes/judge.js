import express from 'express';
import authentication from '../middleware/authMiddleware.js';
import detailModel from '../models/detail.js';

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.put('/update', authentication, async (req, res) => {
    try {
        const { email, points, judge } = req.body;
        const check = await detailModel.findOne({ email });
        if (!check) {
            console.log("Record doesen't exist");
            return res.status(400).json({
                message:"No body of that Record"
            });
        }
        let isJudge = false;
        for (let i = 0; i < check.judges.length; i++) {
            if (check.judges[i].judgeId === judge) {
                isJudge = true;
                break;
            }
        }
        if (isJudge) {
            console.log("Judge already exists");
            return res.status(400).json({
                message:"You have already rated this guy"
            });
        }
        check.points += points;
        check.judges.push({ judgeId: judge, points });
        await check.save();
        console.log(`${points} added to ${check.name} and now total points = ${check.points}`);
        return res.status(200).json({
            message:"points updated successfully"
        });
    }
    catch(err){
        console.log("There is some error in updating points [coming from judge.js route catch block");
        return res.status(500).json({
            message:"There is some error in updating points [coming from judge.js route catch block"
        });
    }
});

export default router;