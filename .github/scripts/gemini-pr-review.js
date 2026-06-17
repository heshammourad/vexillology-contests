const fs = require('fs');

async function callGeminiWithRetry(prompt, apiKey, modelName) {
  // Deduplicate and prioritize requested model, fallback to others if needed
  const models = Array.from(new Set([
    modelName, 
    'gemini-2.5-flash', 
    'gemini-1.5-flash', 
    'gemini-2.0-flash'
  ]));

  let lastError;

  for (const model of models) {
    const maxRetries = 3;
    let delay = 2000; // Starting delay of 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Sending diff to Gemini (${model}) - Attempt ${attempt}/${maxRetries}...`);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096,
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reviewText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reviewText) {
            return { reviewText, usedModel: model };
          }
          throw new Error('Gemini API returned an empty response.');
        }

        const errorText = await response.text();
        const status = response.status;
        lastError = new Error(`Gemini API Error (${status}): ${response.statusText} - ${errorText}`);

        // Retry on rate limit (429) or server errors (5xx)
        if (status === 429 || (status >= 500 && status <= 599)) {
          if (attempt < maxRetries) {
            console.warn(`Attempt ${attempt} failed with status ${status}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            continue;
          }
        } else {
          // Don't retry on other client errors (e.g. 400 Bad Request, 403 Forbidden)
          throw lastError;
        }
      } catch (err) {
        lastError = err;
        if (attempt === maxRetries) {
          console.warn(`All attempts failed for model ${model}.`);
        } else {
          console.warn(`Attempt ${attempt} encountered an error: ${err.message}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }
    console.warn(`Model ${model} unavailable. Trying next fallback model...`);
  }

  throw lastError;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const apiKey = process.env.GEMINI_API_KEY;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER;
  const modelName = process.env.MODEL_NAME || 'gemini-2.5-flash';

  if (!token) {
    console.error('Error: GITHUB_TOKEN is not set.');
    process.exit(1);
  }
  if (!apiKey) {
    console.warn('Warning: GEMINI_API_KEY is not set. This is expected for pull requests from forks due to security restrictions. Skipping review.');
    process.exit(0);
  }
  if (!repo || !prNumber) {
    console.error('Error: GITHUB_REPOSITORY or PR_NUMBER is not set.');
    process.exit(1);
  }

  // 1. Fetch PR Diff from GitHub API
  console.log(`Fetching diff for PR #${prNumber} in ${repo}...`);
  const diffResponse = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.diff',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!diffResponse.ok) {
    throw new Error(`Failed to fetch PR diff: ${diffResponse.status} ${diffResponse.statusText}`);
  }

  const rawDiff = await diffResponse.text();
  if (!rawDiff || rawDiff.trim().length === 0) {
    console.log('No changes found in the PR.');
    return;
  }

  // 2. Filter the diff to remove large lockfiles/binary files
  const filteredDiff = filterDiff(rawDiff);
  if (!filteredDiff || filteredDiff.trim().length === 0) {
    console.log('No code changes to review after filtering.');
    return;
  }

  // 3. Handle size limits (truncate if too large)
  let diffToSend = filteredDiff;
  let isTruncated = false;
  const maxDiffLength = 250000; // ~50k-70k tokens, very safe limit
  if (filteredDiff.length > maxDiffLength) {
    diffToSend = filteredDiff.substring(0, maxDiffLength) + '\n\n... [Diff truncated due to size limits] ...';
    isTruncated = true;
    console.log(`Diff size (${filteredDiff.length} chars) exceeds limit. Truncating to ${maxDiffLength} chars.`);
  } else {
    console.log(`Filtered diff size: ${filteredDiff.length} characters.`);
  }

  // 4. Prepare Prompt for Gemini
  const prompt = `You are an expert AI code reviewer. Please review the following git diff for a pull request in the repository "${repo}".
${isTruncated ? '\nNOTE: The diff was truncated due to length limits. Please review the available portion.\n' : ''}
Provide a comprehensive, high-quality code review with the following sections in Markdown:
1. **🔍 Summary of Changes**: A brief overview of what this PR does.
2. **✅ Key Achievements & Strengths**: Notable improvements, good practices, or clean code observed.
3. **⚠️ Potential Issues & Bugs**: Logic errors, edge cases, missing error handling, or security vulnerabilities (if any). Be specific and reference filenames.
4. **⚡ Performance & Optimization**: Recommendations to make the code faster, use less memory, or be more efficient.
5. **📝 Clean Code & Style**: Suggestions for readability, naming, documentation, or structuring.

If there are no issues or suggestions for a section, state that everything looks good! Be constructive, polite, and technical.

Here is the git diff:
\`\`\`diff
${diffToSend}
\`\`\`
`;

  // 5. Call Gemini API with Retries and Fallbacks
  const { reviewText, usedModel } = await callGeminiWithRetry(prompt, apiKey, modelName);

  // 6. Post or Update PR Comment
  const commentIdentifier = '\n\n<!-- gemini-pr-reviewer-comment -->';
  const footer = `\n\n---\n*Generated by **Gemini PR Reviewer** using ${usedModel}*`;
  const commentBody = `### 🤖 Gemini Code Review\n\n${reviewText}${footer}${commentIdentifier}`;

  console.log('Checking for existing Gemini review comment...');
  const commentsResponse = await fetch(
    `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!commentsResponse.ok) {
    throw new Error(`Failed to fetch PR comments: ${commentsResponse.status} ${commentsResponse.statusText}`);
  }

  const comments = await commentsResponse.json();
  const existingComment = comments.find(c => c.body && c.body.includes('<!-- gemini-pr-reviewer-comment -->'));

  if (existingComment) {
    console.log(`Updating existing comment (ID: ${existingComment.id})...`);
    const updateResponse = await fetch(
      `https://api.github.com/repos/${repo}/issues/comments/${existingComment.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ body: commentBody }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update comment: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    console.log('Comment updated successfully.');
  } else {
    console.log('Creating new comment...');
    const createResponse = await fetch(
      `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ body: commentBody }),
      }
    );

    if (!createResponse.ok) {
      throw new Error(`Failed to create comment: ${createResponse.status} ${createResponse.statusText}`);
    }
    console.log('Comment created successfully.');
  }
}

function filterDiff(diffText) {
  const blocks = diffText.split(/^diff --git /m);
  const filteredBlocks = [];

  if (blocks[0] && !blocks[0].startsWith('a/')) {
    filteredBlocks.push(blocks[0]);
  }

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const firstLine = block.split('\n')[0];
    const isExcluded = [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
      '.pdf', '.zip', '.gz', '.tar', '.mp4', '.mp3',
      '.woff', '.woff2', '.eot', '.ttf'
    ].some(ext => firstLine.includes(ext));

    if (!isExcluded) {
      filteredBlocks.push('diff --git ' + block);
    }
  }

  return filteredBlocks.join('');
}

main().catch(err => {
  console.error('Review script failed:', err);
  process.exit(1);
});
