import express from 'express';
import TeamModel from '../models/teamModel.js';

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}


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

        // Validate required members: leader + member1..member3 are required; member4 is optional
        if (!leader || !member1 || !member2 || !member3) {
            return res.status(400).json({ message: "At least 4 members (including leader) must be provided." });
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
                const members = [member1, member2, member3];
                for (let i = 0; i < members.length; i++) {
                    for (const f of memberRequired) {
                        if (!members[i] || !members[i][f]) return res.status(400).json({ message: `member${i+1}.${f} is required` });
                    }
                }
                // If member4 provided, validate shape as well
                if (member4) {
                    for (const f of memberRequired) {
                        if (!member4[f]) return res.status(400).json({ message: `member4.${f} is required` });
                    }
                }

        const teamObj = {
            teamName,
            projectName,
            pptLink,
            imageLink,  // ⭐ MUST INCLUDE IT HERE
            leader,
            member1,
            member2,
            member3,
            // include member4 only if provided
            ...(member4 ? { member4 } : {}),
            points: 0,
            judges: []
        };

        // Prevent duplicate leader email/phone/roll across teams
        const existingLeader = await TeamModel.findOne({
            $or: [
                { 'leader.email': leader.email },
                { 'leader.phone': leader.phone },
                { 'leader.roll': leader.roll }
            ]
        }).lean();

        if (existingLeader) {
            // determine which field conflicts
            if (existingLeader.leader && existingLeader.leader.email === leader.email) {
                return res.status(400).json({ message: 'Leader email already registered' });
            }
            if (existingLeader.leader && existingLeader.leader.phone === leader.phone) {
                return res.status(400).json({ message: 'Leader phone already registered' });
            }
            if (existingLeader.leader && existingLeader.leader.roll === leader.roll) {
                return res.status(400).json({ message: 'Leader roll already registered' });
            }
            return res.status(400).json({ message: 'Leader details conflict with an existing team' });
        }

        const newTeam = new TeamModel(teamObj);

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

// Check if a team or leader roll already exists to prevent duplicate uploads
router.post('/check', async (req, res) => {
    try {
        const { teamName, leaderRoll, leaderPhone, leaderEmail } = req.body;

        // All fields required for registration duplicate check
        if (!teamName || !leaderRoll || !leaderPhone || !leaderEmail) {
            return res.status(400).json({
                message: 'teamName, leaderRoll, leaderPhone and leaderEmail are required'
            });
        }

        // TEAM NAME CHECK
        const existingTeam = await TeamModel.findOne({
            teamName: {
                $regex: `^${escapeRegex(teamName)}$`,
                $options: 'i'
            }
        }).lean();
        if (existingTeam) {
            return res.json({ exists: true, field: 'teamName' });
        }

        // LEADER ROLL CHECK
        const existingRoll = await TeamModel.findOne({
            'leader.roll': {
                $regex: `^${escapeRegex(leaderRoll)}$`,
                $options: 'i'
            }
        }).lean();
        if (existingRoll) {
            return res.json({ exists: true, field: 'leaderRoll' });
        }

        // LEADER PHONE CHECK
        const existingPhone = await TeamModel.findOne({
            'leader.phone': {
                $regex: `^${escapeRegex(leaderPhone)}$`,
                $options: 'i'
            }
        }).lean();
        if (existingPhone) {
            return res.json({ exists: true, field: 'leaderPhone' });
        }

        // LEADER EMAIL CHECK
        const existingEmail = await TeamModel.findOne({
            'leader.email': {
                $regex: `^${escapeRegex(leaderEmail)}$`,
                $options: 'i'
            }
        }).lean();
        if (existingEmail) {
            return res.json({ exists: true, field: 'leaderEmail' });
        }

        // ALL CLEAR
        return res.json({ exists: false });

    } catch (err) {
        console.log("CHECK ROUTE ERROR:", err);
        return res.status(500).json({ message: 'Server error' });
    }
});




export default router;
