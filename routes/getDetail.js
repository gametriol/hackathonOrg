import express from 'express';
import detailModel from '../models/detail.js';
import authentication from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({
    extended:true
}));

router.post('/save',authentication,async(req,res)=>{
    try{
        const {name,email,mobile,roll} = req.body;
        const newDet  = new detailModel({name,email,mobile,roll});
        await newDet.save();
        res.status(201).json({
            message:"Thank you for Submitting"
        });
    }
    catch(err){
        if(err.code === 11000){
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({
                message:`${field} already exists`
            });
        }
        res.status(500).json({
            message:"Server down"
        });
    }
});

export default router;