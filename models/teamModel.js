import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { 
    type: String, 
    required: true, 
    minlength: 10, 
    maxlength: 10
  },
  roll: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true },
  // member-level photoLink removed: teams now have a single `imageLink` instead
  // photoLink: { type: String, required: true }
}, { _id: false });

const singleMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true },
}, { _id: false });

const judgeSchema = new mongoose.Schema({
  judgeId: { type: String, required: true },
  points: { type: Number, required: true }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true },
  projectName: { type: String, required: true },
  pptLink: { type: String, required: true },
  imageLink: { type: String, required: true },

  leader: { type: leadSchema, required: true },
  member1: { type: singleMemberSchema, required: true },
  member2: { type: singleMemberSchema, required: true },
  member3: { type: singleMemberSchema, required: true },
  member4: { type: singleMemberSchema, required: true },

  points: { type: Number, default: 0 },

  judges: {
    type: [judgeSchema],
    default: []
  }

}, { timestamps: true });



const TeamModel = mongoose.models.Team || mongoose.model("Team", teamSchema);

export default TeamModel;
