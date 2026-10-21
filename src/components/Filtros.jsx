// Painel lateral de filtros da loja
export const FAIXAS_PRECO = [
  { valor: 'ate-50', texto: 'Até R$ 50' },
  { valor: 'ate-100', texto: 'Até R$ 100' },
  { valor: 'ate-150', texto: 'Até R$ 150' },
  { valor: 'acima-150', texto: 'Acima de R$ 150' },
];

export const NOTAS = [
  { valor: '4.5', texto: '4,5+ estrelas' },
  { valor: '4.8', texto: '4,8+ estrelas' },
];

export default function Filtros({ filtros, alterar, categorias, plataformas }) {
  return (
    <aside className="filtros">
      <div className="filtro-grupo">
        <h4>Gênero</h4>
        <select value={filtros.categoria} onChange={(e) => alterar({ categoria: e.target.value })}>
          <option value="">Todos os gêneros</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome} ({c.total_jogos})</option>
          ))}
        </select>
      </div>

      <div className="filtro-grupo">
        <h4>Plataforma</h4>
        <select value={filtros.plataforma} onChange={(e) => alterar({ plataforma: e.target.value })}>
          <option value="">Todas as plataformas</option>
          {plataformas.map((p) => (
            <option key={p.id} value={p.id}>{p.nome} ({p.total_jogos})</option>
          ))}
        </select>
      </div>

      <div className="filtro-grupo">
        <h4>Preço</h4>
        <label className="opcao">
          <input type="radio" name="preco" checked={!filtros.preco} onChange={() => alterar({ preco: '' })} />
          Qualquer preço
        </label>
        {FAIXAS_PRECO.map((f) => (
          <label key={f.valor} className="opcao">
            <input type="radio" name="preco" checked={filtros.preco === f.valor} onChange={() => alterar({ preco: f.valor })} />
            {f.texto}
          </label>
        ))}
        <label className="opcao">
          <input type="checkbox" checked={filtros.promocao === '1'} onChange={(e) => alterar({ promocao: e.target.checked ? '1' : '' })} />
          Apenas com desconto
        </label>
      </div>

      <div className="filtro-grupo">
        <h4>Avaliação mínima</h4>
        <label className="opcao">
          <input type="radio" name="nota" checked={!filtros.nota_min} onChange={() => alterar({ nota_min: '' })} />
          Todas
        </label>
        {NOTAS.map((n) => (
          <label key={n.valor} className="opcao">
            <input type="radio" name="nota" checked={filtros.nota_min === n.valor} onChange={() => alterar({ nota_min: n.valor })} />
            {n.texto}
          </label>
        ))}
      </div>
    </aside>
  );
}
