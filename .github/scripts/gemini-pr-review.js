const fs = require('fs');

/**
 * Supported Gemini models list used for fallbacks.
 * Ordered by preference: flash models first for cost, speed, and efficiency,
 * followed by pro models for higher capability if needed.
 */
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-pro'
];

/**
 * Maximum character limit for the git diff to fit within safe API payload sizes
 */
const MAX_DIFF_LENGTH = 250000; // ~50k-70k tokens

/**
 * Maximum character limit for a single file's diff before we omit its contents.
 * Prevents a single massive or minified file from devouring the entire token budget.
 */
const MAX_SINGLE_FILE_DIFF_LENGTH = 100000; // ~100KB

/**
 * Prefix length for git diff file metadata lines (e.g., "+++ b/" or "--- a/")
 */
const DIFF_PREFIX_LENGTH = '+++ b/'.length;

/**
 * Writes a message to the GitHub Actions Job Summary page.
 * @param {string} text - Markdown text to append
 */
function writeJobSummary(text) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    try {
      fs.appendFileSync(summaryFile, text + '\n');
    } catch (err) {
      console.warn('Failed to write to GITHUB_STEP_SUMMARY:', err.message);
    }
  }
}

/**
 * Perform a fetch request to the GitHub API with basic transient error/rate-limit retries.
 * @param {string} url - Target URL
 * @param {object} options - Request options
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Response>} The raw response
 */
async function githubFetch(url, options = {}, maxRetries = 2) {
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      const status = response.status;
      // Retry on rate limits (403/429) or transient server errors (5xx)
      if (status === 403 || status === 429 || (status >= 500 && status <= 599)) {
        if (attempt < maxRetries) {
          console.warn(`GitHub API call failed (status: ${status}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`GitHub API network error: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

/**
 * Fetches the raw diff of the pull request from GitHub API.
 * @param {string} repo - The repository owner/name
 * @param {string} prNumber - The pull request number
 * @param {string} token - The GitHub token
 * @returns {Promise<string>} The raw diff text
 */
async function fetchPrDiff(repo, prNumber, token) {
  console.log(`Fetching diff for PR #${prNumber} in ${repo}...`);
  const response = await githubFetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.diff',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch PR diff: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Filters out large lockfiles, binary files, and media from the git diff.
 * Parses the diff block-by-block using the diff metadata.
 * @param {string} diffText - Raw git diff text
 * @returns {string} The filtered git diff
 */
function filterDiff(diffText) {
  const blocks = diffText.split(/^diff --git /m);
  const filteredBlocks = [];

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split('\n');
    const firstLineOfBlock = lines[0];

    let filePath = '';
    let newPathFound = false;

    // 1. Prioritize '+++ b/' for the new/modified file path
    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        filePath = line.substring(DIFF_PREFIX_LENGTH).trim();
        newPathFound = true;
        break;
      }
    }

    // 2. If no '+++ b/' (e.g. file deletion), look for '--- a/'
    if (!newPathFound) {
      for (const line of lines) {
        if (line.startsWith('--- a/')) {
          filePath = line.substring(DIFF_PREFIX_LENGTH).trim();
          break;
        }
      }
    }

    // 3. Fallback if metadata lines were not found (e.g. binary files or renames)
    if (!filePath) {
      const match = firstLineOfBlock.match(/^(?:a\/)?(.+?)\s+(?:b\/)?(.+)$/);
      if (match && match[2]) {
        filePath = match[2];
      } else {
        console.warn(`Could not reliably determine file path for diff block starting with: ${firstLineOfBlock.substring(0, 100)}... Defaulting to empty path.`);
        filePath = ''; // Safe fallback to avoid matching any exclusion extensions
      }
    }

    // Strip surrounding double quotes (git formats paths with spaces/special chars in quotes)
    filePath = filePath.replace(/^"|"$/g, '');

    // Exclude lockfiles, media, binaries, and web fonts
    const isExcluded = [
      'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
      '.pdf', '.zip', '.gz', '.tar', '.mp4', '.mp3',
      '.woff', '.woff2', '.eot', '.ttf'
    ].some(ext => filePath.endsWith(ext) || filePath.split('/').pop() === ext);

    if (!isExcluded) {
      if (block.length > MAX_SINGLE_FILE_DIFF_LENGTH) {
        console.warn(`Diff block for ${filePath} is too large (${block.length} chars). Omitting changes from prompt to preserve token budget.`);
        // Keep the diff git header but replace the body with a friendly warning placeholder
        filteredBlocks.push(`diff --git ${firstLineOfBlock}\n\n... [Diff for this file was omitted from review because it exceeds 100,000 characters to preserve token budget] ...\n`);
      } else {
        filteredBlocks.push('diff --git ' + block);
      }
    }
  }

  return filteredBlocks.join('');
}

/**
 * Calls the Gemini API to generate review content, with retries and fallback models.
 * @param {string} prompt - The prompt text containing instructions and diff
 * @param {string} apiKey - Gemini API key
 * @param {string} modelName - The primary model name requested
 * @returns {Promise<{reviewText: string, usedModel: string, wasTruncated: boolean}>}
 */
async function callGeminiWithRetry(prompt, apiKey, modelName) {
  const models = Array.from(new Set([modelName, ...GEMINI_MODELS]));
  let lastError;

  for (const model of models) {
    const maxRetries = 3;
    let delay = 2000;

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
          const candidate = data.candidates?.[0];
          const reviewText = candidate?.content?.parts?.[0]?.text;
          const finishReason = candidate?.finishReason;
          const wasTruncated = finishReason === 'MAX_TOKENS';

          if (reviewText) {
            return { 
              reviewText, 
              usedModel: model, 
              wasTruncated 
            };
          }
          throw new Error('Gemini API returned an empty response.');
        }

        const errorText = await response.text();
        const status = response.status;
        console.error(`Gemini API call failed with status ${status} for model ${model}:`, errorText);

        // Attempt to parse user-friendly error message
        let errorMessage = response.statusText;
        try {
          const parsedError = JSON.parse(errorText);
          if (parsedError.error && parsedError.error.message) {
            errorMessage = parsedError.error.message;
          }
        } catch (_) {
          console.debug('Could not parse Gemini API error response as JSON. Falling back to raw text.');
          if (errorText) errorMessage = errorText;
        }

        lastError = new Error(`Gemini API Error (${status}): ${errorMessage}`);

        // Retry on rate limit (429) or server errors (5xx)
        if (status === 429 || (status >= 500 && status <= 599)) {
          if (attempt < maxRetries) {
            console.warn(`Attempt ${attempt} failed with status ${status}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
        } else {
          // Client error (400, 401, 403, 404, etc.) - do not retry
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

/**
 * Creates or updates the review comment on the Pull Request.
 * @param {string} repo - Repository owner/name
 * @param {string} prNumber - Pull request number
 * @param {string} token - GitHub token
 * @param {string} commentBody - Comment text body
 */
async function postOrUpdateComment(repo, prNumber, token, commentBody) {
  console.log('Checking for existing Gemini review comment...');
  const commentsResponse = await githubFetch(
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
    const updateResponse = await githubFetch(
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
    const createResponse = await githubFetch(
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
    let isFork = false;
    if (process.env.GITHUB_EVENT_PATH) {
      try {
        const eventData = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
        isFork = !!eventData.pull_request?.head?.repo?.fork;
      } catch (err) {
        console.warn('Failed to parse GITHUB_EVENT_PATH:', err.message);
      }
    }

    if (isFork) {
      const warningMsg = '### ⚠️ Gemini PR Review Skipped\n\n`GEMINI_API_KEY` is not set. This is expected for pull requests from forks due to security restrictions.';
      console.warn(warningMsg);
      writeJobSummary(warningMsg);
      process.exit(0);
    } else {
      const errorMsg = '### ❌ Gemini PR Review Failed\n\n`GEMINI_API_KEY` is not set. For internal pull requests, please verify that you have added `GEMINI_API_KEY` as an Actions secret in your repository settings.';
      console.error(errorMsg);
      writeJobSummary(errorMsg);
      process.exit(1); // Fail the job for internal PRs so maintainers know config is broken
    }
  }
  if (!repo || !prNumber) {
    console.error('Error: GITHUB_REPOSITORY or PR_NUMBER is not set.');
    process.exit(1);
  }

  // 1. Fetch PR Diff
  const rawDiff = await fetchPrDiff(repo, prNumber, token);
  if (!rawDiff || rawDiff.trim().length === 0) {
    console.log('No changes found in the PR.');
    return;
  }

  // 2. Filter the diff
  const filteredDiff = filterDiff(rawDiff);
  if (!filteredDiff || filteredDiff.trim().length === 0) {
    console.log('No code changes to review after filtering.');
    return;
  }

  // 3. Handle size limits (truncate at file boundaries if too large)
  let diffToSend = filteredDiff;
  let isTruncated = false;
  
  if (filteredDiff.length > MAX_DIFF_LENGTH) {
    const fileBlocks = filteredDiff.split(/(?=^diff --git )/m);
    let currentLength = 0;
    const selectedBlocks = [];
    
    for (const block of fileBlocks) {
      if (currentLength + block.length > MAX_DIFF_LENGTH) {
        isTruncated = true;
        break;
      }
      selectedBlocks.push(block);
      currentLength += block.length;
    }
    
    if (selectedBlocks.length === 0) {
      // Find the last newline before MAX_DIFF_LENGTH to avoid cutting a line mid-sentence
      const safeTruncationPoint = filteredDiff.lastIndexOf('\n', MAX_DIFF_LENGTH);
      diffToSend = filteredDiff.substring(0, safeTruncationPoint > -1 ? safeTruncationPoint : MAX_DIFF_LENGTH) + '\n\n... [Diff truncated due to size limits] ...';
      if (safeTruncationPoint === -1) {
        console.warn('Single file diff is extremely large and could not be truncated at a line boundary. Truncated by character count.');
      }
    } else {
      diffToSend = selectedBlocks.join('') + '\n\n... [Remaining file diffs truncated due to size limits] ...';
    }
    console.log(`Diff size (${filteredDiff.length} chars) exceeds limit. Truncated to ${diffToSend.length} chars.`);
  } else {
    console.log(`Filtered diff size: ${filteredDiff.length} characters.`);
  }

  // 4. Prepare Prompt (Instructing model to be concise and avoid quoting large blocks of code)
  const prompt = `You are an expert AI code reviewer. Please review the following git diff for a pull request in the repository "${repo}".
${isTruncated ? '\nNOTE: The diff was truncated due to length limits. Please review the available portion.\n' : ''}
Provide a comprehensive, high-quality code review with the following sections in Markdown:
1. **🔍 Summary of Changes**: A brief overview of what this PR does.
2. **✅ Key Achievements & Strengths**: Notable improvements, good practices, or clean code observed.
3. **⚠️ Potential Issues & Bugs**: Logic errors, edge cases, missing error handling, or security vulnerabilities (if any). Be specific and reference filenames.
4. **⚡ Performance & Optimization**: Recommendations to make the code faster, use less memory, or be more efficient.
5. **📝 Clean Code & Style**: Suggestions for readability, naming, documentation, or structuring.

Formatting Rules:
- Keep the feedback constructive, technical, and extremely concise.
- If there are no findings or recommendations for a section, write "Everything looks good!" and do not add empty details.
- Avoid copy-pasting large blocks of code from the diff. If suggesting a code improvement, provide only a brief 2-5 line snippet of the key change.
- Focus on high-impact feedback rather than minor style points.

Here is the git diff:
\`\`\`diff
${diffToSend}
\`\`\`
`;

  // 5. Call Gemini API
  const { reviewText, usedModel, wasTruncated } = await callGeminiWithRetry(prompt, apiKey, modelName);

  // 6. Post or Update PR Comment
  const commentIdentifier = '\n\n<!-- gemini-pr-reviewer-comment -->';
  let footer = `\n\n---\n*Generated by **Gemini PR Reviewer** using ${usedModel}*`;
  if (wasTruncated) {
    footer = `\n\n⚠️ **Note**: The review was truncated because it reached the maximum response token limit. Consider reviewing smaller commits.\n\n` + footer;
  }
  const commentBody = `### 🤖 Gemini Code Review\n\n${reviewText}${footer}${commentIdentifier}`;

  await postOrUpdateComment(repo, prNumber, token, commentBody);

  // 7. Write to GitHub Step Summary page
  let summaryText = `### ✅ Gemini PR Review Completed\n\nSuccessfully reviewed PR #${prNumber} using model **${usedModel}**.`;
  if (wasTruncated) {
    summaryText += `\n\n⚠️ **Warning**: The generated review was truncated because it reached the maximum output token limit.`;
  }
  writeJobSummary(summaryText);
}

main().catch(err => {
  console.error('Review script failed:', err);
  process.exit(1);
});
