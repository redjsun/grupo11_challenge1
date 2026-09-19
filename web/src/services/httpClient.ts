// Camada de infraestrutura: único ponto de acesso HTTP da aplicação.
const BASE_URL = "/api";

export async function httpGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Falha na requisição: ${response.status}`);
  }

  return (await response.json()) as T;
}
