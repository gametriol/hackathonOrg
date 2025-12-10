import mongoose from "mongoose";

const judgeSchema = new mongoose.Schema({
    judgeName:{type:String,required:true},
    judgeEmail:{type:String,required:true,unique:true},
    judgePassword:{type:String,required:true}
})

export const judgeModel = mongoose.models.Judge || mongoose.model("Judge",judgeSchema);

export default judgeModel;