// Carrinho de compras: guarda SÓ os ids dos jogos no localStorage.
// Os preços sempre vêm da API (nunca confiamos em preço salvo no navegador).
import { createContext, useContext, useEffect, useState } from 'react';

const CarrinhoContext = createContext(null);
const CHAVE = 'gamestock_carrinho';

function lerCarrinho() {
  try {
    const ids = JSON.parse(localStorage.getItem(CHAVE) || '[]');
    return Array.isArray(ids) ? ids.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

export function CarrinhoProvider({ children }) {
  const [ids, setIds] = useState(lerCarrinho);
  const [cupom, setCupom] = useState(null);   // { codigo, percentual }

  // Sempre que o carrinho muda, salva no navegador
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(ids));
    } catch {
      // sem armazenamento: o carrinho dura só até fechar a aba
    }
  }, [ids]);

  const valor = {
    ids,
    quantidade: ids.length,
    contem: (id) => ids.includes(id),
    // 1 unidade por jogo: se já está no carrinho, não repete
    adicionar: (id) => setIds((lista) => (lista.includes(id) ? lista : [...lista, id])),
    remover: (id) => setIds((lista) => lista.filter((x) => x !== id)),
    esvaziar: () => {
      setIds([]);
      setCupom(null);
    },
    cupom,
    setCupom,
  };

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho() {
  return useContext(CarrinhoContext);
}
