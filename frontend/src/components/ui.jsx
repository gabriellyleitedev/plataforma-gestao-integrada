import { cloneElement, useEffect, useId, useRef } from 'react';

export function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m1 5a5 5 0 0 1 3 5"/></>,
    box: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm0 9 9-4M12 12 3 8m9 4v10M7 6l10 5"/></>,
    cart: <><path d="M2 3h3l3 12h11l3-8H6M9 19h.01M18 19h.01"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
    stock: <><path d="M4 6h16M4 12h16M4 18h16m-4-3 3 3-3 3M8 3 5 6l3 3"/></>,
    chart: <><path d="M4 3v17h17M8 15v-4m5 4V6m5 9V9"/></>,
    tag: <><path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7.5" cy="7.5" r="1"/></>,
    truck: <><path d="M3 5h12v12H3V5Zm12 5h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v5m10-5v5M3 11h18m-13 5h3"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    logout: <path d="M10 4H4v16h6m4-12 4 4-4 4m-5-4h13"/>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    edit: <><path d="m4 16-1 5 5-1L21 7l-4-4L4 16Z"/><path d="m14 6 4 4"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    menu: <path d="M3 6h18M3 12h18M3 18h18"/>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
}

export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="modal" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === ref.current) onClose(); }} aria-labelledby="modal-title"><header className="modal-header"><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={onClose}><Icon name="close"/></button></header>{children}</dialog>;
}
export function Field({ label, children, hint }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label>{cloneElement(children, { id, ...(hint ? { 'aria-describedby': `${id}-hint` } : {}) })}{hint && <small id={`${id}-hint`}>{hint}</small>}</div>;
}
export function Message({ children, success = false }) {
  return children ? <div role={success ? 'status' : 'alert'} className={`message ${success ? 'success' : 'error'}`}>{children}</div> : null;
}
export function Empty({ title = 'Nenhum registro por aqui', detail = 'Adicione o primeiro registro para começar.', action }) {
  return <div className="empty"><span className="empty-icon"><Icon name="box" size={30}/></span><h3>{title}</h3><p>{detail}</p>{action}</div>;
}
export function PageHeader({ eyebrow = 'Gestão do negócio', title, description, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>;
}
export function Loading() { return <p className="loading" role="status">Carregando informações…</p>; }
export function Badge({ children, tone = '' }) { return <span className={`badge ${tone}`}>{children}</span>; }
