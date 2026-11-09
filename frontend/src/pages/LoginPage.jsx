import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useData } from '../hooks/useData.js';
import { api } from '../services/api.js';
import { Field, Message, Loading, Icon } from '../components/ui.jsx';

export function LoginPage() {
  const { user, signIn } = useAuth();
  const { data, error, loading, reload } = useData('/status');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  if (user) return <Navigate to="/" replace />;
  function switchMode() {
    setCreating(!creating);
    setFailure('');
  }
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (creating && values.password !== values.confirmation) {
      setFailure('As senhas precisam ser iguais.');
      return;
    }
    setBusy(true);
    setFailure('');
    try {
      if (creating) await api('/auth/register', { method: 'POST', body: values });
      await signIn(values.email, values.password);
    } catch (error) {
      setFailure(error.message || 'Não foi possível conectar à API.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-symbol">
            <Icon name="grid" size={23} />
          </span>
          Integra<span className="brand-dot">.</span>
        </div>
        <div>
          <p className="eyebrow">SEU NEGÓCIO, EM SINTONIA</p>
          <h1>
            Menos planilhas.
            <br />
            Mais gestão.
          </h1>
          <p>
            Clientes, produtos, serviços e vendas em um só lugar. Mais clareza para cuidar do que faz o seu
            negócio crescer.
          </p>
          <div className="story-grid">
            <span>
              <Icon name="users" />
              Relacionamentos
            </span>
            <span>
              <Icon name="box" />
              Estoque organizado
            </span>
            <span>
              <Icon name="chart" />
              Decisões com dados
            </span>
          </div>
        </div>
        <small>Plataforma Web de Gestão Integrada · Projeto acadêmico</small>
      </section>
      <section className="login-panel">
        <div className="login-form">
          <p className="eyebrow">BEM-VINDO À INTEGRA</p>
          <h2>
            {error ? 'Precisamos conectar o sistema' : creating ? 'Crie sua conta' : 'Acesse seu espaço'}
          </h2>
          <p>
            {error
              ? 'Ainda não conseguimos acessar o serviço de autenticação.'
              : creating
                ? 'Cadastre seu negócio e comece a usar agora.'
                : 'Entre com o e-mail e a senha cadastrados.'}
          </p>
          {loading ? (
            <Loading />
          ) : error ? (
            <>
              <Message>{error}</Message>
              <button className="button secondary" onClick={reload}>
                Tentar novamente
              </button>
            </>
          ) : (
            <form onSubmit={submit} key={creating ? 'register' : 'login'}>
              {creating && (
                <>
                  <Field label="Seu nome">
                    <input name="name" required maxLength={160} autoComplete="name" />
                  </Field>
                  <Field label="Nome do negócio">
                    <input name="company" required maxLength={160} autoComplete="organization" />
                  </Field>
                </>
              )}
              <Field label="E-mail">
                <input name="email" type="email" required maxLength={190} autoComplete="username" />
              </Field>
              <Field label="Senha" hint={creating ? 'Use entre 10 e 128 caracteres.' : undefined}>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={creating ? 10 : 1}
                  maxLength={128}
                  autoComplete={creating ? 'new-password' : 'current-password'}
                />
              </Field>
              {creating && (
                <Field label="Confirme a senha">
                  <input
                    name="confirmation"
                    type="password"
                    required
                    minLength={10}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                </Field>
              )}
              <Message>{failure}</Message>
              <button className="button primary full" disabled={busy}>
                {busy ? 'Aguarde…' : creating ? 'Criar conta e começar' : 'Entrar'}
                <Icon name="arrow" />
              </button>
              <p className="login-switch">
                {creating ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                <button type="button" className="text-button" onClick={switchMode}>
                  {creating ? 'Entrar' : 'Criar conta'}
                </button>
              </p>
            </form>
          )}
          <div className="login-footnote">
            {data?.storage === 'sqlite'
              ? 'Ambiente local · Os dados são salvos neste computador.'
              : data?.storage === 'mysql'
                ? 'Conexão com banco MySQL.'
                : 'Aguardamos a conexão com o serviço.'}
          </div>
        </div>
      </section>
    </main>
  );
}
