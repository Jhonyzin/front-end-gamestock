// Modal de login e cadastro, com botões de acesso rápido para a apresentação
import { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { mascaraTelefone } from '../util/formatar.js';

// Contas de teste (criadas no 02_dados_iniciais.sql) - troque as senhas em produção
const DEMOS = {
  admin: { email: 'admin@gamestock.local', senha: 'Admin@123' },
  cliente: { email: 'jogador@gamestock.local', senha: 'Jogador@123' },
};

const VAZIO = { nome: '', email: '', telefone: '', senha: '', confirmar: '', termos: false };

export default function LoginModal() {
  const { modalLogin, abrirLogin, fecharLogin, entrar, cadastrar } = useAuth();
  const { mostrarToast } = useToast();
  const [campos, setCampos] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!modalLogin) return null;
  const cadastro = modalLogin === 'cadastro';

  function alterar(nome, valor) {
    setCampos((c) => ({ ...c, [nome]: valor }));
    setErro('');
  }

  function trocarModo(modo) {
    setErro('');
    abrirLogin(modo);
  }

  function fechar() {
    setCampos(VAZIO);
    setErro('');
    fecharLogin();
  }

  // Validações do lado do navegador (o servidor valida de novo)
  function validar() {
    if (!campos.email.trim() || !campos.senha) return 'Preencha e-mail e senha.';
    if (!cadastro) return '';
    if (!campos.nome.trim()) return 'Preencha seu nome.';
    if (!/^\S+@\S+\.\S+$/.test(campos.email)) return 'E-mail inválido.';
    if (campos.senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (campos.senha !== campos.confirmar) return 'As senhas não são iguais.';
    if (!campos.termos) return 'Você precisa aceitar os termos de uso.';
    return '';
  }

  async function enviar(e, dados = campos) {
    if (e) e.preventDefault();
    const problema = e ? validar() : '';
    if (problema) {
      setErro(problema);
      return;
    }
    setEnviando(true);
    try {
      const u = cadastro
        ? await cadastrar({ nome: dados.nome, email: dados.email, telefone: dados.telefone, senha: dados.senha })
        : await entrar(dados.email, dados.senha);
      mostrarToast(`Bem-vindo(a), ${u.nome_exibicao}!`, 'sucesso');
      fechar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  // Acesso rápido: preenche e envia as credenciais de teste
  function demo(tipo) {
    const dados = { ...VAZIO, ...DEMOS[tipo] };
    setCampos(dados);
    if (cadastro) abrirLogin('login');
    setEnviando(true);
    entrar(dados.email, dados.senha)
      .then((u) => {
        mostrarToast(`Bem-vindo(a), ${u.nome_exibicao}!`, 'sucesso');
        fechar();
      })
      .catch((falha) => setErro(falha.message))
      .finally(() => setEnviando(false));
  }

  return (
    <Modal titulo={cadastro ? 'Criar conta' : 'Entrar'} aoFechar={fechar}>
      <div className="abas-login">
        <button className={!cadastro ? 'ativa' : ''} onClick={() => trocarModo('login')}>Entrar</button>
        <button className={cadastro ? 'ativa' : ''} onClick={() => trocarModo('cadastro')}>Criar conta</button>
      </div>

      <form onSubmit={enviar} className="formulario">
        {cadastro && (
          <label>
            Nome completo
            <input value={campos.nome} onChange={(e) => alterar('nome', e.target.value)} autoComplete="name" />
          </label>
        )}
        <label>
          E-mail
          <input type="email" value={campos.email} onChange={(e) => alterar('email', e.target.value)} autoComplete="email" />
        </label>
        {cadastro && (
          <label>
            Telefone (opcional)
            <input value={campos.telefone} onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))} placeholder="(99) 99999-9999" />
          </label>
        )}
        <label>
          Senha
          <input type="password" value={campos.senha} onChange={(e) => alterar('senha', e.target.value)} autoComplete={cadastro ? 'new-password' : 'current-password'} />
        </label>
        {cadastro && (
          <>
            <label>
              Confirmar senha
              <input type="password" value={campos.confirmar} onChange={(e) => alterar('confirmar', e.target.value)} autoComplete="new-password" />
            </label>
            <label className="opcao">
              <input type="checkbox" checked={campos.termos} onChange={(e) => alterar('termos', e.target.checked)} />
              Li e aceito os termos de uso e a política de privacidade
            </label>
          </>
        )}

        {erro && <p className="erro-formulario">{erro}</p>}

        <button className="botao botao-principal botao-largo" disabled={enviando}>
          {enviando ? 'Aguarde…' : cadastro ? 'Criar conta' : 'Entrar'}
        </button>

        {!cadastro && (
          <button
            type="button"
            className="link-botao"
            onClick={() => mostrarToast('Simulação: em uma loja real enviaríamos um e-mail para redefinir sua senha.', 'info')}
          >
            Esqueci minha senha
          </button>
        )}
      </form>

      <div className="acesso-demo">
        <p>Acesso rápido de demonstração</p>
        <div>
          <button className="botao botao-secundario" onClick={() => demo('admin')} disabled={enviando}>Demo Administrador</button>
          <button className="botao botao-secundario" onClick={() => demo('cliente')} disabled={enviando}>Demo Cliente</button>
        </div>
      </div>
    </Modal>
  );
}
