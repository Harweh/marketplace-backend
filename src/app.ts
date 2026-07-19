import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authLimiter } from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);

// TODO as we build each PRD section:
// app.use("/api/products", productRoutes);   // PRD 4.2
// app.use("/api/cart", cartRoutes);           // PRD 4.3
// app.use("/api/orders", orderRoutes);        // PRD 4.4
// app.use("/api/vendors", vendorRoutes);      // PRD 4.5
// app.use("/api/admin", adminRoutes);         // PRD 4.6

app.use(notFoundHandler);
app.use(errorHandler);

export default app;