// backend/src/server.js
import express from "express";
const app = express();

app.use(express.json());

app.post("/score", (req, res) => {
  // store score in DB
  res.send("saved");
});

app.listen(4000);