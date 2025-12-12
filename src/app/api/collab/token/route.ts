import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { authenticateRequest } from '@/core/auth/auth';

const COLLAB_SECRET = process.env.COLLAB_TOKEN_SECRET || process.env.JWT_SECRET || 'collab-secret';
const COLLAB_TOKEN_TTL = parseInt(process.env.COLLAB_TOKEN_TTL || '300', 10); // seconds

export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await request.json();
    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        documentId,
      },
      COLLAB_SECRET,
      { expiresIn: COLLAB_TOKEN_TTL }
    );

    return NextResponse.json({
      success: true,
      token,
      expiresIn: COLLAB_TOKEN_TTL,
    });
  } catch (error) {
    console.error('Failed to issue collab token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
