import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const router = express.Router();
const User = mongoose.model("User");

router.get("/register", (req, res) => {
  res.render("register", {
    error: req.query.error,
    success: req.query.success,
  });
});

router.post("/register", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password) {
    return res.redirect("/register?error=All fields are required");
  }

  if (password !== confirmPassword) {
    return res.redirect("/register?error=Passwords do not match");
  }

  if (password.length < 8) {
    return res.redirect(
      "/register?error=Password must be at least 8 characters"
    );
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.redirect("/register?error=Username or email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      passwordHash,
      createdAt: new Date(),
    });

    await newUser.save();

    res.redirect("/login?success=Registration successful! Please log in.");
  } catch (err) {
    console.error("Registration error:", err);
    res.redirect("/register?error=Registration failed. Please try again.");
  }
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/editor");
  }
  res.render("login", {
    error: req.query.error,
    success: req.query.success,
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect("/login?error=Email and password are required");
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect("/login?error=Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.redirect("/login?error=Invalid email or password");
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect("/login?error=Login failed. Please try again.");
      }
      res.redirect("/editor");
    });
  } catch (err) {
    console.error("Login error:", err);
    res.redirect("/login?error=Login failed. Please try again.");
  }
});

export default router;
