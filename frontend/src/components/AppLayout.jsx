import { useState } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Icon, Loading, Modal, Field, Message } from './ui.jsx';
import { api, roles } from '../services/api.js';


const navigation = [
  ['/', 'Visão geral', 'grid'], ['/clientes', 'Clientes', 'users'], ['/atendimentos', 'Atendimentos', 'calendar'],
  ['/catalogo', 'Produtos e serviços', 'box'], ['/categorias', 'Categorias', 'tag'], ['/fornecedores', 'Fornecedores', 'truck'],
  ['/estoque', 'Estoque', 'stock'], ['/vendas', 'Vendas', 'cart'], ['/relatorios', 'Relatórios', 'chart']
];

function PasswordModal({ onClose }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { signOut } = useAuth();
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.password !== values.confirmation) return setError('As senhas precisam ser iguais.');
    setBusy(true);
    try { await api('/auth/password', { method: 'PUT', body: values }); await signOut(); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <Modal title="Alterar minha senha" onClose={onClose}><form onSubmit={submit}><p className="muted">Após a alteração, entre novamente com a nova senha.</p><Field label="Senha atual"><input name="current_password" type="password" required maxLength={128} autoComplete="current-password"/></Field><Field label="Nova senha"><input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password"/></Field><Field label="Confirmar senha"><input name="confirmation" type="password" required minLength={10} maxLength={128} autoComplete="new-password"/></Field><Message>{error}</Message><div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Voltar</button><button className="button primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar senha'}</button></div></form></Modal>;
}

export function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <Loading/>;
  if (!user) return <Navigate to="/entrar" replace/>;
  return <div className="app-shell"><aside className={`sidebar ${open ? 'is-open' : ''}`}><NavLink to="/" className="brand"><span className="brand-symbol"><Icon name="grid" size={22}/></span>Integra<span className="brand-dot">.</span></NavLink><div className="workspace-label"><span className="workspace-avatar">ME</span><div><strong>Meu negócio</strong><small>Gestão integrada</small></div></div><p className="nav-label">PRINCIPAL</p><nav aria-label="Menu principal">{[...navigation, ...(user.role === 'admin' ? [['/usuarios', 'Usuários', 'users']] : [])].map(([url, label, icon]) => <NavLink key={url} to={url} end={url === '/'} onClick={() => setOpen(false)}><Icon name={icon}/>{label}</NavLink>)}</nav></aside>{open && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setOpen(false)}/>}<div className="main-shell"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name="menu"/></button><span className="topbar-title">Plataforma de Gestão Integrada</span></div><div className="profile"><span className="profile-avatar">{user.name.slice(0, 2).toUpperCase()}</span><button className="profile-name" onClick={() => setPassword(true)} title="Alterar minha senha"><strong>{user.name}</strong><small>{roles[user.role]}</small></button><button className="icon-button" title="Sair da conta" aria-label="Sair da conta" onClick={() => signOut().catch(() => setError('Sessão local encerrada.'))}><Icon name="logout"/></button></div></header><main className="content"><Message>{error}</Message><Outlet/></main><footer className="app-footer">Integra · Gestão que acompanha o seu negócio.</footer></div>{password && <PasswordModal onClose={() => setPassword(false)}/>}</div>;
}
