import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authLimiter } from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import * as checkoutController from "./controllers/checkoutController.js";

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// The Paystack webhook needs the raw, unparsed request body to verify its
// signature — it must be registered before express.json() and matched
// here directly, since a signature computed over already-parsed JSON
// would never match what Paystack sent.
app.post(
    "/api/checkout/webhook",
    express.raw({ type: "application/json" }),
    checkoutController.paystackWebhook
);

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/returns", returnRoutes);

// TODO as we build each remaining PRD section:
// app.use("/api/cart", cartRoutes);           // PRD 4.3 (cart stays client-side for now)


app.use(notFoundHandler);
app.use(errorHandler);

export default app;