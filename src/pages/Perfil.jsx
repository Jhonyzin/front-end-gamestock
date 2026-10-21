// Meu perfil: foto, nome de exibição, telefone, e-mail e senha (cada bloco salva separado)
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { data, mascaraTelefone } from '../util/formatar.js';
import Imagem from '../components/Imagem.jsx';
import { ExigirLogin } from '../components/Estado.jsx';

export default function Perfil() {
  return (
    <ExigirLogin>
      <PerfilConteudo />
    </ExigirLogin>
  );
}

function PerfilConteudo() {
  const { usuario, setUsuario } = useAuth();
  const { mostrarToast } = useToast();

  // Executa uma ação da API mostrando toast de sucesso/erro
  async function executar(acao, mensagem) {
    try {
      const resultado = await acao();
      if (resultado?.id) setUsuario(resultado);   // a API devolve o usuário atualizado
      mostrarToast(mensagem, 'sucesso');
      return true;
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
      return false;
    }
  }

  return (
    <div className="conteudo perfil">
      <h1>Meu perfil</h1>
      <p className="aviso-pequeno">Membro desde {data(usuario.data_cadastro)}</p>
      <div className="grade-perfil">
        <BlocoFoto usuario={usuario} executar={executar} />
        <BlocoDados usuario={usuario} executar={executar} />
        <BlocoEmail usuario={usuario} executar={executar} />
        <BlocoSenha executar={executar} />
      </div>
    </div>
  );
}

function BlocoFoto({ usuario, executar }) {
  const [arquivo, setArquivo] = useState(null);
  const [previa, setPrevia] = useState(null);

  // Pré-visualização da foto escolhida
  useEffect(() => {
    if (!arquivo) {
      setPrevia(null);
      return undefined;
    }
    const url = URL.createObjectURL(arquivo);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  async function enviar() {
    const formulario = new FormData();
    formulario.append('foto', arquivo);
    if (await executar(() => api('/perfil/foto', { metodo: 'POST', corpo: formulario }), 'Foto atualizada!')) setArquivo(null);
  }

  function escolher(e) {
    const escolhido = e.target.files[0];
    if (escolhido && escolhido.size > 2 * 1024 * 1024) {
      alert('A foto deve ter no máximo 2 MB.');
      return;
    }
    setArquivo(escolhido || null);
  }

  return (
    <section className="bloco">
      <h3>Foto de perfil</h3>
      <div className="foto-perfil">
        {previa ? <img src={previa} alt="Prévia" /> : <Imagem src={usuario.foto_perfil || '/capas/avatar.svg'} alt="Foto de perfil" />}
      </div>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={escolher} />
      <small className="info-campo">JPG, PNG ou WEBP de até 2 MB.</small>
      <div className="botoes">
        <button className="botao botao-principal" disabled={!arquivo} onClick={enviar}>Enviar nova foto</button>
        {usuario.foto_perfil && (
          <button className="botao botao-secundario" onClick={() => executar(() => api('/perfil/foto', { metodo: 'DELETE' }), 'Foto removida.')}>
            Remover foto
          </button>
        )}
      </div>
    </section>
  );
}

function BlocoDados({ usuario, executar }) {
  const [nome, setNome] = useState(usuario.nome_exibicao || '');
  const [telefone, setTelefone] = useState(mascaraTelefone(usuario.telefone || ''));

  function salvar(e) {
    e.preventDefault();
    executar(() => api('/perfil', { metodo: 'PUT', corpo: { nome_exibicao: nome, telefone } }), 'Dados salvos!');
  }

  return (
    <section className="bloco">
      <h3>Dados pessoais</h3>
      <form className="formulario" onSubmit={salvar}>
        <label>
          Nome de exibição
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
        </label>
        <label>
          Telefone
          <input value={telefone} onChange={(e) => setTelefone(mascaraTelefone(e.target.value))} placeholder="(99) 99999-9999" />
        </label>
        <button className="botao botao-principal">Salvar dados</button>
      </form>
    </section>
  );
}

function BlocoEmail({ usuario, executar }) {
  const [email, setEmail] = useState(usuario.email);
  const [senha, setSenha] = useState('');

  async function salvar(e) {
    e.preventDefault();
    if (await executar(() => api('/perfil/email', { metodo: 'PUT', corpo: { email, senha_atual: senha } }), 'E-mail alterado!')) setSenha('');
  }

  return (
    <section className="bloco">
      <h3>E-mail</h3>
      <form className="formulario" onSubmit={salvar}>
        <label>
          Novo e-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha atual (para confirmar)
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
        </label>
        <button className="botao botao-principal">Alterar e-mail</button>
      </form>
    </section>
  );
}

function BlocoSenha({ executar }) {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');

  async function salvar(e) {
    e.preventDefault();
    if (nova.length < 6) return setErro('A nova senha deve ter pelo menos 6 caracteres.');
    if (nova !== confirmar) return setErro('As senhas não são iguais.');
    setErro('');
    if (await executar(() => api('/perfil/senha', { metodo: 'PUT', corpo: { senha_atual: atual, nova_senha: nova } }), 'Senha alterada!')) {
      setAtual('');
      setNova('');
      setConfirmar('');
    }
    return undefined;
  }

  return (
    <section className="bloco">
      <h3>Trocar senha</h3>
      <form className="formulario" onSubmit={salvar}>
        <label>
          Senha atual
          <input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} required autoComplete="current-password" />
        </label>
        <label>
          Nova senha
          <input type="password" value={nova} onChange={(e) => setNova(e.target.value)} required autoComplete="new-password" />
        </label>
        <label>
          Confirmar nova senha
          <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required autoComplete="new-password" />
        </label>
        {erro && <p className="erro-formulario">{erro}</p>}
        <button className="botao botao-principal">Trocar senha</button>
      </form>
    </section>
  );
}
