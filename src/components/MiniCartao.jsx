// Cartão salvo em miniatura: logo do banco, bandeira, •••• 4242, validade e apelido
const SLUG_BANDEIRA = {
  Visa: 'visa', Mastercard: 'mastercard', Elo: 'elo', 'American Express': 'amex',
  Hipercard: 'hipercard', Diners: 'diners', Discover: 'discover',
};

export default function MiniCartao({ cartao }) {
  const cor = cartao.banco?.cor_hex || '#4b5563';
  const corTexto = cartao.banco?.slug === 'banco-do-brasil' ? '#003882' : '#ffffff';
  const bandeira = SLUG_BANDEIRA[cartao.bandeira];

  return (
    <div className="mini-cartao" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)`, color: corTexto }}>
      <div className="mini-cartao-topo">
        <img src={`/bancos/${cartao.banco?.slug || 'generico'}.svg`} alt="" />
        <span>{cartao.banco?.nome || cartao.emissor || 'Banco não identificado'}</span>
        {cartao.padrao && <span className="selo selo-ok">Padrão</span>}
      </div>
      <div className="mini-cartao-numero">•••• {cartao.ultimos_4_digitos}</div>
      <div className="mini-cartao-rodape">
        <span>{cartao.apelido || (cartao.tipo === 'CARTAO_DEBITO' ? 'Débito' : 'Crédito')}</span>
        <span>{cartao.validade}</span>
        {bandeira && <img src={`/bandeiras/${bandeira}.svg`} alt={cartao.bandeira} />}
      </div>
    </div>
  );
}
