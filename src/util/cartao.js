// Regras de cartão (iguais às do PHP em backend/core/Cartao.php).
// Servem só para mostrar a bandeira na hora e validar antes de enviar.

export function somenteDigitos(texto) {
  return (texto || '').replace(/\D/g, '');
}

// Algoritmo de Luhn (dígito verificador)
export function luhn(numero) {
  let soma = 0;
  let dobrar = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let digito = Number(numero[i]);
    if (dobrar) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    soma += digito;
    dobrar = !dobrar;
  }
  return numero.length > 0 && soma % 10 === 0;
}

// Reconhece a bandeira pelo começo do número (Elo primeiro!)
export function bandeira(numero) {
  const elo = ['636368', '438935', '504175', '451416', '636297', '5067', '4576', '4011', '6277'];
  if (elo.some((p) => numero.startsWith(p))) return { nome: 'Elo', slug: 'elo' };
  if (numero.startsWith('606282') || numero.startsWith('3841')) return { nome: 'Hipercard', slug: 'hipercard' };
  if (/^3[47]/.test(numero)) return { nome: 'American Express', slug: 'amex' };
  if (/^4/.test(numero)) return { nome: 'Visa', slug: 'visa' };
  if (/^5[1-5]/.test(numero) || /^2(22[1-9]|2[3-9]\d|[3-6]\d\d|7[01]\d|720)/.test(numero)) {
    return { nome: 'Mastercard', slug: 'mastercard' };
  }
  if (/^3(0[0-5]|[68])/.test(numero)) return { nome: 'Diners', slug: 'diners' };
  if (/^(6011|65|64[4-9])/.test(numero)) return { nome: 'Discover', slug: 'discover' };
  return null;
}

// Quantos dígitos o cartão tem
export function tamanhoNumero(slug) {
  if (slug === 'amex') return 15;
  if (slug === 'diners') return 14;
  return 16;
}

export function tamanhoCvv(slug) {
  return slug === 'amex' ? 4 : 3;
}

// "4242424242424242" -> "4242 4242 4242 4242" | Amex: "3782 822463 10005"
export function formatarNumero(numero, slug) {
  if (slug === 'amex' || slug === 'diners') {
    return [numero.slice(0, 4), numero.slice(4, 10), numero.slice(10)].filter(Boolean).join(' ');
  }
  return numero.replace(/(.{4})(?=.)/g, '$1 ');
}

// "0928" -> "09/28"
export function mascaraValidade(texto) {
  const d = somenteDigitos(texto).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// Validade MM/AA ainda não vencida?
export function validadeOk(texto) {
  const m = /^(\d{2})\/(\d{2})$/.exec(texto || '');
  if (!m) return false;
  const mes = Number(m[1]);
  const ano = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  const hoje = new Date();
  return ano > hoje.getFullYear() || (ano === hoje.getFullYear() && mes >= hoje.getMonth() + 1);
}

// Números de teste (passam no Luhn e NÃO são cartões reais)
export const CARTOES_TESTE = [
  { numero: '4242424242424242', descricao: 'Visa · Nubank' },
  { numero: '5555555555554444', descricao: 'Mastercard · Nubank' },
  { numero: '378282246310005', descricao: 'American Express' },
];
export const CARTAO_RECUSADO = '4242424200000000';
