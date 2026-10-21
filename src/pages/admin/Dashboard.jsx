// Dashboard com números reais (inclusive das compras simuladas)
import { api } from '../../api.js';
import { useCarregar } from '../../util/useCarregar.js';
import { moeda, data, dataHora, NOMES_METODO } from '../../util/formatar.js';
import Imagem from '../../components/Imagem.jsx';
import Selo from '../../components/Selo.jsx';
import { Carregando, ErroCarregar } from '../../components/Estado.jsx';

function CardNumero({ titulo, valor, detalhe }) {
  return (
    <div className="card-numero">
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {detalhe && <small>{detalhe}</small>}
    </div>
  );
}

export default function Dashboard() {
  const estado = useCarregar(() => api('/admin/dashboard'), []);

  if (estado.carregando) return <Carregando />;
  if (estado.erro) return <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />;
  const d = estado.dados;

  const maiorDia = Math.max(1, ...d.vendas_por_dia.map((v) => v.total));
  const totalMetodos = d.vendas_por_metodo.reduce((s, m) => s + m.total, 0) || 1;
  const totalCategorias = d.vendas_por_categoria.reduce((s, c) => s + c.receita, 0) || 1;

  return (
    <div>
      <div className="admin-cabecalho">
        <h1>Dashboard</h1>
        <div className="botoes">
          <button className="botao botao-secundario" onClick={estado.recarregar}>↻ Atualizar</button>
          <a href="#/admin/jogos" className="botao botao-principal">Gerenciar produtos</a>
          <a href="#/" className="botao botao-secundario">Ver loja</a>
        </div>
      </div>

      <div className="grade-numeros">
        <CardNumero titulo="Total de produtos" valor={d.total_jogos} detalhe={`${d.jogos_esgotados} esgotado(s)`} />
        <CardNumero titulo="Em estoque" valor={d.jogos_em_estoque} detalhe="mais de 5 chaves" />
        <CardNumero titulo="Estoque baixo" valor={d.jogos_estoque_baixo} detalhe="abaixo de 5 (1 a 5)" />
        <CardNumero titulo="Usuários" valor={d.total_usuarios} detalhe="clientes e administradores" />
        <CardNumero titulo="Vendas" valor={d.total_vendas} detalhe="pedidos concluídos" />
        <CardNumero titulo="Faturamento" valor={moeda(d.faturamento)} detalhe="receita bruta" />
        <CardNumero titulo="Ticket médio" valor={moeda(d.ticket_medio)} detalhe="por pedido" />
      </div>

      <section className="bloco">
        <h3>Vendas dos últimos 30 dias</h3>
        {/* Gráfico de barras feito só com HTML/CSS */}
        <div className="grafico-barras">
          {d.vendas_por_dia.map((v) => (
            <div key={v.dia} className="grafico-coluna" title={`${data(v.dia)}: ${v.pedidos} pedido(s) · ${moeda(v.total)}`}>
              <div className="grafico-barra" style={{ height: `${(v.total / maiorDia) * 100}%` }} />
              <span>{v.dia.slice(8, 10)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-duas-colunas">
        <section className="bloco">
          <h3>Vendas por método de pagamento</h3>
          {d.vendas_por_metodo.length === 0 && <p>Sem vendas ainda.</p>}
          {d.vendas_por_metodo.map((m) => (
            <div key={m.metodo} className="barra-horizontal">
              <span>{NOMES_METODO[m.metodo]} ({m.pedidos})</span>
              <div><div style={{ width: `${(m.total / totalMetodos) * 100}%` }} /></div>
              <strong>{moeda(m.total)}</strong>
            </div>
          ))}
        </section>

        <section className="bloco">
          <h3>Vendas por categoria</h3>
          {d.vendas_por_categoria.length === 0 && <p>Sem vendas ainda.</p>}
          {d.vendas_por_categoria.map((c) => (
            <div key={c.categoria} className="barra-horizontal">
              <span>{c.categoria} ({c.quantidade})</span>
              <div><div style={{ width: `${(c.receita / totalCategorias) * 100}%` }} /></div>
              <strong>{moeda(c.receita)}</strong>
            </div>
          ))}
        </section>
      </div>

      <div className="admin-duas-colunas">
        <section className="bloco">
          <h3>Mais vendidos (top 5)</h3>
          <ol className="lista-admin">
            {d.top_jogos.map((j) => (
              <li key={j.id}>
                <Imagem src={j.capa} alt="" />
                <span>{j.nome}</span>
                <small>{j.quantidade} venda(s)</small>
                <strong>{moeda(j.receita)}</strong>
              </li>
            ))}
          </ol>
        </section>

        <section className="bloco">
          <h3>Atenção ao inventário</h3>
          {d.estoque_critico.length === 0 && <p>Nenhum jogo com estoque crítico.</p>}
          <ul className="lista-admin">
            {d.estoque_critico.map((j) => (
              <li key={j.id}>
                <Imagem src={j.capa} alt="" />
                <span>{j.nome}</span>
                <Selo tipo={j.estoque === 0 ? 'esgotado' : 'baixo'}>{j.estoque === 0 ? 'Esgotado' : `${j.estoque} chave(s)`}</Selo>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bloco">
        <h3>Últimos pedidos</h3>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Nº</th><th>Cliente</th><th>Data</th><th>Itens</th><th>Método</th><th>Total</th></tr>
            </thead>
            <tbody>
              {d.ultimos_pedidos.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.cliente?.nome}</td>
                  <td>{dataHora(p.data_criacao)}</td>
                  <td>{p.itens.map((i) => i.nome).join(', ')}</td>
                  <td>{p.pagamento ? NOMES_METODO[p.pagamento.metodo] : 'Gratuito'}</td>
                  <td>{moeda(p.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
