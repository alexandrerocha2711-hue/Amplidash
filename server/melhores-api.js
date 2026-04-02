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

export async function handleMelhoresStateRequest() {
  return withCorsHeaders({ ok: true, participants: [], source: 'offline' });
}

export async function handleMelhoresApplyRequest(body = {}) {
  return withCorsHeaders({ ok: true, source: 'offline' });
}

export async function handleMelhoresResetRequest() {
  return withCorsHeaders({ ok: true, source: 'offline' });
}
