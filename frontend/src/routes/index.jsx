import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { ResourcePage } from '../pages/ResourcePage.jsx';
import { StockPage } from '../pages/StockPage.jsx';
import { SalesPage } from '../pages/SalesPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export const router = createBrowserRouter([
  { path: '/entrar', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clientes', element: <ResourcePage key="clients" resource="clients" /> },
      { path: 'catalogo', element: <ResourcePage key="items" resource="items" /> },
      { path: 'categorias', element: <ResourcePage key="categories" resource="categories" /> },
      { path: 'fornecedores', element: <ResourcePage key="suppliers" resource="suppliers" /> },
      { path: 'atendimentos', element: <ResourcePage key="appointments" resource="appointments" /> },
      { path: 'usuarios', element: <ResourcePage key="users" resource="users" /> },
      { path: 'estoque', element: <StockPage /> },
      { path: 'vendas', element: <SalesPage /> },
      { path: 'relatorios', element: <DashboardPage key="reports" reports /> }
    ]
  },
  { path: '*', element: <NotFoundPage /> }
]);
