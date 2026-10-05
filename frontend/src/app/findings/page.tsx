import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './page.module.css';

export default function FindingsPage() {
  // Read the markdown file from the Docs directory
  const filePath = path.join(process.cwd(), '../Docs/Findings.md');
  let markdownContent = '';
  
  try {
    markdownContent = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('Error reading Findings.md:', error);
    markdownContent = '# Error\nCould not load the findings document. Make sure it exists at `Docs/Findings.md`.';
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Google Photos Research Findings</h1>
      </header>
      <main className={styles.main}>
        <div className={styles.markdownBody}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent}
          </ReactMarkdown>
        </div>
      </main>
    </div>
  );
}
