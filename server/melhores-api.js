import {
  loadMelhoresStateFromNotion,
  applyVotingSessionToNotion,
  resetMelhoresScoresOnNotion,
} from './melhores-sync.js';

function withCorsHeaders(payload, status = 200) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: payload,
  };
}

function handleError(error) {
  console.error('[melhores-api]', error);

  return withCorsHeaders(
    {
      ok: false,
      error: error.message || 'Unexpected error while syncing with Notion.',
    },
    500,
  );
}

export async function handleMelhoresStateRequest() {
  try {
    const payload = await loadMelhoresStateFromNotion();
    return withCorsHeaders({ ok: true, ...payload });
  } catch (error) {
    return handleError(error);
  }
}

export async function handleMelhoresApplyRequest(body = {}) {
  try {
    const payload = await applyVotingSessionToNotion({
      sessionResults: body.sessionResults || {},
      bestWinnerId: body.bestWinnerId || null,
      worstWinnerId: body.worstWinnerId || null,
      voteDate: body.voteDate || null,
    });

    return withCorsHeaders({ ok: true, ...payload });
  } catch (error) {
    return handleError(error);
  }
}

export async function handleMelhoresResetRequest() {
  try {
    const payload = await resetMelhoresScoresOnNotion();
    return withCorsHeaders({ ok: true, ...payload });
  } catch (error) {
    return handleError(error);
  }
}
