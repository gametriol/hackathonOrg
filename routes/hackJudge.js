import express from 'express';
import detailModel from '../models/teamModel.js';
import judgeModel from '../models/judge.js';
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.put('/update', async (req, res) => {
    try {
        const { leaderRoll, points, judge } = req.body;

        if (!leaderRoll || !points || !judge) {
            return res.status(400).json({ message: "leaderRoll, points, judge are required" });
        }

        const check = await detailModel.findOne({ "leader.roll": leaderRoll });


        if (!check) {
            return res.status(400).json({ message: "Record not found" });
        }

        // Convert points to number safely
        const pts = Number(points);
        if (isNaN(pts)) {
            return res.status(400).json({ message: "Points must be a number" });
        }

        // Check if judge already rated
        const alreadyRated = check.judges.some(j => j.judgeId === judge);

        if (alreadyRated) {
            return res.status(400).json({ message: "You have already rated this entry" });
        }

        // Update points
        check.points += pts;

        // Add judge object
        check.judges.push({ judgeId: judge, points: pts });

        await check.save();

        console.log(`${pts} added to ${check.name}. Total = ${check.points}`);

        return res.status(200).json({
            message: "Points updated successfully",
            totalPoints: check.points
        });

    } catch (err) {
        console.log("Error in /update route", err);
        return res.status(500).json({ message: "Server error" });
    }
});

router.post('/create', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const smallCaseEmail = email.toLowerCase();
        const newJudge = new judgeModel({ judgeName: name, judgeEmail: smallCaseEmail, judgePassword: password });
        await newJudge.save();
        return res.status(201).json({ message: "Judge created successfully" });
    } catch (err) {
        console.log("Error in /create route", err);
        return res.status(500).json({ message: "Server error" });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const smallCaseEmail = email.toLowerCase();
        const judge = await judgeModel.findOne({ judgeEmail: smallCaseEmail, judgePassword: password });
        if (!judge) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        return res.status(200).json({ message: "Login successful" });
    } catch (err) {
        console.log("Error in /create route", err);
        return res.status(500).json({ message: "Server error" });
    }
});


export default router;