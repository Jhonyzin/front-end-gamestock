// Bloco de preço no estilo Steam: [-50%] R$ 169,00 (riscado) R$ 84,50
import { moeda } from '../util/formatar.js';

export default function Preco({ jogo, grande = false }) {
  const temDesconto = jogo.percentual > 0;
  return (
    <div className={`preco ${grande ? 'preco-grande' : ''}`}>
      {temDesconto && <span className="preco-desconto">-{Math.round(jogo.percentual)}%</span>}
      <div className="preco-valores">
        {temDesconto && <span className="preco-antigo">{moeda(jogo.preco_base)}</span>}
        <span className="preco-final">{jogo.preco_final > 0 ? moeda(jogo.preco_final) : 'Gratuito'}</span>
      </div>
    </div>
  );
}
