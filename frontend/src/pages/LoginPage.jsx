import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useData } from '../hooks/useData.js';
import { api } from '../services/api.js';
import { Field, Message, Loading, Icon } from '../components/ui.jsx';

export function LoginPage() {
  const { user, signIn } = useAuth();
  const { data, error, loading, reload } = useData('/setup');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  if (user) return <Navigate to="/" replace/>;
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (data.needsSetup && values.password !== values.confirmation) { setFailure('As senhas precisam ser iguais.'); return; }
    setBusy(true); setFailure('');
    try {
      if (data.needsSetup) { await api('/setup', { method: 'POST', body: values }); reload(); }
      await signIn(values.email, values.password);
    } catch (error) { setFailure(error.message || 'Não foi possível conectar à API.'); }
    finally { setBusy(false); }
  }
  return <main className="login-page"><section className="login-story"><div className="brand"><span className="brand-symbol"><Icon name="grid" size={23}/></span>Integra<span className="brand-dot">.</span></div><div><p className="eyebrow">SEU NEGÓCIO, EM SINTONIA</p><h1>Menos planilhas.<br/>Mais gestão.</h1><p>Clientes, produtos, serviços e vendas em um só lugar. Mais clareza para cuidar do que faz o seu negócio crescer.</p><div className="story-grid"><span><Icon name="users"/>Relacionamentos</span><span><Icon name="box"/>Estoque organizado</span><span><Icon name="chart"/>Decisões com dados</span></div></div><small>Plataforma Web de Gestão Integrada · Projeto acadêmico</small></section><section className="login-panel"><div className="login-form"><p className="eyebrow">BEM-VINDO À INTEGRA</p><h2>{data?.needsSetup ? 'Vamos começar?' : 'Acesse seu espaço'}</h2><p>{data?.needsSetup ? 'Crie o primeiro administrador do seu negócio.' : 'Entre com o e-mail e a senha cadastrados.'}</p>{loading ? <Loading/> : error ? <><Message>{error}</Message><button className="button secondary" onClick={reload}>Tentar novamente</button></> : <form onSubmit={submit}>{data.needsSetup && <Field label="Seu nome"><input name="name" required maxLength={160} autoComplete="name"/></Field>}<Field label="E-mail"><input name="email" type="email" required maxLength={190} autoComplete="username"/></Field><Field label="Senha" hint={data.needsSetup ? 'Use entre 10 e 128 caracteres.' : undefined}><input name="password" type="password" required minLength={data.needsSetup ? 10 : 1} maxLength={128} autoComplete={data.needsSetup ? 'new-password' : 'current-password'}/></Field>{data.needsSetup && <Field label="Confirme a senha"><input name="confirmation" type="password" required minLength={10} maxLength={128} autoComplete="new-password"/></Field>}<Message>{failure}</Message><button className="button primary full" disabled={busy}>{busy ? 'Aguarde…' : data.needsSetup ? 'Criar conta e começar' : 'Entrar'}<Icon name="arrow"/></button></form>}<div className="login-footnote">{data?.storage === 'sqlite' ? 'Ambiente local · Os dados são salvos neste computador.' : 'Conexão com banco MySQL.'}</div></div></section></main>;
}
