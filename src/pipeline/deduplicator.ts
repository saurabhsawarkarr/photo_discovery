import stringSimilarity from 'string-similarity';
import { CleanedRecord } from '../shared/types';
import { pool } from '../db/connection';

export class Deduplicator {
  private threshold = 0.85;

  /**
   * Compares a given cleaned text against already stored records 
   * to determine if it's a duplicate.
   * Note: In a production environment with millions of records,
   * we would use MinHash LSH. Here we compare against recent records from the same source.
   */
  public async isDuplicate(text: string, source: string): Promise<boolean> {
    // Fetch last 1000 records from this source to compare
    const result = await pool.query(`
      SELECT cleaned_text FROM cleaned_records 
      WHERE source = $1 
      ORDER BY created_at DESC 
      LIMIT 1000
    `, [source]);

    if (result.rows.length === 0) return false;

    const texts = result.rows.map(row => row.cleaned_text);
    
    // Find best match
    const match = stringSimilarity.findBestMatch(text, texts);
    
    return match.bestMatch.rating >= this.threshold;
  }
}

export const deduplicator = new Deduplicator();
