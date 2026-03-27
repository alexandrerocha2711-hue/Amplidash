import { handleMelhoresApplyRequest } from '../../server/melhores-api.js';

export async function handler(event) {
  const body = event.body ? JSON.parse(event.body) : {};
  const response = await handleMelhoresApplyRequest(body);

  return {
    statusCode: response.status,
    headers: response.headers,
    body: JSON.stringify(response.body),
  };
}
