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
  'gemini-1.5-pro',
];

/**
 * File extensions and exact filenames that should be excluded from review.
 */
const EXCLUDED_FILE_EXTENSIONS = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.pdf',
  '.zip',
  '.gz',
  '.tar',
  '.mp4',
  '.mp3',
  '.woff',
  '.woff2',
  '.eot',
  '.ttf',
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
 * Catches errors and prints to console.error instead of throwing, ensuring
 * that any transient GitHub Actions runner glitch does not fail the developer CI.
 * @param {string} text - Markdown text to append
 */
function writeJobSummary(text) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    try {
      fs.appendFileSync(summaryFile, `${text}\n`);
    } catch (err) {
      console.error(
        'Non-blocking failure writing to GITHUB_STEP_SUMMARY:',
        err,
      );
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

      const { status } = response;
      // Retry only on rate limits (429) or transient server errors (5xx).
      // Fail fast on client permissions/auth errors (like 403 Forbidden).
      if (status === 429 || (status >= 500 && status <= 599)) {
        if (attempt < maxRetries) {
          console.warn(
            `GitHub API call failed (status: ${status}). Retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(
        `GitHub API network error: ${err.message}. Retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
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
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PR diff: ${response.status} ${response.statusText}`,
    );
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
      // Check for double-quoted paths (used by git when paths contain spaces/special characters)
      let match = firstLineOfBlock.match(/^"a\/(.+?)"\s+"b\/(.+)"$/);
      if (!match) {
        // Fallback to unquoted prefix-agnostic regex
        match = firstLineOfBlock.match(/^(?:a\/)?(.+?)\s+(?:b\/)?(.+)$/);
      }

      if (match && match[2]) {
        filePath = match[2];
      } else {
        console.warn(
          `Could not reliably determine file path for diff block starting with: ${firstLineOfBlock.substring(
            0,
            100,
          )}... Defaulting to empty path.`,
        );
        filePath = ''; // Safe fallback to avoid matching any exclusion extensions
      }
    }

    // Strip surrounding double quotes if any remain
    filePath = filePath.replace(/^"|"$/g, '');

    // Exclude lockfiles, media, binaries, and web fonts
    const isExcluded = EXCLUDED_FILE_EXTENSIONS.some(
      (ext) => filePath.endsWith(ext) || filePath.split('/').pop() === ext,
    );

    if (!isExcluded) {
      if (block.length > MAX_SINGLE_FILE_DIFF_LENGTH) {
        console.warn(
          `Diff block for ${filePath} is too large (${block.length} chars). Omitting changes from prompt to preserve token budget.`,
        );
        // Keep the diff git header but replace the body with a friendly warning placeholder
        filteredBlocks.push(
          `diff --git ${firstLineOfBlock}\n\n... [Diff for this file was omitted from review because it exceeds 100,000 characters to preserve token budget] ...\n`,
        );
      } else {
        filteredBlocks.push(`diff --git ${block}`);
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
  let primaryError;

  for (const model of models) {
    const maxRetries = 3;
    let delay = 2000;
    let skippedModel = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(
        `Sending diff to Gemini (${model}) - Attempt ${attempt}/${maxRetries}...`,
      );
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
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096,
              },
            }),
          },
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
              wasTruncated,
            };
          }
          throw new Error('Gemini API returned an empty response.');
        }

        const errorText = await response.text();
        const { status } = response;
        console.error(
          `Gemini API call failed with status ${status} for model ${model}:`,
          errorText,
        );

        // Attempt to parse user-friendly error message and look for retryDelay
        let errorMessage = response.statusText;
        let retryDelaySeconds = 0;
        try {
          const parsedError = JSON.parse(errorText);
          if (parsedError.error) {
            if (parsedError.error.message) {
              errorMessage = parsedError.error.message;
            }
            if (parsedError.error.details) {
              const retryInfo = parsedError.error.details.find(
                (d) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo',
              );
              if (retryInfo && retryInfo.retryDelay) {
                const match = retryInfo.retryDelay.match(/^([\d.]+)/);
                if (match) {
                  retryDelaySeconds = parseFloat(match[1]);
                }
              }
            }
          }
        } catch (_) {
          console.debug(
            'Could not parse Gemini API error response as JSON. Falling back to raw text.',
          );
          if (errorText) errorMessage = errorText;
        }

        lastError = new Error(`Gemini API Error (${status}): ${errorMessage}`);
        if (!primaryError) {
          primaryError = lastError;
        }

        // Only retry on rate limit (429) or server errors (5xx)
        const isRetryable = status === 429 || (status >= 500 && status <= 599);
        if (!isRetryable) {
          console.warn(
            `Non-retryable client error ${status} for model ${model}. Skipping to next model...`,
          );
          skippedModel = true;
          break;
        }

        if (attempt < maxRetries) {
          const currentDelay = retryDelaySeconds > 0 ? retryDelaySeconds * 1000 + 1000 : delay;
          console.warn(
            `Attempt ${attempt} failed with status ${status}. Retrying in ${currentDelay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          delay *= 2;
        }
      } catch (err) {
        lastError = err;
        if (!primaryError) {
          primaryError = lastError;
        }
        if (attempt === maxRetries) {
          console.warn(`All attempts failed for model ${model}.`);
        } else {
          console.warn(
            `Attempt ${attempt} encountered an error: ${err.message}. Retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }
    if (skippedModel) {
      continue;
    }
    console.warn(`Model ${model} unavailable. Trying next fallback model...`);
  }

  throw primaryError || lastError;
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
    },
  );

  if (!commentsResponse.ok) {
    throw new Error(
      `Failed to fetch PR comments: ${commentsResponse.status} ${commentsResponse.statusText}`,
    );
  }

  const comments = await commentsResponse.json();
  const existingComment = comments.find(
    (c) => c.body && c.body.includes('<!-- gemini-pr-reviewer-comment -->'),
  );

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
      },
    );

    if (!updateResponse.ok) {
      throw new Error(
        `Failed to update comment: ${updateResponse.status} ${updateResponse.statusText}`,
      );
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
      },
    );

    if (!createResponse.ok) {
      throw new Error(
        `Failed to create comment: ${createResponse.status} ${createResponse.statusText}`,
      );
    }
    console.log('Comment created successfully.');
  }
}

/**
 * Validates the inputs required for running the PR review.
 * Exits the process if validation fails.
 * @param {string} token - GitHub token
 * @param {string} apiKey - Gemini API Key
 * @param {string} repo - GitHub repository identifier
 * @param {string} rawPrNumber - Raw PR number from environment
 * @param {string} modelName - Selected Gemini model name
 * @returns {string} Sanitized PR number
 */
function validateInputs(token, apiKey, repo, rawPrNumber, modelName) {
  if (modelName && !GEMINI_MODELS.includes(modelName)) {
    console.warn(
      `Warning: Selected model "${modelName}" is not in the recognized GEMINI_MODELS fallback list:`,
      GEMINI_MODELS,
    );
  }

  if (!token) {
    console.error('Error: GITHUB_TOKEN is not set.');
    process.exit(1);
  }
  if (!apiKey) {
    let isFork = false;
    if (process.env.GITHUB_EVENT_PATH) {
      try {
        const eventData = JSON.parse(
          fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'),
        );
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
  if (!repo || !rawPrNumber) {
    console.error('Error: GITHUB_REPOSITORY or PR_NUMBER is not set.');
    process.exit(1);
  }

  const prNumber = rawPrNumber.trim();
  if (!/^\d+$/.test(prNumber)) {
    console.error(
      `Error: PR_NUMBER must be a valid integer, got "${rawPrNumber}".`,
    );
    process.exit(1);
  }

  return prNumber;
}

/**
 * Handles size limits of the filtered diff by truncating it at file boundaries if too large.
 * @param {string} filteredDiff - The filtered diff content
 * @returns {{diffToSend: string, isTruncated: boolean}} The processed diff and its truncation status
 */
function processDiffLimit(filteredDiff) {
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

    // Since MAX_SINGLE_FILE_DIFF_LENGTH (100k) is less than MAX_DIFF_LENGTH (250k),
    // selectedBlocks will always contain at least the first block, ensuring we truncate strictly at file boundaries.
    diffToSend = `${selectedBlocks.join(
      '',
    )}\n\n... [Remaining file diffs truncated due to size limits] ...`;
    console.log(
      `Diff size (${filteredDiff.length} chars) exceeds limit. Truncated to ${diffToSend.length} chars.`,
    );
  } else {
    console.log(`Filtered diff size: ${filteredDiff.length} characters.`);
  }

  return { diffToSend, isTruncated };
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const apiKey = process.env.GEMINI_API_KEY;
  const repo = process.env.GITHUB_REPOSITORY;
  const rawPrNumber = process.env.PR_NUMBER;
  const modelName = process.env.MODEL_NAME || 'gemini-2.5-flash';

  // Validate inputs and obtain sanitized PR number
  const prNumber = validateInputs(token, apiKey, repo, rawPrNumber, modelName);

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
  const { diffToSend, isTruncated } = processDiffLimit(filteredDiff);

  // 4. Prepare Prompt (Instructing model to be concise and avoid quoting large blocks of code)
  const prompt = `You are an expert AI code reviewer. Please review the following git diff for a pull request in the repository "${repo}".
${
  isTruncated
    ? '\nNOTE: The diff was truncated due to length limits. Please review the available portion.\n'
    : ''
}
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
  const { reviewText, usedModel, wasTruncated } = await callGeminiWithRetry(
    prompt,
    apiKey,
    modelName,
  );

  // 6. Post or Update PR Comment
  const commentIdentifier = '\n\n<!-- gemini-pr-reviewer-comment -->';
  let footer = `\n\n---\n*Generated by **Gemini PR Reviewer** using ${usedModel}*`;
  if (wasTruncated) {
    footer = `\n\n⚠️ **Note**: The review was truncated because it reached the maximum response token limit. Consider reviewing smaller commits.\n\n${footer}`;
  }
  const commentBody = `### 🤖 Gemini Code Review\n\n${reviewText}${footer}${commentIdentifier}`;

  await postOrUpdateComment(repo, prNumber, token, commentBody);

  // 7. Write to GitHub Step Summary page
  let summaryText = `### ✅ Gemini PR Review Completed\n\nSuccessfully reviewed PR #${prNumber} using model **${usedModel}**.`;
  if (wasTruncated) {
    summaryText
      += '\n\n⚠️ **Warning**: The generated review was truncated because it reached the maximum output token limit.';
  }
  writeJobSummary(summaryText);
}

main().catch((err) => {
  console.error('Review script failed:', err);
  process.exit(1);
});
