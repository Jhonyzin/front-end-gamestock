// Comunicação com a API PHP usando fetch.
// Toda resposta vem no formato {sucesso, dados} ou {sucesso: false, erro}.

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost/gamestock/backend/api').replace(/\/$/, '');

// Endereço do back-end sem o "/api" (usado para as imagens de /uploads/)
export const BACKEND_URL = API_URL.replace(/\/api$/, '');

const CHAVE_TOKEN = 'gamestock_token';

// localStorage pode falhar (aba anônima, bloqueio): por isso o try/catch
export function lerToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function salvarToken(token) {
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token);
    else localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // sem armazenamento: o login dura só até fechar a aba
  }
}

// Função chamada quando a API diz que o login expirou (401)
let aoExpirarLogin = null;
export function quandoLoginExpirar(funcao) {
  aoExpirarLogin = funcao;
}

/**
 * Faz uma requisição à API.
 * Ex.: api('/jogos?pagina=2')  |  api('/auth/login', { metodo: 'POST', corpo: {email, senha} })
 * "corpo" pode ser um objeto (vira JSON) ou um FormData (upload de arquivo).
 */
export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const opcoes = { method: metodo, headers: {} };

  const token = lerToken();
  if (token) opcoes.headers.Authorization = `Bearer ${token}`;

  if (corpo instanceof FormData) {
    opcoes.body = corpo;
  } else if (corpo !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }

  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, opcoes);
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Troque de operadora de internet.');
  }

  let json = null;
  try {
    json = await resposta.json();
  } catch {
    json = null;
  }

  // Token vencido ou inválido: sai da conta
  if (resposta.status === 401 && token) {
    salvarToken(null);
    if (aoExpirarLogin) aoExpirarLogin();
  }

  if (!resposta.ok || !json || !json.sucesso) {
    const erro = new Error(json?.erro || 'Erro inesperado. Tente novamente.');
    erro.status = resposta.status;
    throw erro;
  }
  return json.dados;
}
