import { handleMelhoresStateRequest } from '../../server/melhores-api.js';

export async function handler() {
  const response = await handleMelhoresStateRequest();

  return {
    statusCode: response.status,
    headers: response.headers,
    body: JSON.stringify(response.body),
  };
}
