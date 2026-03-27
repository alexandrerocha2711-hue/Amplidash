const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2026-03-11';
const DEFAULT_BEST_PAGE_ID = '2efb0bbef1538102b6fed7d0145cf99f';

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getBestPageId() {
  return process.env.NOTION_BEST_PAGE_ID || DEFAULT_BEST_PAGE_ID;
}

async function notionRequest(path, { method = 'GET', body } = {}) {
  const token = getRequiredEnv('NOTION_API_KEY');

  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorDetails = '';

    try {
      const payload = await response.json();
      errorDetails = payload.message || payload.code || JSON.stringify(payload);
    } catch (error) {
      errorDetails = await response.text();
    }

    throw new Error(`Notion API ${method} ${path} failed with ${response.status}: ${errorDetails}`);
  }

  return response.json();
}

export async function retrievePageMarkdown(pageId = getBestPageId()) {
  return notionRequest(`/pages/${pageId}/markdown`);
}

export async function updatePageMarkdownContent(contentUpdates, pageId = getBestPageId()) {
  if (!Array.isArray(contentUpdates) || contentUpdates.length === 0) {
    throw new Error('updatePageMarkdownContent requires at least one content update.');
  }

  return notionRequest(`/pages/${pageId}/markdown`, {
    method: 'PATCH',
    body: {
      type: 'update_content',
      update_content: {
        content_updates: contentUpdates,
      },
    },
  });
}
