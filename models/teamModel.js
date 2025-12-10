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
  roll: { type: String, required: true },
}, { _id: false });

const judgeSchema = new mongoose.Schema({
  judgeId: { type: String, required: true },
  points: { type: Number, required: true }
}, { _id: false });

const mentorsSchema = new mongoose.Schema({
  mentorName: { type: String, required: true },
}, { _id: false });

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true },
  projectName: { type: String, required: true },
  pptLink: { type: String, required: true },
  imageLink: { type: String, required: true },
  // required array of mentor names (at least one mentor)
  mentors: {
    type: [String],
    required: true,
    validate: {
      validator: function (arr) {
        return Array.isArray(arr) && arr.length > 0 && arr.every(a => typeof a === 'string' && a.trim().length > 0);
      },
      message: 'At least one mentor name is required and each must be a non-empty string.'
    }
  },

  leader: { type: leadSchema, required: true },
  member1: { type: singleMemberSchema, required: true },
  member2: { type: singleMemberSchema, required: true },
  member3: { type: singleMemberSchema, required: true },
  // member4 is optional now to support teams with 4 members (including leader)
  member4: { type: singleMemberSchema, required: false },

  points: { type: Number, default: 0 },

  judges: {
    type: [judgeSchema],
    default: []
  }

}, { timestamps: true });

// Ensure leader fields are unique across teams
// This creates unique indexes on the nested leader fields so no two teams can have the same leader email/phone/roll
teamSchema.index({ 'leader.email': 1 }, { unique: true, sparse: true });
teamSchema.index({ 'leader.phone': 1 }, { unique: true, sparse: true });
teamSchema.index({ 'leader.roll': 1 }, { unique: true, sparse: true });

// Add a rolls array and populate it before validation so we can enforce
// uniqueness across all leader/member rolls with a single unique index.
teamSchema.add({ rolls: { type: [String] } });

teamSchema.pre('validate', function (next) {
  try {
    const rolls = [];
    if (this.leader && this.leader.roll) rolls.push(this.leader.roll);
    if (this.member1 && this.member1.roll) rolls.push(this.member1.roll);
    if (this.member2 && this.member2.roll) rolls.push(this.member2.roll);
    if (this.member3 && this.member3.roll) rolls.push(this.member3.roll);
    if (this.member4 && this.member4.roll) rolls.push(this.member4.roll);
    this.rolls = Array.from(new Set(rolls));
  } catch (e) {
    // ignore
  }
  next();
});

// unique index on rolls ensures no duplicate roll across any team (leader or member)
teamSchema.index({ rolls: 1 }, { unique: true, sparse: true });



const TeamModel = mongoose.models.Team || mongoose.model("Team", teamSchema);

export default TeamModel;
