// Lista de avisos (toasts) no canto inferior direito
const ICONES = { sucesso: '✔', erro: '✖', info: 'ℹ' };

export default function Toast({ avisos, aoFechar }) {
  return (
    <div className="toasts" aria-live="polite">
      {avisos.map((aviso) => (
        <div key={aviso.id} className={`toast toast-${aviso.tipo}`}>
          <span className="toast-icone">{ICONES[aviso.tipo] || 'ℹ'}</span>
          <span className="toast-texto">{aviso.mensagem}</span>
          <button className="toast-fechar" onClick={() => aoFechar(aviso.id)} aria-label="Fechar aviso">×</button>
        </div>
      ))}
    </div>
  );
}
