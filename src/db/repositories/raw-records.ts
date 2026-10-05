import { pool } from '../connection';
import { RawRecord } from '../../shared/types';

export class RawRecordRepository {
  async insert(record: RawRecord): Promise<string> {
    const query = `
      INSERT INTO raw_records (
        record_id, source, source_url, source_date, collection_date, raw_text, 
        language, rating, reviewer_meta, collector_meta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (record_id) DO NOTHING
      RETURNING id;
    `;
    const values = [
      record.record_id,
      record.source,
      record.source_url,
      record.source_date,
      record.collection_date,
      record.raw_text,
      record.language,
      record.rating,
      record.reviewer_meta,
      record.collector_meta
    ];

    const result = await pool.query(query, values);
    return result.rows[0]?.id;
  }

  async findByRecordId(recordId: string): Promise<RawRecord | null> {
    const result = await pool.query('SELECT * FROM raw_records WHERE record_id = $1', [recordId]);
    return result.rows[0] || null;
  }

  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM raw_records');
    return parseInt(result.rows[0].count, 10);
  }
}

export const rawRecordRepository = new RawRecordRepository();
