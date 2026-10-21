// Funções pequenas de formatação usadas em várias telas.
import { BACKEND_URL } from '../api.js';

// 84.5 -> "R$ 84,50"
export function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// "2025-06-10 14:30:00" -> "10/06/2025"
export function data(texto) {
  if (!texto) return '';
  const [ano, mes, dia] = texto.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// "2025-06-10 14:30:00" -> "10/06/2025 14:30"
export function dataHora(texto) {
  if (!texto) return '';
  return `${data(texto)} ${texto.slice(11, 16)}`;
}

// Converte "2025-06-10 14:30:00" em objeto Date (horário local)
export function paraDate(texto) {
  return new Date(texto.replace(' ', 'T'));
}

// Resolve o endereço de uma imagem:
// http... = usa direto | /uploads/... = está no back-end | resto = pasta public do site
export function urlImagem(caminho) {
  if (!caminho) return '/capas/padrao.svg';
  if (caminho.startsWith('http')) return caminho;
  if (caminho.startsWith('/uploads/')) return BACKEND_URL + caminho;
  return caminho;
}

// Regra do estoque: > 5 em estoque | 1 a 5 estoque baixo | 0 esgotado
export function estadoEstoque(estoque) {
  if (estoque <= 0) return { texto: 'Esgotado', classe: 'esgotado', esgotado: true };
  if (estoque <= 5) return { texto: `Restam apenas ${estoque}`, classe: 'baixo', esgotado: false };
  return { texto: 'Em estoque', classe: 'ok', esgotado: false };
}

// Resumo das avaliações (como na Steam)
export function resumoAvaliacoes(total, positivas) {
  if (!total) return { texto: 'Sem avaliações', classe: 'sem' };
  if (positivas / total >= 0.8) return { texto: 'Muito positivas', classe: 'positivas' };
  return { texto: 'Mistas', classe: 'mistas' };
}

// "2025-06-12 18:00:00" -> "2 dias e 5 h"
export function tempoRestante(fim) {
  if (!fim) return '';
  const ms = paraDate(fim) - new Date();
  if (ms <= 0) return 'encerrada';
  const horas = Math.floor(ms / 3600000);
  const dias = Math.floor(horas / 24);
  if (dias > 0) return `${dias} dia${dias > 1 ? 's' : ''} e ${horas % 24} h`;
  const minutos = Math.floor((ms % 3600000) / 60000);
  return `${horas} h e ${minutos} min`;
}

// Máscara de telefone: "38999998888" -> "(38) 99999-8888"
export function mascaraTelefone(valor) {
  const d = (valor || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const NOMES_METODO = {
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão de crédito',
  CARTAO_DEBITO: 'Cartão de débito',
  BOLETO: 'Boleto',
};

export const NOMES_ORIGEM = {
  COMPRA: 'Compra',
  PRESENTE: 'Presente',
  PROMOCAO: 'Promoção',
  GRATUITO: 'Gratuito',
};

// Copia um texto para a área de transferência
export async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
