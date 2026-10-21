// Avisos rápidos no canto da tela (sucesso, erro, info).
// Uso: const { mostrarToast } = useToast(); mostrarToast('Salvo!', 'sucesso');
import { createContext, useCallback, useContext, useState } from 'react';
import Toast from '../components/Toast.jsx';

const ToastContext = createContext(null);
let proximoId = 1;

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const fechar = useCallback((id) => {
    setAvisos((lista) => lista.filter((a) => a.id !== id));
  }, []);

  const mostrarToast = useCallback((mensagem, tipo = 'sucesso') => {
    const id = proximoId++;
    setAvisos((lista) => [...lista, { id, mensagem, tipo }]);
    setTimeout(() => fechar(id), 4000);   // some sozinho depois de 4 s
  }, [fechar]);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <Toast avisos={avisos} aoFechar={fechar} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
