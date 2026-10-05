import { Router } from 'express';
import { pool } from '../../db/connection';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT * FROM segments 
      ORDER BY evidence_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/evidence', async (req, res, next) => {
  try {
    const { id } = req.params;
    // For now we mock it by returning a random subset or matching evidence_record_ids
    // A full implementation would use a join table or array containment `record_id = ANY(evidence_record_ids)`
    
    // Get the segment to find its evidence record IDs
    const segment = await pool.query(`SELECT * FROM segments WHERE id = $1 OR segment_id = $1`, [id]);
    
    if (segment.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Since we mocked segment evidence linking in Phase 4 due to schema structure,
    // we would ideally query `SELECT * FROM analysis_results WHERE record_id = ANY($1)`.
    // For now, we return empty or limited data.
    res.json({
      segment: segment.rows[0],
      evidence: [] 
    });

  } catch (error) {
    next(error);
  }
});

export default router;
