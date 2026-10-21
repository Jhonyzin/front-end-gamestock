// Admin > Pedidos (somente leitura)
import { api } from '../../api.js';
import { useCarregar } from '../../util/useCarregar.js';
import { moeda, dataHora, NOMES_METODO } from '../../util/formatar.js';
import Selo from '../../components/Selo.jsx';
import { Carregando, ErroCarregar } from '../../components/Estado.jsx';

export default function Pedidos() {
  const estado = useCarregar(() => api('/admin/pedidos'), []);

  return (
    <div>
      <div className="admin-cabecalho">
        <h1>Pedidos</h1>
        <button className="botao botao-secundario" onClick={estado.recarregar}>↻ Atualizar</button>
      </div>
      {estado.carregando && <Carregando />}
      {estado.erro && <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />}
      {estado.dados && (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Nº</th><th>Cliente</th><th>Data</th><th>Itens</th><th>Pagamento</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {estado.dados.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.cliente?.nome}<small className="bloco-texto">{p.cliente?.email}</small></td>
                  <td>{dataHora(p.data_criacao)}</td>
                  <td>
                    {p.itens.map((i) => (
                      <div key={i.item_id}>{i.nome} — {moeda(i.preco_unitario)} <small>({i.codigo_resgate})</small></div>
                    ))}
                  </td>
                  <td>
                    {p.pagamento ? NOMES_METODO[p.pagamento.metodo] : 'Gratuito'}
                    {p.pagamento?.bandeira && <small className="bloco-texto">{p.pagamento.bandeira} {p.pagamento.emissor && `· ${p.pagamento.emissor}`} •••• {p.pagamento.ultimos_4_digitos} · {p.pagamento.parcelas}x</small>}
                  </td>
                  <td>
                    {moeda(p.valor_total)}
                    {p.desconto > 0 && <small className="bloco-texto">cupom {p.cupom}: -{moeda(p.desconto)}</small>}
                  </td>
                  <td><Selo tipo={p.status === 'CONCLUIDO' ? 'ok' : 'neutro'}>{p.status}</Selo></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
