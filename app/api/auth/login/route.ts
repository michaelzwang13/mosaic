import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/src/lib/db';
import User from '@/src/models/User';
import { createSession, setSessionCookie } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      )
    }

    const sessionUser = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    }

    const token = await createSession(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json(
      { 
        success: true,
        user: sessionUser
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}