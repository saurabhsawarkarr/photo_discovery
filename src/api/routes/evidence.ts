import { Router } from 'express';
import { pool } from '../../db/connection';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { source, failure_point, page = '1', limit = '25' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT id, record_id, source, source_date, failure_point, evidence_quote, final_outcome 
      FROM analysis_results 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIdx = 1;

    if (source) {
      query += ` AND source = $${paramIdx++}`;
      params.push(source);
    }

    if (failure_point) {
      query += ` AND failure_point = $${paramIdx++}`;
      params.push(failure_point);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);
    
    // Total count for pagination
    let countQuery = `SELECT COUNT(*) FROM analysis_results WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIdx = 1;
    
    if (source) {
      countQuery += ` AND source = $${countParamIdx++}`;
      countParams.push(source);
    }
    if (failure_point) {
      countQuery += ` AND failure_point = $${countParamIdx++}`;
      countParams.push(failure_point);
    }
    
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      data: result.rows,
      meta: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Fetch full chain: Analysis -> Cleaned -> Raw
    const result = await pool.query(`
      SELECT 
        ar.*,
        cr.cleaned_text,
        rr.raw_text
      FROM analysis_results ar
      JOIN cleaned_records cr ON ar.cleaned_record_id = cr.id
      JOIN raw_records rr ON cr.raw_record_id = rr.id
      WHERE ar.id = $1 OR ar.record_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
