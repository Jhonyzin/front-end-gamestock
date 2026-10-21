// Lista os cartões salvos para escolher no checkout, com a opção "Usar outro cartão"
import MiniCartao from './MiniCartao.jsx';

export default function SeletorCartao({ cartoes, selecionado, aoSelecionar }) {
  return (
    <div className="seletor-cartao">
      {cartoes.map((c) => (
        <label key={c.id} className={`seletor-opcao ${selecionado === c.id ? 'ativa' : ''} ${c.vencido ? 'desativada' : ''}`}>
          <input
            type="radio"
            name="cartao"
            checked={selecionado === c.id}
            disabled={c.vencido}
            onChange={() => aoSelecionar(c.id)}
          />
          <MiniCartao cartao={c} />
          {c.vencido && <span className="erro-campo">Vencido</span>}
        </label>
      ))}
      <label className={`seletor-opcao ${selecionado === 'novo' ? 'ativa' : ''}`}>
        <input type="radio" name="cartao" checked={selecionado === 'novo'} onChange={() => aoSelecionar('novo')} />
        <span className="seletor-novo">＋ Usar outro cartão</span>
      </label>
    </div>
  );
}
