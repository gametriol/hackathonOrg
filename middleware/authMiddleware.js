import jwt from 'jsonwebtoken';

function authentication(req,res,next){
    const token = req.headers.authorization?.split(" ")[1];
    if(!token){
        // return res.status(401).json({message:"You must be logged in"}); //production line
        console.log("NO token Provided");
        return res.status(401).json({message:"No Token"}); //development line
    }

    if(!process.env.JWT_SECRET){
        console.log("NO JWT KEY IN ENV");
        return res.status(500).json({
            message:"No process env thingy for jwt secret key"
        });
    }
    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err){
        // res.status(401).json({
        //     message:"You must be logged in" //production line
        // });
        console.log("Token provided is invalid, coming from catch block");
        res.status(401).json({
            message:"Invalid Token" //development line
        });
    }
}

export default authentication; 