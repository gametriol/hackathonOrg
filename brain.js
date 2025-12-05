import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import auth from "./routes/auth.js";
import detailed from "./routes/getDetail.js";
import judge from "./routes/judge.js";
import lead from "./routes/leader.js";
import ideathonTeam from "./routes/ideathonTeam.js";
import uploadRoutes from './routes/uploadRoutes.js';


dotenv.config();

const app = express();



app.use(express.json());

app.use(cors());

app.use("/api/auth", auth);
app.use("/api/details",detailed);
app.use("/api/judge",judge);
app.use("/api/leader",lead);
app.use("/api/ideathonTeam",ideathonTeam);
app.use("/api/upload", uploadRoutes);

// simple health check endpoint used by many platforms (GET /healthz)
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const start = async () => {
  try{
    await mongoose.connect(process.env.MONGO_URI);
  console.log("CONNECTED TO DB");
  
  const port = process.env.PORT || 4000;;

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
  }
  catch(err){
    console.log(err);
    process.exit(1);
  }
};

start();
