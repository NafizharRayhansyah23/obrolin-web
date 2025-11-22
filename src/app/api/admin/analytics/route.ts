import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    // check role === 'admin' as stored on session.user.role
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Top categories by count
    const topCategories = await db.chat.groupBy({
      by: ['Category'],
      _count: { _all: true },
      // order by the count of rows per Category (use the grouped field name)
      orderBy: { _count: { Category: 'desc' } },
      take: limit,
    });

    // Top questions by count (exclude empty/null)
    const topQuestions = await db.chat.groupBy({
      by: ['Question'],
      _count: { _all: true },
      // order by the count of identical Question values
      orderBy: { _count: { Question: 'desc' } },
      take: limit,
    });

    return NextResponse.json({
      categories: topCategories.map((c: any) => ({ category: c.Category || 'Uncategorized', count: c._count._all })),
      questions: (topQuestions || [])
        .filter((q: any) => q.Question && q.Question.toString().trim().length > 0)
        .map((q: any) => ({ question: q.Question, count: q._count._all })),
    });
  } catch (err: any) {
    console.error('[ADMIN_ANALYTICS_ERROR]', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
