import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/rag';

const TEST_QUERIES = [
  {
    q: 'Why do users abandon their photo search?',
    expected_sources: ['Research Findings', 'Failure Point Statistics'],
  },
  {
    q: 'What did Resham say about her search experience?',
    expected_sources: ['User Interviews (Ishwar, Resham, Naina, Pritish)'],
  },
  {
    q: 'What is the Specificity Paradox?',
    expected_sources: ['Research Context & Framework'],
  },
  {
    q: 'What percentage of journeys ended in abandonment?',
    expected_sources: ['Failure Point Statistics'],
  },
  {
    q: 'What are the main user segments identified?',
    expected_sources: ['User Segment Analysis'],
  },
  {
    q: 'Give me an example of a workaround users employ.',
    expected_sources: ['User Journey Extractions (111 journeys)', 'Research Context & Framework'],
  },
  {
    q: 'What is failure point C?',
    expected_sources: ['Problem Statement & Research Goals', 'Research Context & Framework'],
  },
  {
    q: 'What hypotheses do we have about context-rich memory?',
    expected_sources: ['Research Hypotheses & Interview Questions'],
  },
  {
    q: 'What themes emerged from the 13k app reviews?',
    expected_sources: ['LLM Theme Analysis (13k reviews)'],
  },
  {
    q: 'How did Naina find her photo?',
    expected_sources: ['User Interviews (Ishwar, Resham, Naina, Pritish)'],
  },
];

async function runTests() {
  console.log('🧪 Starting RAG Comprehensive Test Suite...\n');
  let passed = 0;

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const test = TEST_QUERIES[i];
    console.log(`[Test ${i + 1}/${TEST_QUERIES.length}] Asking: "${test.q}"`);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: test.q, history: [] }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`❌ Failed: HTTP ${res.status} - ${errText}`);
        continue;
      }

      const text = await res.text();
      
      // Extract sources event
      const sourceMatch = text.match(/data: {"type":"sources","sources":(\[.*?\])}/);
      let actualSources: string[] = [];
      if (sourceMatch && sourceMatch[1]) {
        actualSources = JSON.parse(sourceMatch[1]);
      }

      // Check if at least one expected source is present
      const hasExpectedSource = test.expected_sources.some(s => actualSources.includes(s));

      if (hasExpectedSource) {
        console.log(`✅ Passed: Sourced from ${actualSources.join(', ')}`);
        passed++;
      } else {
        console.log(`❌ Failed: Expected one of [${test.expected_sources.join(', ')}], but got [${actualSources.join(', ')}]`);
      }
    } catch (e: any) {
      console.error(`❌ Error: ${e.message}`);
    }
    console.log('---');
  }

  console.log(`\n🎉 Test Suite Completed: ${passed}/${TEST_QUERIES.length} passed.`);
}

runTests();
