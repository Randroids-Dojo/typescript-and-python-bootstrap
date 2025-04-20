import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

const app = express();
app.use(express.raw({ type: "*/*" }));
app.all("/api/auth/*", toNodeHandler(auth.handler));
app.get("/health", (_, res) => res.send("OK"));

const PORT = +process.env.PORT! || 4000;
app.listen(PORT, () => console.log(`BetterAuth running on port ${PORT}`));