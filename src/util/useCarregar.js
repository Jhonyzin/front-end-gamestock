// Hook simples para buscar dados da API com estados de carregando/erro.
// Ex.: const { dados, carregando, erro, recarregar } = useCarregar(() => api('/categorias'), []);
import { useCallback, useEffect, useState } from 'react';

export function useCarregar(buscar, dependencias = []) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;   // evita atualizar a tela depois que o componente saiu
    setCarregando(true);
    setErro(null);
    buscar()
      .then((resultado) => ativo && setDados(resultado))
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return { dados, setDados, carregando, erro, recarregar };
}
