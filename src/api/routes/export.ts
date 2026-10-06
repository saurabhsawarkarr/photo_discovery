import { Router } from 'express';
import { pool } from '../../db/connection';

const router = Router();

const buildExportQuery = (query: any) => {
  const { source, failure_point, segment, frustration, date_from, date_to } = query;
  
  let sql = `
    SELECT 
      ar.record_id, ar.source, ar.source_date,
      ar.retrieval_scenario, ar.failure_point, ar.final_outcome,
      ar.frustration_signal, ar.user_segment_signals, ar.evidence_quote, ar.confidence,
      rr.source_url
    FROM analysis_results ar
    LEFT JOIN cleaned_records cr ON ar.cleaned_record_id = cr.id
    LEFT JOIN raw_records rr ON cr.raw_record_id = rr.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIdx = 1;

  if (source) {
    sql += ` AND ar.source = $${paramIdx++}`;
    params.push(source);
  }
  if (failure_point) {
    sql += ` AND ar.failure_point = $${paramIdx++}`;
    params.push(failure_point);
  }
  if (segment) {
    sql += ` AND $${paramIdx++} = ANY(ar.user_segment_signals)`;
    params.push(segment);
  }
  if (frustration) {
    sql += ` AND ar.frustration_signal = $${paramIdx++}`;
    params.push(frustration);
  }
  if (date_from) {
    sql += ` AND ar.source_date >= $${paramIdx++}`;
    params.push(date_from);
  }
  if (date_to) {
    sql += ` AND ar.source_date <= $${paramIdx++}`;
    params.push(date_to);
  }

  sql += ` ORDER BY ar.created_at DESC`;
  
  return { sql, params };
};

router.get('/json', async (req, res, next) => {
  try {
    const { sql, params } = buildExportQuery(req.query);
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/csv', async (req, res, next) => {
  try {
    const { sql, params } = buildExportQuery(req.query);
    const result = await pool.query(sql, params);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
    
    const headers = [
      'record_id', 'source', 'source_url', 'source_date', 
      'retrieval_scenario', 'failure_point', 'final_outcome', 
      'frustration_signal', 'user_segment_signals', 'evidence_quote', 'confidence'
    ];
    
    let csv = headers.join(',') + '\n';
    
    for (const row of result.rows) {
      const vals = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) return '""';
        if (Array.isArray(val)) val = val.join(';');
        // Escape quotes
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csv += vals.join(',') + '\n';
    }
    
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
