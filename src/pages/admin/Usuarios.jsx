// Admin > Usuários: listar, criar, editar, ativar/desativar e excluir (não a si mesmo)
import { useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useCarregar } from '../../util/useCarregar.js';
import { data, mascaraTelefone } from '../../util/formatar.js';
import Modal from '../../components/Modal.jsx';
import Selo from '../../components/Selo.jsx';
import Imagem from '../../components/Imagem.jsx';
import { Carregando, ErroCarregar } from '../../components/Estado.jsx';

export default function Usuarios() {
  const { usuario: eu } = useAuth();
  const { mostrarToast } = useToast();
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(undefined);
  const estado = useCarregar(() => api('/admin/usuarios'), []);

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

  const corpoDe = (u) => ({ nome: u.nome, nome_exibicao: u.nome_exibicao, email: u.email, telefone: u.telefone, tipo_usuario: u.tipo_usuario, ativo: u.ativo });
  const lista = (estado.dados || []).filter((u) => `${u.nome} ${u.email}`.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div>
      <div className="admin-cabecalho">
        <h1>Usuários</h1>
        <button className="botao botao-principal" onClick={() => setEditando(null)}>＋ Novo usuário</button>
      </div>
      <input className="campo-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail…" />

      {estado.carregando && <Carregando />}
      {estado.erro && <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />}
      {estado.dados && (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th></th><th>Nome</th><th>E-mail</th><th>Tipo</th><th>Situação</th><th>Cadastro</th><th>Pedidos</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {lista.map((u) => {
                const souEu = u.id === eu.id;
                return (
                  <tr key={u.id}>
                    <td><Imagem src={u.foto_perfil || '/capas/avatar.svg'} alt="" className="avatar-pequeno" /></td>
                    <td>{u.nome} {souEu && <Selo tipo="destaque">você</Selo>}</td>
                    <td>{u.email}</td>
                    <td><Selo tipo={u.tipo_usuario === 'ADMINISTRADOR' ? 'destaque' : 'neutro'}>{u.tipo_usuario === 'ADMINISTRADOR' ? 'Administrador' : 'Cliente'}</Selo></td>
                    <td>{u.ativo ? <Selo tipo="ok">Ativo</Selo> : <Selo tipo="esgotado">Inativo</Selo>}</td>
                    <td>{data(u.data_cadastro)}</td>
                    <td>{u.total_pedidos}</td>
                    <td className="acoes-tabela">
                      <button className="botao botao-secundario botao-pequeno" onClick={() => setEditando(u)}>Editar</button>
                      <button
                        className="botao botao-secundario botao-pequeno"
                        disabled={souEu}
                        title={souEu ? 'Você não pode desativar a si mesmo' : ''}
                        onClick={() => executar(() => api(`/admin/usuarios/${u.id}`, { metodo: 'PUT', corpo: { ...corpoDe(u), ativo: !u.ativo } }), u.ativo ? 'Usuário desativado.' : 'Usuário ativado.')}
                      >
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        className="botao botao-perigo botao-pequeno"
                        disabled={souEu}
                        title={souEu ? 'Você não pode excluir a si mesmo' : ''}
                        onClick={() => window.confirm(`Excluir ${u.nome}?`) && executar(() => api(`/admin/usuarios/${u.id}`, { metodo: 'DELETE' }), 'Usuário excluído.')}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editando !== undefined && (
        <FormUsuario
          usuario={editando}
          souEu={editando?.id === eu.id}
          aoFechar={() => setEditando(undefined)}
          aoSalvar={async (corpo) => {
            const ok = await executar(
              () => (editando ? api(`/admin/usuarios/${editando.id}`, { metodo: 'PUT', corpo }) : api('/admin/usuarios', { metodo: 'POST', corpo })),
              editando ? 'Usuário atualizado!' : 'Usuário criado!'
            );
            if (ok) setEditando(undefined);
          }}
        />
      )}
    </div>
  );
}

function FormUsuario({ usuario, souEu, aoFechar, aoSalvar }) {
  const [campos, setCampos] = useState({
    nome: usuario?.nome || '',
    nome_exibicao: usuario?.nome_exibicao || '',
    email: usuario?.email || '',
    telefone: mascaraTelefone(usuario?.telefone || ''),
    tipo_usuario: usuario?.tipo_usuario || 'CLIENTE',
    ativo: usuario ? usuario.ativo : true,
    senha: '',
  });
  const alterar = (nome, valor) => setCampos((c) => ({ ...c, [nome]: valor }));

  return (
    <Modal titulo={usuario ? 'Editar usuário' : 'Novo usuário'} aoFechar={aoFechar}>
      <form className="formulario" onSubmit={(e) => { e.preventDefault(); aoSalvar(campos); }}>
        <label>Nome completo *<input value={campos.nome} onChange={(e) => alterar('nome', e.target.value)} required /></label>
        <label>Nome de exibição<input value={campos.nome_exibicao} onChange={(e) => alterar('nome_exibicao', e.target.value)} maxLength={80} /></label>
        <label>E-mail *<input type="email" value={campos.email} onChange={(e) => alterar('email', e.target.value)} required /></label>
        <label>Telefone<input value={campos.telefone} onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))} placeholder="(99) 99999-9999" /></label>
        <label>
          Tipo
          <select value={campos.tipo_usuario} onChange={(e) => alterar('tipo_usuario', e.target.value)} disabled={souEu}>
            <option value="CLIENTE">Cliente (comprador)</option>
            <option value="ADMINISTRADOR">Administrador (vendedor)</option>
          </select>
        </label>
        <label>
          {usuario ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
          <input type="password" value={campos.senha} onChange={(e) => alterar('senha', e.target.value)} minLength={6} required={!usuario} autoComplete="new-password" />
        </label>
        <label className="opcao">
          <input type="checkbox" checked={campos.ativo} disabled={souEu} onChange={(e) => alterar('ativo', e.target.checked)} /> Conta ativa
        </label>
        <div className="botoes rodape-formulario">
          <button className="botao botao-principal">Salvar</button>
          <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
