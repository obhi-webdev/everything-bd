import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../users/user.model.js";

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(256)
});

export async function login(req, res, next) {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login information"
      });
    }

    const { email, password } = result.data;

    const user = await User.findOne({
      email,
      role: { $in: ["admin", "manager"] },
      isActive: true
    }).select("+passwordHash");

    const valid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET missing");
    }

    const token = jwt.sign(
      { sub: String(user._id) },
      secret,
      {
        expiresIn: "2h",
        algorithm: "HS256"
      }
    );

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );

    res.set("Cache-Control", "no-store");

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}
