import { handleMelhoresResetRequest } from '../../server/melhores-api.js';

export async function handler() {
  const response = await handleMelhoresResetRequest();

  return {
    statusCode: response.status,
    headers: response.headers,
    body: JSON.stringify(response.body),
  };
}
