import { Router } from "express";
import * as checkoutController from "../controllers/checkoutController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { checkoutSchema } from "../validators/checkoutValidators.js";

const router = Router();

// Buyer starts checkout — creates the order (pending) and returns a
// Paystack payment link to redirect the buyer to.
// Buyer previews real shipping costs before committing to payment.
router.post("/preview", requireAuth, validate(checkoutSchema), checkoutController.previewCheckout);

router.post("/", requireAuth, validate(checkoutSchema), checkoutController.checkout);

// Buyer lands back from Paystack — frontend calls this to confirm and
// finalize the order.
router.get("/verify/:reference", requireAuth, checkoutController.verifyPayment);

export default router;