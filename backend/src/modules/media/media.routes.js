import { Router } from "express";
import ImageKit from "@imagekit/nodejs";

import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/upload-auth", (req, res) => {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!privateKey || !publicKey || !urlEndpoint) {
    return res.status(503).json({
      success: false,
      message: "ImageKit is not configured"
    });
  }

  try {
    const client = new ImageKit({ privateKey });

    const auth = client.helper.getAuthenticationParameters();

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      ...auth,
      publicKey,
      urlEndpoint
    });
  } catch (error) {
    console.error("ImageKit authorization failed");

    return res.status(500).json({
      success: false,
      message: "Upload authorization unavailable"
    });
  }
});

export default router;
