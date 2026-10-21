// Guarda o usuário logado, o token e a lista de desejos.
// Também controla o modal de login (abrirLogin).
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, lerToken, salvarToken, quandoLoginExpirar } from '../api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { mostrarToast } = useToast();
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);   // conferindo o token salvo
  const [desejos, setDesejos] = useState([]);              // ids dos jogos desejados
  const [modalLogin, setModalLogin] = useState(null);      // null | 'login' | 'cadastro'

  // Carrega os ids da lista de desejos
  const carregarDesejos = useCallback(async () => {
    try {
      const jogos = await api('/desejos');
      setDesejos(jogos.map((j) => j.id));
    } catch {
      setDesejos([]);
    }
  }, []);

  // Ao abrir o site: se houver token salvo, busca o usuário
  useEffect(() => {
    quandoLoginExpirar(() => {
      setUsuario(null);
      setDesejos([]);
    });
    if (!lerToken()) {
      setVerificando(false);
      return;
    }
    api('/auth/me')
      .then((u) => {
        setUsuario(u);
        carregarDesejos();
      })
      .catch(() => salvarToken(null))
      .finally(() => setVerificando(false));
  }, [carregarDesejos]);

  async function entrar(email, senha) {
    const { token, usuario: u } = await api('/auth/login', { metodo: 'POST', corpo: { email, senha } });
    salvarToken(token);
    setUsuario(u);
    carregarDesejos();
    return u;
  }

  async function cadastrar(dados) {
    const { token, usuario: u } = await api('/auth/cadastro', { metodo: 'POST', corpo: dados });
    salvarToken(token);
    setUsuario(u);
    setDesejos([]);
    return u;
  }

  async function sair() {
    try {
      await api('/auth/logout', { metodo: 'POST' });
    } catch {
      // mesmo com erro na API, sai localmente
    }
    salvarToken(null);
    setUsuario(null);
    setDesejos([]);
    mostrarToast('Você saiu da sua conta.', 'info');
  }

  // Coração do card: adiciona/remove da lista de desejos
  async function alternarDesejo(jogo) {
    if (!usuario) {
      setModalLogin('login');
      mostrarToast('Entre na sua conta para usar a lista de desejos.', 'info');
      return;
    }
    const jaDesejado = desejos.includes(jogo.id);
    try {
      await api(`/desejos/${jogo.id}`, { metodo: jaDesejado ? 'DELETE' : 'POST' });
      setDesejos((lista) => (jaDesejado ? lista.filter((id) => id !== jogo.id) : [jogo.id, ...lista]));
      mostrarToast(jaDesejado ? 'Removido da lista de desejos.' : `${jogo.nome} foi para a lista de desejos.`, 'sucesso');
    } catch (e) {
      mostrarToast(e.message, 'erro');
    }
  }

  const valor = {
    usuario,
    setUsuario,
    verificando,
    ehAdmin: usuario?.tipo_usuario === 'ADMINISTRADOR',
    entrar,
    cadastrar,
    sair,
    desejos,
    alternarDesejo,
    modalLogin,
    abrirLogin: (modo = 'login') => setModalLogin(modo),
    fecharLogin: () => setModalLogin(null),
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
