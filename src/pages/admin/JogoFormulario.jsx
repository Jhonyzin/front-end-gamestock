// Formulário de jogo (criar/editar) com capa, galeria e trailer
import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { moeda, urlImagem } from '../../util/formatar.js';
import Modal from '../../components/Modal.jsx';
import Imagem from '../../components/Imagem.jsx';
import { Carregando } from '../../components/Estado.jsx';

const VAZIO = {
  nome: '', categorias: [], plataformas: [], preco: '', estoque: '', descricao_curta: '', descricao: '',
  tipo_midia: 'DIGITAL', edicao: '', versao_console: '', ano_lancamento: '', editora_id: '', marca_id: '',
  espaco_minimo_requerido: '', req_so: '', req_cpu: '', req_gpu: '', req_ram: '',
  destaque: false, popular: false, selo: '', ativo: true,
};

// Converte o jogo vindo da API para os campos do formulário
function paraCampos(j) {
  return {
    nome: j.nome, categorias: j.categoria_ids, plataformas: j.plataforma_ids,
    preco: String(j.preco_base), estoque: String(j.estoque), descricao_curta: j.descricao_curta || '',
    descricao: j.descricao || '', tipo_midia: j.tipo_midia, edicao: j.edicao || '', versao_console: j.versao_console || '',
    ano_lancamento: j.ano_lancamento ? String(j.ano_lancamento) : '', editora_id: j.editora_id || '', marca_id: j.marca_id || '',
    espaco_minimo_requerido: j.espaco_minimo_requerido || '', req_so: j.req_so || '', req_cpu: j.req_cpu || '',
    req_gpu: j.req_gpu || '', req_ram: j.req_ram || '', destaque: j.destaque, popular: j.popular, selo: j.selo || '', ativo: j.ativo,
  };
}

// Lista de caixinhas para escolher várias opções (categorias, plataformas)
function MultiEscolha({ opcoes, valores, aoMudar }) {
  function alternar(id) {
    aoMudar(valores.includes(id) ? valores.filter((v) => v !== id) : [...valores, id]);
  }
  return (
    <div className="multi-escolha">
      {opcoes.map((o) => (
        <label key={o.id} className={`opcao ${o.ativo === false ? 'inativa' : ''}`}>
          <input type="checkbox" checked={valores.includes(o.id)} onChange={() => alternar(o.id)} />
          {o.nome}
        </label>
      ))}
    </div>
  );
}

export default function JogoFormulario({ jogoId, aoFechar, aoSalvar }) {
  const { mostrarToast } = useToast();
  const [id, setId] = useState(jogoId);
  const [campos, setCampos] = useState(VAZIO);
  const [jogo, setJogo] = useState(null);          // dados da API (imagens, vídeos, preço final)
  const [listas, setListas] = useState(null);      // categorias, plataformas, marcas, editoras
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // capa nova (arquivo OU URL) e trailer
  const [modoCapa, setModoCapa] = useState('arquivo');
  const [capaArquivo, setCapaArquivo] = useState(null);
  const [capaUrl, setCapaUrl] = useState('');
  const [previaCapa, setPreviaCapa] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState('');

  // Carrega as listas dos selects e (se for edição) o jogo
  useEffect(() => {
    let ativo = true;
    Promise.all([
      api('/admin/categorias'), api('/admin/plataformas'), api('/admin/marcas'), api('/admin/editoras'),
      id ? api(`/admin/jogos/${id}`) : Promise.resolve(null),
    ])
      .then(([categorias, plataformas, marcas, editoras, dadosJogo]) => {
        if (!ativo) return;
        setListas({ categorias, plataformas, marcas, editoras });
        if (dadosJogo) {
          setJogo(dadosJogo);
          setCampos(paraCampos(dadosJogo));
        }
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [id]);

  // Pré-visualização da capa escolhida
  useEffect(() => {
    if (modoCapa === 'url') {
      setPreviaCapa(capaUrl ? urlImagem(capaUrl) : null);
      return undefined;
    }
    if (!capaArquivo) {
      setPreviaCapa(null);
      return undefined;
    }
    const url = URL.createObjectURL(capaArquivo);
    setPreviaCapa(url);
    return () => URL.revokeObjectURL(url);
  }, [modoCapa, capaArquivo, capaUrl]);

  function alterar(nome, valor) {
    setCampos((c) => ({ ...c, [nome]: valor }));
  }

  // Envia uma imagem (arquivo ou URL) para o jogo
  async function enviarImagem(jogoIdAlvo, tipo, arquivo, url) {
    if (arquivo) {
      const dados = new FormData();
      dados.append('arquivo', arquivo);
      dados.append('tipo', tipo);
      return api(`/admin/jogos/${jogoIdAlvo}/imagens`, { metodo: 'POST', corpo: dados });
    }
    return api(`/admin/jogos/${jogoIdAlvo}/imagens`, { metodo: 'POST', corpo: { url, tipo } });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    if (!campos.categorias.length || !campos.plataformas.length) {
      setErro('Escolha pelo menos uma categoria e uma plataforma.');
      return;
    }
    setSalvando(true);
    try {
      const corpo = { ...campos, preco: String(campos.preco).replace(',', '.') };
      const salvo = id
        ? await api(`/admin/jogos/${id}`, { metodo: 'PUT', corpo })
        : await api('/admin/jogos', { metodo: 'POST', corpo });

      // capa nova e trailer (depois que o jogo já tem id)
      if ((modoCapa === 'arquivo' && capaArquivo) || (modoCapa === 'url' && capaUrl.trim())) {
        await enviarImagem(salvo.id, 'CAPA', modoCapa === 'arquivo' ? capaArquivo : null, capaUrl.trim());
      }
      if (trailerUrl.trim()) {
        await api(`/admin/jogos/${salvo.id}/videos`, { metodo: 'POST', corpo: { url: trailerUrl.trim(), titulo: 'Trailer' } });
      }

      mostrarToast(id ? 'Jogo atualizado!' : 'Jogo criado! Agora você pode adicionar galeria e trailer.', 'sucesso');
      setCapaArquivo(null);
      setCapaUrl('');
      setTrailerUrl('');
      aoSalvar();
      if (!id) setId(salvo.id);                         // passa para o modo edição
      else setJogo(await api(`/admin/jogos/${salvo.id}`));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <Modal titulo="Carregando…" aoFechar={aoFechar}><Carregando /></Modal>;
  }
  if (!listas) {
    return <Modal titulo="Erro" aoFechar={aoFechar}><p className="erro-formulario">{erro}</p></Modal>;
  }

  return (
    <Modal titulo={id ? `Editar: ${campos.nome}` : 'Novo jogo'} aoFechar={aoFechar} largo>
      <form className="formulario form-jogo" onSubmit={salvar}>
        <fieldset>
          <legend>Informações principais</legend>
          <label className="campo-largo">
            Nome *
            <input value={campos.nome} onChange={(e) => alterar('nome', e.target.value)} required maxLength={150} />
          </label>
          <div className="linha-campos">
            <label>
              Preço original (R$) *
              <input value={campos.preco} onChange={(e) => alterar('preco', e.target.value)} required inputMode="decimal" placeholder="79,90" />
            </label>
            <label>
              Desconto atual (%)
              <input value={jogo ? Math.round(jogo.percentual) : 0} readOnly />
            </label>
            <label>
              Preço final
              <input value={jogo ? moeda(jogo.preco_final) : moeda(String(campos.preco).replace(',', '.'))} readOnly />
            </label>
            <label>
              Estoque (chaves) *
              <input type="number" min="0" value={campos.estoque} onChange={(e) => alterar('estoque', e.target.value)} required />
            </label>
          </div>
          <small className="info-campo">O desconto vem das promoções ativas — crie ou edite em “Promoções”.</small>

          <label className="campo-largo">
            Descrição curta
            <input value={campos.descricao_curta} onChange={(e) => alterar('descricao_curta', e.target.value)} maxLength={300} />
          </label>
          <label className="campo-largo">
            Descrição completa
            <textarea rows={4} value={campos.descricao} onChange={(e) => alterar('descricao', e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Categorias (gêneros) *</legend>
          <MultiEscolha opcoes={listas.categorias} valores={campos.categorias} aoMudar={(v) => alterar('categorias', v)} />
        </fieldset>

        <fieldset>
          <legend>Plataformas *</legend>
          <MultiEscolha opcoes={listas.plataformas} valores={campos.plataformas} aoMudar={(v) => alterar('plataformas', v)} />
        </fieldset>

        <fieldset>
          <legend>Detalhes</legend>
          <div className="linha-campos">
            <label>
              Tipo de mídia
              <select value={campos.tipo_midia} onChange={(e) => alterar('tipo_midia', e.target.value)}>
                <option value="DIGITAL">Digital (Key)</option>
                <option value="FISICA">Física</option>
              </select>
            </label>
            <label>
              Versão / edição
              <input value={campos.edicao} onChange={(e) => alterar('edicao', e.target.value)} maxLength={80} placeholder="Standard, Deluxe…" />
            </label>
            <label>
              Versão do console
              <input value={campos.versao_console} onChange={(e) => alterar('versao_console', e.target.value)} maxLength={80} />
            </label>
            <label>
              Ano de lançamento
              <input type="number" min="1970" max="2100" value={campos.ano_lancamento} onChange={(e) => alterar('ano_lancamento', e.target.value)} />
            </label>
          </div>
          <div className="linha-campos">
            <label>
              Editora
              <select value={campos.editora_id} onChange={(e) => alterar('editora_id', e.target.value)}>
                <option value="">Não informada</option>
                {listas.editoras.map((ed) => <option key={ed.id} value={ed.id}>{ed.nome}</option>)}
              </select>
            </label>
            <label>
              Desenvolvedora
              <select value={campos.marca_id} onChange={(e) => alterar('marca_id', e.target.value)}>
                <option value="">Não informada</option>
                {listas.marcas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </label>
            <label>
              Selo (etiqueta)
              <input value={campos.selo} onChange={(e) => alterar('selo', e.target.value)} maxLength={40} placeholder="Ex.: Novo" />
            </label>
          </div>
          <div className="linha-opcoes">
            <label className="opcao"><input type="checkbox" checked={campos.destaque} onChange={(e) => alterar('destaque', e.target.checked)} /> Destaque (carrossel)</label>
            <label className="opcao"><input type="checkbox" checked={campos.popular} onChange={(e) => alterar('popular', e.target.checked)} /> Popular</label>
            <label className="opcao"><input type="checkbox" checked={campos.ativo} onChange={(e) => alterar('ativo', e.target.checked)} /> Ativo (aparece na loja)</label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Requisitos mínimos</legend>
          <div className="linha-campos">
            <label>Sistema operacional<input value={campos.req_so} onChange={(e) => alterar('req_so', e.target.value)} maxLength={120} /></label>
            <label>Processador<input value={campos.req_cpu} onChange={(e) => alterar('req_cpu', e.target.value)} maxLength={120} /></label>
            <label>Placa de vídeo<input value={campos.req_gpu} onChange={(e) => alterar('req_gpu', e.target.value)} maxLength={120} /></label>
          </div>
          <div className="linha-campos">
            <label>Memória RAM<input value={campos.req_ram} onChange={(e) => alterar('req_ram', e.target.value)} maxLength={40} placeholder="8 GB" /></label>
            <label>Espaço mínimo requerido<input value={campos.espaco_minimo_requerido} onChange={(e) => alterar('espaco_minimo_requerido', e.target.value)} maxLength={40} placeholder="50 GB" /></label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Capa {id ? '(trocar)' : ''}</legend>
          <div className="capa-editor">
            <div className="capa-previa">
              {previaCapa ? <img src={previaCapa} alt="Prévia da capa" /> : <Imagem src={jogo?.capa} alt="Capa atual" />}
            </div>
            <div>
              <div className="linha-opcoes">
                <label className="opcao"><input type="radio" checked={modoCapa === 'arquivo'} onChange={() => setModoCapa('arquivo')} /> Enviar arquivo</label>
                <label className="opcao"><input type="radio" checked={modoCapa === 'url'} onChange={() => setModoCapa('url')} /> Colar URL</label>
              </div>
              {modoCapa === 'arquivo' ? (
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCapaArquivo(e.target.files[0] || null)} />
              ) : (
                <input value={capaUrl} onChange={(e) => setCapaUrl(e.target.value)} placeholder="https://… ou /capas/123.jpg" />
              )}
              <small className="info-campo">JPG, PNG ou WEBP até 5 MB. No Render, arquivos enviados somem a cada novo deploy: prefira URL.</small>
            </div>
          </div>
        </fieldset>

        {!id && (
          <fieldset>
            <legend>Trailer (opcional)</legend>
            <input value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
          </fieldset>
        )}

        {erro && <p className="erro-formulario">{erro}</p>}
        <div className="botoes rodape-formulario">
          <button className="botao botao-principal" disabled={salvando}>{salvando ? 'Salvando…' : id ? 'Salvar alterações' : 'Criar jogo'}</button>
          <button type="button" className="botao botao-secundario" onClick={aoFechar}>Fechar</button>
        </div>
      </form>

      {id && jogo && (
        <>
          <GerenciarGaleria jogo={jogo} aoMudar={(imagens) => setJogo({ ...jogo, imagens })} enviarImagem={enviarImagem} />
          <GerenciarTrailer jogo={jogo} aoMudar={(videos) => setJogo({ ...jogo, videos })} />
        </>
      )}
    </Modal>
  );
}

// Galeria: adicionar (arquivo ou URL), ordenar, marcar capa principal e remover
function GerenciarGaleria({ jogo, aoMudar, enviarImagem }) {
  const { mostrarToast } = useToast();
  const [tipo, setTipo] = useState('GALERIA');
  const [arquivo, setArquivo] = useState(null);
  const [url, setUrl] = useState('');
  const [versaoInput, setVersaoInput] = useState(0);
  const imagens = jogo.imagens;

  async function executar(acao, mensagem) {
    try {
      aoMudar(await acao());
      if (mensagem) mostrarToast(mensagem, 'sucesso');
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
    }
  }

  async function adicionar() {
    if (!arquivo && !url.trim()) {
      mostrarToast('Escolha um arquivo ou cole uma URL.', 'erro');
      return;
    }
    await executar(() => enviarImagem(jogo.id, tipo, arquivo, url.trim()), 'Imagem adicionada!');
    setArquivo(null);
    setUrl('');
    setVersaoInput((v) => v + 1);
  }

  // Troca de lugar com a imagem vizinha e renumera a ordem de todas (0, 1, 2...)
  async function mover(indice, direcao) {
    const nova = [...imagens];
    [nova[indice], nova[indice + direcao]] = [nova[indice + direcao], nova[indice]];
    await executar(async () => {
      let resultado = imagens;
      for (let posicao = 0; posicao < nova.length; posicao++) {
        resultado = await api(`/admin/imagens/${nova[posicao].id}`, {
          metodo: 'PUT',
          corpo: { ordem: posicao, principal: nova[posicao].principal },
        });
      }
      return resultado;
    });
  }

  return (
    <section className="bloco gerenciar-midia">
      <h3>Imagens (capa, galeria e screenshots)</h3>
      <p className="info-campo">Dica: as fotos também podem ficar em <code>public/capas/</code> como <code>/capas/{jogo.id}-1.jpg</code>, <code>/capas/{jogo.id}-2.jpg</code>… e serem cadastradas aqui por URL.</p>
      <div className="lista-imagens">
        {imagens.map((img, i) => (
          <div key={img.id} className="item-imagem">
            <Imagem src={img.caminho_url} alt="" />
            <small>{img.tipo}{img.principal ? ' · principal' : ''} · ordem {img.ordem}</small>
            <div className="botoes">
              <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => mover(i, -1)} disabled={i === 0}>←</button>
              <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => mover(i, 1)} disabled={i === imagens.length - 1}>→</button>
              {img.tipo === 'CAPA' && !img.principal && (
                <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => executar(() => api(`/admin/imagens/${img.id}`, { metodo: 'PUT', corpo: { ordem: img.ordem, principal: 1 } }), 'Capa principal definida.')}>
                  Tornar principal
                </button>
              )}
              <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => window.confirm('Remover esta imagem?') && executar(() => api(`/admin/imagens/${img.id}`, { metodo: 'DELETE' }), 'Imagem removida.')}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="linha-campos">
        <label>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="GALERIA">Galeria</option>
            <option value="SCREENSHOT">Screenshot</option>
            <option value="CAPA">Capa</option>
          </select>
        </label>
        <label>
          Arquivo
          <input key={versaoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setArquivo(e.target.files[0] || null)} />
        </label>
        <label>
          ou URL
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </label>
      </div>
      <button type="button" className="botao botao-principal" onClick={adicionar}>Adicionar imagem</button>
    </section>
  );
}

// Trailer do YouTube por URL
function GerenciarTrailer({ jogo, aoMudar }) {
  const { mostrarToast } = useToast();
  const [url, setUrl] = useState('');

  async function adicionar() {
    try {
      aoMudar(await api(`/admin/jogos/${jogo.id}/videos`, { metodo: 'POST', corpo: { url, titulo: 'Trailer' } }));
      setUrl('');
      mostrarToast('Trailer adicionado!', 'sucesso');
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
    }
  }

  async function remover(videoId) {
    try {
      await api(`/admin/videos/${videoId}`, { metodo: 'DELETE' });
      aoMudar(jogo.videos.filter((v) => v.id !== videoId));
      mostrarToast('Trailer removido.', 'sucesso');
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
    }
  }

  return (
    <section className="bloco gerenciar-midia">
      <h3>Trailer</h3>
      {jogo.videos.length === 0 && <p>Nenhum trailer cadastrado.</p>}
      <ul className="lista-simples">
        {jogo.videos.map((v) => (
          <li key={v.id}>
            <a href={v.url} target="_blank" rel="noreferrer">{v.url}</a>
            <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => remover(v.id)}>Remover</button>
          </li>
        ))}
      </ul>
      <div className="linha-campos">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
        <button type="button" className="botao botao-principal" onClick={adicionar} disabled={!url.trim()}>Adicionar trailer</button>
      </div>
    </section>
  );
}
