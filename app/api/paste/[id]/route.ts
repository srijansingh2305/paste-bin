// app/api/paste/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID format (basic check)
    if (!id || id.length < 10 || id.length > 50) {
      return NextResponse.json(
        { error: 'Invalid paste ID' },
        { status: 404 }
      );
    }

    // Use transaction to atomically increment view count and fetch paste
    const paste = await prisma.$transaction(async (tx) => {
      // First, fetch the paste
      const foundPaste = await tx.paste.findUnique({
        where: { id },
      });

      if (!foundPaste) {
        return null;
      }

      // Check time-based expiry
      if (foundPaste.expiresAt && foundPaste.expiresAt <= new Date()) {
        return null;
      }

      // Check view-based expiry (before incrementing)
      if (
        foundPaste.maxViews !== null &&
        foundPaste.currentViews >= foundPaste.maxViews
      ) {
        return null;
      }

      // Increment view count atomically
      const updatedPaste = await tx.paste.update({
        where: { id },
        data: {
          currentViews: {
            increment: 1,
          },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          expiresAt: true,
          maxViews: true,
          currentViews: true,
        },
      });

      return updatedPaste;
    });

    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: paste.id,
      content: paste.content,
      createdAt: paste.createdAt.toISOString(),
      expiresAt: paste.expiresAt?.toISOString() ?? null,
      viewsRemaining:
        paste.maxViews !== null
          ? Math.max(0, paste.maxViews - paste.currentViews)
          : null,
    });
  } catch (error) {
    console.error('Error fetching paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}