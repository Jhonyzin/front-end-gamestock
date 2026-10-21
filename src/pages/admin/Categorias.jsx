// Admin > Categorias. O componente CadastroSimples também é usado em Plataformas.
import { useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useCarregar } from '../../util/useCarregar.js';
import Selo from '../../components/Selo.jsx';
import { Carregando, ErroCarregar } from '../../components/Estado.jsx';

// CRUD simples: nome + ativo (rota = 'categorias' ou 'plataformas')
export function CadastroSimples({ titulo, rota, rotulo }) {
  const { mostrarToast } = useToast();
  const estado = useCarregar(() => api(`/admin/${rota}`), [rota]);
  const [novoNome, setNovoNome] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [nomeEditado, setNomeEditado] = useState('');

  async function executar(acao, mensagem) {
    try {
      await acao();
      mostrarToast(mensagem, 'sucesso');
      estado.recarregar();
      return true;
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
      return false;
    }
  }

  async function criar(e) {
    e.preventDefault();
    if (await executar(() => api(`/admin/${rota}`, { metodo: 'POST', corpo: { nome: novoNome, ativo: true } }), `${rotulo} criada!`)) setNovoNome('');
  }

  async function salvarNome(item) {
    if (await executar(() => api(`/admin/${rota}/${item.id}`, { metodo: 'PUT', corpo: { nome: nomeEditado, ativo: item.ativo } }), 'Nome atualizado.')) setEditandoId(null);
  }

  return (
    <div>
      <div className="admin-cabecalho"><h1>{titulo}</h1></div>
      <form className="linha-campos form-inline" onSubmit={criar}>
        <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder={`Nome da nova ${rotulo.toLowerCase()}`} maxLength={100} />
        <button className="botao botao-principal" disabled={!novoNome.trim()}>＋ Adicionar</button>
      </form>

      {estado.carregando && <Carregando />}
      {estado.erro && <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />}
      {estado.dados && (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Nome</th><th>Jogos ativos</th><th>Situação</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {estado.dados.map((item) => (
                <tr key={item.id}>
                  <td>
                    {editandoId === item.id ? (
                      <span className="linha-campos">
                        <input value={nomeEditado} onChange={(e) => setNomeEditado(e.target.value)} maxLength={100} />
                        <button className="botao botao-principal botao-pequeno" onClick={() => salvarNome(item)}>Salvar</button>
                        <button className="link-botao" onClick={() => setEditandoId(null)}>Cancelar</button>
                      </span>
                    ) : item.nome}
                  </td>
                  <td>{item.total_jogos}</td>
                  <td>{item.ativo ? <Selo tipo="ok">Ativa</Selo> : <Selo>Inativa</Selo>}</td>
                  <td className="acoes-tabela">
                    <button className="botao botao-secundario botao-pequeno" onClick={() => { setEditandoId(item.id); setNomeEditado(item.nome); }}>Renomear</button>
                    <button className="botao botao-secundario botao-pequeno" onClick={() => executar(() => api(`/admin/${rota}/${item.id}`, { metodo: 'PUT', corpo: { nome: item.nome, ativo: !item.ativo } }), item.ativo ? 'Desativada.' : 'Ativada.')}>
                      {item.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button className="botao botao-perigo botao-pequeno" onClick={() => window.confirm(`Excluir "${item.nome}"?`) && executar(() => api(`/admin/${rota}/${item.id}`, { metodo: 'DELETE' }), 'Excluída.')}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Categorias() {
  return <CadastroSimples titulo="Categorias" rota="categorias" rotulo="Categoria" />;
}
