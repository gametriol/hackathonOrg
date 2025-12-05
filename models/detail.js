import mongoose from 'mongoose';

const newDetail = new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    mobile:{type:String,required:true,unique:true,minlength:10,maxlength:10},
    roll:{type:String,required:true,unique:true,minlength:10,maxlength:10},
    points:{type:Number,default:0},
    judges:{type:[{
        judgeId:{type:String,required:true},
        points:{type:Number,required:true}
    }],default:[]}
});

const detailModel = mongoose.models.Detail || mongoose.model("Detail",newDetail);

export default detailModel;