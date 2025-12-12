import express from "express";
import TeamModel from "../models/teamModel.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

router.post("/save", async (req, res) => {
  try {
    const {
      teamName,
      projectName,
      pptLink,
      imageLink,
      mentors,
      leader,
      member1,
      member2,
      member3,
    } = req.body;

    // Require leader + at least two members (member1 & member2). member3 is optional. member4 not allowed.
    if (!leader || !member1 || !member2) {
      return res
        .status(400)
        .json({
          message: "At least 3 members (including leader) must be provided.",
        });
    }

    // member3 is optional; member4 support removed

    // Validate required imageLink and pptLink
    if (!imageLink || !pptLink) {
      return res
        .status(400)
        .json({
          message:
            "imageLink and pptLink are required (team image and ppt URLs).",
        });
    }

    // Validate mentors: required array with at least one non-empty name
    if (!Array.isArray(mentors) || mentors.length === 0 || !mentors.every(m => typeof m === 'string' && m.trim().length > 0)) {
      return res.status(400).json({ message: 'mentors is required: provide at least one non-empty mentor name' });
    }

    // Basic shape validation for leader and members
    const leaderRequired = ["name", "email", "phone", "roll", "branch", "year"];
    for (const f of leaderRequired) {
      if (!leader[f])
        return res.status(400).json({ message: `Leader.${f} is required` });
    }

    const memberRequired = ["name", "branch", "year", "roll"];
    // member1 and member2 are required
    const requiredMembers = [member1, member2];
    for (let i = 0; i < requiredMembers.length; i++) {
      for (const f of memberRequired) {
        if (!requiredMembers[i] || !requiredMembers[i][f])
          return res
            .status(400)
            .json({ message: `member${i + 1}.${f} is required` });
      }
    }

    // member3 is optional but if provided must follow the shape
    if (member3) {
      for (const f of memberRequired) {
        if (!member3[f]) return res.status(400).json({ message: `member3.${f} is required` });
      }
    }

    const teamObj = {
      teamName,
      projectName,
      pptLink,
      imageLink,
      mentors,
      leader,
      member1,
      member2,
      // include member3 only if provided
      ...(member3 ? { member3 } : {}),
      points: 0,
      judges: [],
    };

    // Prevent duplicate leader email/phone across teams
    const existingLeader = await TeamModel.findOne({
      $or: [{ "leader.email": leader.email }, { "leader.phone": leader.phone }],
    }).lean();

    if (existingLeader) {
      // determine which field conflicts
      if (
        existingLeader.leader &&
        existingLeader.leader.email === leader.email
      ) {
        return res
          .status(400)
          .json({ message: "Leader email already registered" });
      }
      if (
        existingLeader.leader &&
        existingLeader.leader.phone === leader.phone
      ) {
        return res
          .status(400)
          .json({ message: "Leader phone already registered" });
      }
      return res
        .status(400)
        .json({ message: "Leader details conflict with an existing team" });
    }

    // Collect rolls from leader and present members and validate duplicates
    const newRolls = [leader.roll, member1.roll, member2.roll];
    if (member3 && member3.roll) newRolls.push(member3.roll);

    // Ensure no duplicate rolls within the same team payload
    const uniqueRolls = Array.from(
      new Set(newRolls.map((r) => String(r).trim().toLowerCase()))
    );
    if (uniqueRolls.length !== newRolls.length) {
      return res
        .status(400)
        .json({ message: "Duplicate roll numbers provided within the team" });
    }

    // Check DB for any of these rolls already present in other teams (uses the `rolls` array/index)
    const rollsConflict = await TeamModel.findOne({
      rolls: { $in: newRolls },
    }).lean();
    if (rollsConflict) {
      // figure out which roll(s) conflict
      const existing = Array.isArray(rollsConflict.rolls)
        ? rollsConflict.rolls
        : [];
      const conflict = newRolls.find((r) =>
        existing.some(
          (e) =>
            String(e).trim().toLowerCase() === String(r).trim().toLowerCase()
        )
      );
      return res
        .status(400)
        .json({
          message: `Roll ${conflict} is already registered in another team`,
        });
    }

    const newTeam = new TeamModel(teamObj);

    await newTeam.save();

    res.status(201).json({
      message: "Team registered successfully!",
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        message: `${field} already exists`,
      });
    }

    console.log(err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// Check if a team or leader roll already exists to prevent duplicate uploads
router.post("/check", async (req, res) => {
  try {
    const { teamName, leaderRoll, leaderPhone, leaderEmail, rolls } = req.body;

    // teamName, leaderPhone, leaderEmail are required for the basic duplicate checks
    if (!teamName || !leaderPhone || !leaderEmail) {
      return res.status(400).json({
        message: "teamName, leaderPhone and leaderEmail are required",
      });
    }

    // TEAM NAME CHECK
    const existingTeam = await TeamModel.findOne({
      teamName: {
        $regex: `^${escapeRegex(teamName)}$`,
        $options: "i",
      },
    }).lean();
    if (existingTeam) {
      return res.json({ exists: true, field: "teamName" });
    }

    // LEADER ROLL CHECK
    if (leaderRoll) {
      const existingRoll = await TeamModel.findOne({
        "leader.roll": {
          $regex: `^${escapeRegex(leaderRoll)}$`,
          $options: "i",
        },
      }).lean();
      if (existingRoll) {
        return res.json({ exists: true, field: "leaderRoll" });
      }
    }

    // LEADER PHONE CHECK
    const existingPhone = await TeamModel.findOne({
      "leader.phone": {
        $regex: `^${escapeRegex(leaderPhone)}$`,
        $options: "i",
      },
    }).lean();
    if (existingPhone) {
      return res.json({ exists: true, field: "leaderPhone" });
    }

    // LEADER EMAIL CHECK
    const existingEmail = await TeamModel.findOne({
      "leader.email": {
        $regex: `^${escapeRegex(leaderEmail)}$`,
        $options: "i",
      },
    }).lean();
    if (existingEmail) {
      return res.json({ exists: true, field: "leaderEmail" });
    }

    // OPTIONAL: check an arbitrary roll (leader or member) against the aggregated rolls array
    // if (roll) {
    //     const existingAnyRoll = await TeamModel.findOne({
    //         rolls: { $elemMatch: { $regex: `^${escapeRegex(String(roll))}$`, $options: 'i' } }
    //     }).lean();
    //     if (existingAnyRoll) return res.json({ exists: true, field: 'roll' });
    // }
    if (Array.isArray(rolls) && rolls.length > 0) {
      const normalizedRolls = rolls.map((r) =>
        String(r || "")
          .trim()
          .toLowerCase()
      );

      const rollConflict = await TeamModel.findOne({
        rolls: { $in: normalizedRolls },
      }).lean();

      if (rollConflict) {
        return res.json({ exists: true, field: "roll" });
      }
    }

    // ALL CLEAR
    return res.json({ exists: false });
  } catch (err) {
    console.log("CHECK ROUTE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
