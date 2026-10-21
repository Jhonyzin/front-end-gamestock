// Card de jogo usado na loja, lançamentos, desejos e relacionados
import Imagem from './Imagem.jsx';
import Preco from './Preco.jsx';
import Selo from './Selo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { estadoEstoque } from '../util/formatar.js';

export default function CardJogo({ jogo }) {
  const { desejos, alternarDesejo } = useAuth();
  const estoque = estadoEstoque(jogo.estoque);
  const desejado = desejos.includes(jogo.id);

  return (
    <article className="card-jogo">
      <a href={`#/jogo/${jogo.id}`} className="card-jogo-capa">
        <Imagem src={jogo.capa} alt={jogo.nome} />
        <div className="card-jogo-selos">
          {jogo.possui && <Selo tipo="biblioteca">NA BIBLIOTECA</Selo>}
          {!jogo.possui && estoque.esgotado && <Selo tipo="esgotado">Esgotado</Selo>}
          {!jogo.possui && estoque.classe === 'baixo' && <Selo tipo="baixo">Restam {jogo.estoque}</Selo>}
          {jogo.selo && <Selo tipo="destaque">{jogo.selo}</Selo>}
        </div>
      </a>
      <button
        className={`card-jogo-coracao ${desejado ? 'ativo' : ''}`}
        onClick={() => alternarDesejo(jogo)}
        title={desejado ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}
        aria-label="Lista de desejos"
      >
        {desejado ? '♥' : '♡'}
      </button>
      <div className="card-jogo-info">
        <a href={`#/jogo/${jogo.id}`} className="card-jogo-nome">{jogo.nome}</a>
        <div className="card-jogo-categoria">{jogo.categorias.join(', ')}</div>
        <div className="card-jogo-plataformas">{jogo.plataformas.join(' · ')}</div>
        <Preco jogo={jogo} />
      </div>
    </article>
  );
}
