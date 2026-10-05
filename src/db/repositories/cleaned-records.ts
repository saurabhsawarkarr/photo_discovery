import { pool } from '../connection';
import { CleanedRecord } from '../../shared/types';

export class CleanedRecordRepository {
  async insert(record: CleanedRecord): Promise<string> {
    const query = `
      INSERT INTO cleaned_records (
        raw_record_id, record_id, cleaned_text, source, source_url, 
        source_date, collection_date, language, is_duplicate, cleaning_meta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (record_id) DO NOTHING
      RETURNING id;
    `;
    const values = [
      record.raw_record_id,
      record.record_id,
      record.cleaned_text,
      record.source,
      record.source_url,
      record.source_date,
      record.collection_date,
      record.language,
      record.is_duplicate,
      record.cleaning_meta
    ];

    const result = await pool.query(query, values);
    return result.rows[0]?.id;
  }

  async findBySource(source: string): Promise<CleanedRecord[]> {
    const result = await pool.query('SELECT * FROM cleaned_records WHERE source = $1', [source]);
    return result.rows;
  }

  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM cleaned_records');
    return parseInt(result.rows[0].count, 10);
  }
}

export const cleanedRecordRepository = new CleanedRecordRepository();
