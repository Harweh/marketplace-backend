// import app from "./app.js";
// import { connectDB } from "./config/db.js";
// import { env } from "./config/env.js";

// async function start() {
//     await connectDB();

//     app.listen(env.PORT, () => {
//         console.log(`🚀 Awe Server running on port ${env.PORT} [${env.NODE_ENV}]`);
//     });
// }

// start().catch((err) => {
//     console.error("Failed to start server:", err);
//     process.exit(1);
// });



import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

// A single failed async operation (like a network call to an external
// service) should never take down the whole server for every user —
// log it and keep running instead of crashing.
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
});

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