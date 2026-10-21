// Admin > Avaliações: moderação (excluir comentários)
import { api } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useCarregar } from '../../util/useCarregar.js';
import { data } from '../../util/formatar.js';
import Estrelas from '../../components/Estrelas.jsx';
import { Carregando, ErroCarregar, Vazio } from '../../components/Estado.jsx';

export default function Avaliacoes() {
  const { mostrarToast } = useToast();
  const estado = useCarregar(() => api('/admin/avaliacoes'), []);

  async function excluir(a) {
    if (!window.confirm(`Excluir a avaliação de ${a.autor} sobre ${a.produto_nome}?`)) return;
    try {
      await api(`/admin/avaliacoes/${a.id}`, { metodo: 'DELETE' });
      mostrarToast('Avaliação removida.', 'sucesso');
      estado.recarregar();
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
    }
  }

  return (
    <div>
      <div className="admin-cabecalho"><h1>Avaliações</h1></div>
      {estado.carregando && <Carregando />}
      {estado.erro && <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />}
      {estado.dados && estado.dados.length === 0 && <Vazio>Nenhuma avaliação ainda.</Vazio>}
      {estado.dados && estado.dados.length > 0 && (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Jogo</th><th>Autor</th><th>Nota</th><th>Comentário</th><th>Data</th><th></th></tr>
            </thead>
            <tbody>
              {estado.dados.map((a) => (
                <tr key={a.id}>
                  <td><a href={`#/jogo/${a.produto_id}`}>{a.produto_nome}</a></td>
                  <td>{a.autor}</td>
                  <td><Estrelas nota={a.nota} /></td>
                  <td>{a.comentario || '—'}</td>
                  <td>{data(a.data)}</td>
                  <td><button className="botao botao-perigo botao-pequeno" onClick={() => excluir(a)}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
