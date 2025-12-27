import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import dbConnect from "@/src/lib/db";
import User from "@/src/models/User";
import { createSession, setSessionCookie } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, confirmPassword } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    await dbConnect();

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      passwordHash,
      createdAt: new Date(),
    });

    await newUser.save();

    const sessionUser = {
      _id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
    };

    const token = await createSession(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: sessionUser
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    )
  }
}