import { Router } from 'express';
import { pool } from '../../db/connection';

const router = Router();

router.get('/overview', async (req, res, next) => {
  try {
    const totalCollected = await pool.query('SELECT COUNT(*) FROM raw_records').then(r => parseInt(r.rows[0].count));
    const totalCleaned = await pool.query('SELECT COUNT(*) FROM cleaned_records').then(r => parseInt(r.rows[0].count));
    const totalRelevant = await pool.query(`SELECT COUNT(*) FROM relevance_classifications WHERE classification = 'relevant'`).then(r => parseInt(r.rows[0].count));
    const totalAnalyzed = await pool.query('SELECT COUNT(*) FROM analysis_results').then(r => parseInt(r.rows[0].count));

    const sourceBreakdown = await pool.query(`
      SELECT source, 
             COUNT(*) as collected,
             COUNT(*) FILTER (WHERE rc.classification = 'relevant') as relevant
      FROM raw_records r
      LEFT JOIN cleaned_records c ON r.id = c.raw_record_id
      LEFT JOIN relevance_classifications rc ON c.id = rc.cleaned_record_id
      GROUP BY source
    `);

    const sources: any = {};
    for (const row of sourceBreakdown.rows) {
      sources[row.source] = {
        collected: parseInt(row.collected),
        relevant: parseInt(row.relevant)
      };
    }

    res.json({
      total_collected: totalCollected,
      total_cleaned: totalCleaned,
      total_relevant: totalRelevant,
      total_analyzed: totalAnalyzed,
      sources,
      pipeline_status: 'active'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/failure-points', async (req, res, next) => {
  try {
    const failurePoints = await pool.query(`
      SELECT failure_point, COUNT(*) as count 
      FROM analysis_results 
      WHERE failure_point IS NOT NULL
      GROUP BY failure_point
      ORDER BY count DESC
    `);
    res.json(failurePoints.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/segments', async (req, res, next) => {
  try {
    // This looks at segment tags extracted from records
    const segments = await pool.query(`
      SELECT unnest(user_segment_signals) as segment, COUNT(*) as count
      FROM analysis_results
      WHERE user_segment_signals IS NOT NULL
      GROUP BY segment
      ORDER BY count DESC
      LIMIT 20
    `);
    res.json(segments.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
