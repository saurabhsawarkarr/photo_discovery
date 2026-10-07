import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const failureFilter = searchParams.get('failure_point') || '';
    const sourceFilter = searchParams.get('source') || '';

    const dataPath = path.join(process.cwd(), '..', 'data', 'phase4', 'phase4b_journeys.json');
    let journeys: any[] = [];

    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      journeys = JSON.parse(fileContent);
    }

    // Map into EvidenceRecord format
    let records = journeys.map((j: any, idx: number) => {
      const failurePointStr = Array.isArray(j.failure_points)
        ? j.failure_points.join(', ')
        : (j.failure_points || 'N/A');

      return {
        id: j.record_id || `journey_${idx + 1}`,
        record_id: j.record_id || `R${String(idx + 1).padStart(3, '0')}`,
        source: j.source || 'play_store',
        source_date: j.source_date || '2024-03-15',
        failure_point: failurePointStr,
        evidence_quote: j.evidence_quote || j.retrieval_scenario || 'No quote available',
        final_outcome: j.final_outcome || 'unresolved',
        rawFailurePoints: Array.isArray(j.failure_points) ? j.failure_points : [j.failure_points],
      };
    });

    // Apply filters
    if (failureFilter) {
      records = records.filter((r) =>
        r.rawFailurePoints.some((fp: string) => fp && fp.toUpperCase() === failureFilter.toUpperCase())
      );
    }

    if (sourceFilter) {
      records = records.filter((r) =>
        r.source.toLowerCase().includes(sourceFilter.toLowerCase())
      );
    }

    const total = records.length;
    const startIndex = (page - 1) * limit;
    const paginated = records.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Evidence API error:', error);
    return NextResponse.json(
      { error: 'Failed to load evidence records', details: error.message },
      { status: 500 }
    );
  }
}
