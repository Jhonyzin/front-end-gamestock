// Admin > Produtos: tabela com busca e formulário de criar/editar/excluir
import { useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useCarregar } from '../../util/useCarregar.js';
import { moeda, estadoEstoque } from '../../util/formatar.js';
import Imagem from '../../components/Imagem.jsx';
import Selo from '../../components/Selo.jsx';
import { Carregando, ErroCarregar } from '../../components/Estado.jsx';
import JogoFormulario from './JogoFormulario.jsx';

export default function Jogos() {
  const { mostrarToast } = useToast();
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(undefined);   // undefined = fechado | null = novo | id
  const estado = useCarregar(() => api('/admin/jogos'), []);

  async function excluir(jogo) {
    if (!window.confirm(`Excluir "${jogo.nome}"? Ele some da loja (os pedidos antigos continuam).`)) return;
    try {
      await api(`/admin/jogos/${jogo.id}`, { metodo: 'DELETE' });
      mostrarToast('Jogo excluído.', 'sucesso');
      estado.recarregar();
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
    }
  }

  const lista = (estado.dados || []).filter((j) => j.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div>
      <div className="admin-cabecalho">
        <h1>Produtos ({estado.dados?.length || 0})</h1>
        <button className="botao botao-principal" onClick={() => setEditando(null)}>＋ Novo jogo</button>
      </div>
      <input className="campo-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar jogo pelo nome…" />

      {estado.carregando && <Carregando />}
      {estado.erro && <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />}
      {estado.dados && (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th></th><th>Nome</th><th>Preço</th><th>Estoque</th><th>Destaque</th><th>Ativo</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {lista.map((j) => {
                const estoque = estadoEstoque(j.estoque);
                return (
                  <tr key={j.id}>
                    <td><Imagem src={j.capa} alt="" className="miniatura-tabela" /></td>
                    <td>
                      <strong>{j.nome}</strong>
                      <small className="bloco-texto">#{j.id} · {j.categorias.join(', ')}</small>
                    </td>
                    <td>
                      {j.percentual > 0 ? (
                        <><s>{moeda(j.preco_base)}</s> <strong>{moeda(j.preco_final)}</strong> <Selo tipo="desconto">-{Math.round(j.percentual)}%</Selo></>
                      ) : moeda(j.preco_base)}
                    </td>
                    <td><Selo tipo={estoque.classe === 'ok' ? 'ok' : estoque.classe}>{j.estoque} · {estoque.esgotado ? 'Esgotado' : estoque.classe === 'baixo' ? 'Baixo' : 'OK'}</Selo></td>
                    <td>{j.destaque ? '★' : '—'}</td>
                    <td>{j.ativo ? <Selo tipo="ok">Ativo</Selo> : <Selo>Inativo</Selo>}</td>
                    <td className="acoes-tabela">
                      <button className="botao botao-secundario botao-pequeno" onClick={() => setEditando(j.id)}>Editar</button>
                      <button className="botao botao-perigo botao-pequeno" onClick={() => excluir(j)}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editando !== undefined && (
        <JogoFormulario
          jogoId={editando}
          aoFechar={() => setEditando(undefined)}
          aoSalvar={() => estado.recarregar()}
        />
      )}
    </div>
  );
}
