import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userLogin = new mongoose.Schema(
    {
        name:{type:String,required:true},
        email:{type:String,required:true,unique:true},
        password:{type:String,required:true}
    }
);


//hash the password after newly changed one
userLogin.pre('save',async function(next) {
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password,10);
    next();
});


//compare the given password with existing ones
userLogin.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword,this.password);
};

const userModel = mongoose.models.Users || mongoose.model('User',userLogin);

export default userModel;