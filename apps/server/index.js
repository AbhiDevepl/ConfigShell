import express from "express";
import dotenv from "dotenv";

const app = express();

app.listen(3000, () => {
  console.log("Server running on port 3000");
});