// Carrossel "Destaques e recomendados": troca sozinho a cada 6 segundos
import { useEffect, useState } from 'react';
import Imagem from './Imagem.jsx';
import Preco from './Preco.jsx';
import { resumoAvaliacoes, tempoRestante } from '../util/formatar.js';

export default function Carrossel({ jogos }) {
  const [indice, setIndice] = useState(0);
  const [imagemAtiva, setImagemAtiva] = useState(null);   // miniatura com o mouse em cima
  const total = jogos.length;

  function ir(novo) {
    setIndice((novo + total) % total);
    setImagemAtiva(null);
  }

  // A cada troca de slide, agenda a próxima em 6 s
  useEffect(() => {
    if (total < 2) return undefined;
    const temporizador = setTimeout(() => {
      setIndice((i) => (i + 1) % total);
      setImagemAtiva(null);
    }, 6000);
    return () => clearTimeout(temporizador);
  }, [indice, total]);

  if (!total) return null;

  const jogo = jogos[indice];
  const anterior = jogos[(indice - 1 + total) % total];
  const proximo = jogos[(indice + 1) % total];
  const miniaturas = [jogo.capa, ...(jogo.galeria || []).map((g) => g.caminho_url)].slice(0, 4);
  const resumo = resumoAvaliacoes(jogo.total_avaliacoes, jogo.avaliacoes_positivas);

  return (
    <div className="carrossel">
      <div className="carrossel-palco">
        <button className="carrossel-seta" onClick={() => ir(indice - 1)} aria-label="Anterior">‹</button>

        <a href={`#/jogo/${anterior.id}`} className="carrossel-vizinho" aria-hidden="true" tabIndex={-1}>
          <Imagem src={anterior.capa} alt="" />
        </a>

        <div className="carrossel-slide">
          <a href={`#/jogo/${jogo.id}`} className="carrossel-capa">
            <Imagem src={imagemAtiva || jogo.capa} alt={jogo.nome} />
          </a>
          <div className="carrossel-info">
            <a href={`#/jogo/${jogo.id}`} className="carrossel-nome">{jogo.nome}</a>
            <p className={`resumo-avaliacoes resumo-${resumo.classe}`}>
              {resumo.texto}
              {jogo.total_avaliacoes > 0 && ` (${jogo.total_avaliacoes.toLocaleString('pt-BR')} análises)`}
            </p>
            <div className="carrossel-miniaturas">
              {miniaturas.map((m, i) => (
                <button key={i} onMouseEnter={() => setImagemAtiva(m)} onFocus={() => setImagemAtiva(m)} onClick={() => setImagemAtiva(m)}>
                  <Imagem src={m} alt="" />
                </button>
              ))}
            </div>
            <p className="carrossel-destaque">
              {jogo.promocao
                ? `${jogo.promocao.nome} — termina em ${tempoRestante(jogo.promocao.fim)}`
                : jogo.descricao_curta}
            </p>
            <div className="carrossel-rodape">
              <span className="carrossel-disponivel">{jogo.possui ? 'Na sua biblioteca' : 'Já disponível'}</span>
              <Preco jogo={jogo} />
            </div>
          </div>
        </div>

        <a href={`#/jogo/${proximo.id}`} className="carrossel-vizinho" aria-hidden="true" tabIndex={-1}>
          <Imagem src={proximo.capa} alt="" />
        </a>

        <button className="carrossel-seta" onClick={() => ir(indice + 1)} aria-label="Próximo">›</button>
      </div>

      <div className="carrossel-bolinhas">
        {jogos.map((j, i) => (
          <button key={j.id} className={i === indice ? 'ativa' : ''} onClick={() => ir(i)} aria-label={`Ir para ${j.nome}`} />
        ))}
      </div>
    </div>
  );
}
