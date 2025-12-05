import express from 'express';
import TeamModel from '../models/teamModel.js';

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post('/save', async (req, res) => {
    try {
        const {
            teamName,
            projectName,
            pptLink,
            imageLink,   // ⭐ ADDED THIS
            leader,
            member1,
            member2,
            member3,
            member4
        } = req.body;

                // Validate required members
                if (!leader || !member1 || !member2 || !member3 || !member4) {
                        return res.status(400).json({ message: "All 5 members (leader + 4 members) must be provided." });
                }

                // Validate required imageLink and pptLink
                if (!imageLink || !pptLink) {
                        return res.status(400).json({ message: "imageLink and pptLink are required (team image and ppt URLs)." });
                }

                // Basic shape validation for leader and members
                const leaderRequired = ['name','email','phone','roll','branch','year'];
                for (const f of leaderRequired) {
                    if (!leader[f]) return res.status(400).json({ message: `Leader.${f} is required` });
                }

                const memberRequired = ['name','branch','year'];
                const members = [member1, member2, member3, member4];
                for (let i = 0; i < members.length; i++) {
                    for (const f of memberRequired) {
                        if (!members[i] || !members[i][f]) return res.status(400).json({ message: `member${i+1}.${f} is required` });
                    }
                }

        const newTeam = new TeamModel({
            teamName,
            projectName,
            pptLink,
            imageLink,  // ⭐ MUST INCLUDE IT HERE
            leader,
            member1,
            member2,
            member3,
            member4,
            points: 0,
            judges: []
        });

        await newTeam.save();

        res.status(201).json({
            message: "Team registered successfully!"
        });

    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({
                message: `${field} already exists`
            });
        }

        console.log(err);
        res.status(500).json({
            message: "Server error"
        });
    }
});

router.post('/check', async (req, res) => {
    try {
        const { teamName, leaderRoll } = req.body;

        if (!teamName && !leaderRoll) {
            return res.status(400).json({ message: 'Provide teamName or leaderRoll to check' });
        }

        if (teamName) {
            const existing = await TeamModel.findOne({ teamName }).lean();
            if (existing) return res.json({ exists: true, field: 'teamName' });
        }

        if (leaderRoll) {
            const existingByRoll = await TeamModel.findOne({ 'leader.roll': leaderRoll }).lean();
            if (existingByRoll) return res.json({ exists: true, field: 'leaderRoll' });
        }

        return res.json({ exists: false });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});


export default router;
