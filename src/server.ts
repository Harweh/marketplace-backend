import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function start() {
    await connectDB();

    app.listen(env.PORT, () => {
        console.log(`🚀 Awe Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
}

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});

