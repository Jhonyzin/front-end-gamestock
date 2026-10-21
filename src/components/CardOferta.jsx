// Card grande da seção "Descontos e eventos" (jogos em promoção)
import Imagem from './Imagem.jsx';
import Preco from './Preco.jsx';
import { tempoRestante } from '../util/formatar.js';

// Cor da etiqueta de acordo com a promoção
const CORES = ['#7b3fe4', '#1ba39c', '#d9822b', '#2a6fdb', '#c0392b'];

export default function CardOferta({ jogo }) {
  const promocao = jogo.promocao;
  const cor = CORES[(promocao?.id || 0) % CORES.length];

  return (
    <a href={`#/jogo/${jogo.id}`} className="card-oferta">
      {promocao && (
        <span className="card-oferta-etiqueta" style={{ background: cor }}>
          {promocao.nome.toUpperCase()}
        </span>
      )}
      <div className="card-oferta-imagem">
        <Imagem src={jogo.capa} alt={jogo.nome} />
      </div>
      <div className="card-oferta-rodape">
        <div>
          <div className="card-oferta-nome">{jogo.nome}</div>
          {promocao && <div className="card-oferta-tempo">Termina em {tempoRestante(promocao.fim)}</div>}
        </div>
        <Preco jogo={jogo} />
      </div>
    </a>
  );
}
