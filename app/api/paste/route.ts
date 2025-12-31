// app/api/paste/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPasteSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(500000, 'Content too large (max 500KB)'),
  expiresAt: z.string().datetime().optional(),
  maxViews: z.number().int().positive().max(1000000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createPasteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { content, expiresAt, maxViews } = validationResult.data;

    // Validate expiresAt is in the future
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (expiryDate <= new Date()) {
        return NextResponse.json(
          { error: 'expiresAt must be in the future' },
          { status: 400 }
        );
      }
    }

    // Create paste
    const paste = await prisma.paste.create({
      data: {
        content,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxViews: maxViews ?? null,
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        maxViews: true,
      },
    });

    return NextResponse.json(
      {
        id: paste.id,
        url: `/paste/${paste.id}`,
        createdAt: paste.createdAt.toISOString(),
        expiresAt: paste.expiresAt?.toISOString() ?? null,
        maxViews: paste.maxViews,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}