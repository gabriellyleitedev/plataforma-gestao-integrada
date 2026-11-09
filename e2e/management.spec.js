import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';

test('mostramos falha de configuração sem afirmar conexão com o banco', async ({ page }) => {
  await page.route('**/api/status', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' })
  );
  await page.goto('/entrar');
  await expect(page.getByRole('alert')).toContainText('Precisamos configurar a URL da API');
  await expect(page.getByText('Conexão com banco MySQL.', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveCount(0);
});

test('recusamos resposta HTML no endereço da API sem interromper a tela', async ({ page }) => {
  await page.route('**/api/status', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Frontend</html>' })
  );
  await page.goto('/entrar');
  await expect(page.getByRole('alert')).toContainText('Precisamos verificar a URL da API');
  await expect(page.getByText('Conexão com banco MySQL.', { exact: true })).toHaveCount(0);
});

test('cadastros, venda, dashboard e estoque pelo navegador', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const password = randomBytes(16).toString('hex');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Acesse seu espaço' })).toBeVisible();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible();
  await page.getByLabel('Seu nome').fill('Administrador E2E');
  await page.getByLabel('Nome do negócio').fill('Loja E2E');
  await page.getByLabel('E-mail', { exact: true }).fill('browser@example.test');
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirme a senha').fill(password);
  await page.getByRole('button', { name: 'Criar conta e começar' }).click();
  await expect(page.getByRole('heading', { name: /Olá, Administrador/ })).toBeVisible();
  await expect(page.getByText('Loja E2E', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Clientes', exact: true }).click();
  await page.getByRole('button', { name: 'Novo cliente' }).first().click();
  await page.getByLabel('Nome', { exact: true }).fill('Cliente E2E');
  await page.getByLabel('E-mail', { exact: true }).fill('customer@example.test');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('cell', { name: 'Cliente E2E', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Categorias', exact: true }).click();
  await page.getByRole('button', { name: 'Nova categoria' }).first().click();
  await page.getByLabel('Nome', { exact: true }).fill('Categoria E2E');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('cell', { name: 'Categoria E2E', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Produtos e serviços', exact: true }).click();
  await page.getByRole('button', { name: 'Novo item' }).first().click();
  await page.getByLabel('Nome', { exact: true }).fill('Produto E2E');
  await page.getByLabel('Preço de venda (R$)').fill('25');
  await page.getByLabel('Custo (R$)', { exact: true }).fill('10');
  await page.getByLabel('Categoria', { exact: true }).selectOption({ label: 'Categoria E2E' });
  await page.getByLabel('Estoque mínimo').fill('2');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByText('Produto E2E', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Novo item' }).first().click();
  await page.getByLabel('Nome', { exact: true }).fill('Serviço E2E');
  await page.getByLabel('Tipo', { exact: true }).selectOption('service');
  await page.getByLabel('Preço de venda (R$)').fill('50');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByText('Serviço E2E', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Estoque', exact: true }).click();
  await page.getByRole('button', { name: 'Nova movimentação' }).click();
  await page.getByLabel('Produto', { exact: true }).selectOption({ label: 'Produto E2E · Saldo 0' });
  await page.getByLabel('Quantidade', { exact: true }).fill('10');
  await page.getByLabel('Motivo', { exact: true }).fill('Entrada para teste isolado');
  await page.getByRole('button', { name: 'Registrar movimentação' }).click();
  await expect(page.getByText('Movimentação registrada e saldo atualizado.')).toBeVisible();

  await page.getByRole('link', { name: 'Vendas', exact: true }).click();
  await page.getByRole('button', { name: 'Nova venda' }).click();
  await page.getByLabel('Cliente', { exact: true }).selectOption({ label: 'Cliente E2E' });
  await page
    .getByLabel('Produto ou serviço da venda')
    .selectOption(
      await page
        .getByLabel('Produto ou serviço da venda')
        .locator('option')
        .filter({ hasText: 'Produto E2E' })
        .getAttribute('value')
    );
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Quantidade de Produto E2E' }).fill('2');
  await page
    .getByLabel('Produto ou serviço da venda')
    .selectOption(
      await page
        .getByLabel('Produto ou serviço da venda')
        .locator('option')
        .filter({ hasText: 'Serviço E2E' })
        .getAttribute('value')
    );
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar venda' }).click();
  await expect(page.getByRole('dialog')).toContainText('R$ 100,00');
  await page.getByRole('button', { name: 'Fechar', exact: true }).last().click();

  await page.getByRole('link', { name: 'Visão geral', exact: true }).click();
  await expect(page.locator('.stat-card').first()).toContainText('R$ 100,00');
  await page.getByRole('link', { name: 'Estoque', exact: true }).click();
  await expect(page.getByRole('row', { name: /Produto E2E/ })).toContainText('8 un.');
  await page.getByRole('link', { name: 'Vendas', exact: true }).click();
  await page.getByRole('button', { name: 'Ver detalhes' }).click();
  await page.getByRole('button', { name: 'Cancelar venda', exact: true }).click();
  await page.getByLabel('Motivo do cancelamento').fill('Cancelamento do teste isolado');
  await page.getByRole('button', { name: 'Confirmar cancelamento' }).click();
  await expect(page.getByRole('cell', { name: 'Cancelada', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Estoque', exact: true }).click();
  await expect(page.getByRole('row', { name: /Produto E2E/ })).toContainText('10 un.');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('link', { name: 'Relatórios', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Relatórios', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-report.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('link', { name: 'Visão geral', exact: true }).click();
  await expect(page.locator('.stat-card').first()).toContainText('R$ 0,00');
  await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });

  await page.getByRole('link', { name: 'Fornecedores', exact: true }).click();
  await page.getByRole('button', { name: 'Novo fornecedor' }).first().click();
  await page.getByLabel('Nome', { exact: true }).fill('Fornecedor E2E');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('cell', { name: 'Fornecedor E2E', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar Fornecedor E2E', exact: true }).click();
  await page.getByLabel('Telefone').fill('11999990000');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByText('11999990000', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Atendimentos', exact: true }).click();
  await page.getByRole('button', { name: 'Novo atendimento' }).first().click();
  await page.getByLabel('Cliente', { exact: true }).selectOption({ label: 'Cliente E2E' });
  await page.getByLabel('Assunto').fill('Atendimento E2E');
  await page.getByLabel('Data e hora').fill(`${new Date().toISOString().slice(0, 10)}T14:30`);
  await page.getByLabel('Situação', { exact: true }).selectOption('completed');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('row', { name: /Atendimento E2E/ })).toContainText('Concluído');

  await page.getByRole('link', { name: 'Relatórios', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/^vendas-.*\.csv$/);

  await page.getByRole('link', { name: 'Usuários', exact: true }).click();
  await page.getByRole('button', { name: 'Novo usuário' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Operador E2E');
  await page.getByLabel('E-mail', { exact: true }).fill('operator-browser@example.test');
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('cell', { name: 'Operador E2E', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page.getByRole('heading', { name: 'Acesse seu espaço' })).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill('operator-browser@example.test');
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Olá, Operador/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Produtos e serviços', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Novo item' })).toHaveCount(0);
  await expect(page.getByText('Produto E2E', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Produto E2E', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Operador E2E Operador', exact: true }).click();
  const updatedPassword = `Atualizada${randomBytes(12).toString('hex')}`;
  await page.getByLabel('Senha atual', { exact: true }).fill(password);
  await page.getByLabel('Nova senha', { exact: true }).fill(updatedPassword);
  await page.getByLabel('Confirmar senha', { exact: true }).fill(updatedPassword);
  await page.getByRole('button', { name: 'Salvar senha', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Acesse seu espaço' })).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill('operator-browser@example.test');
  await page.getByLabel('Senha', { exact: true }).fill(updatedPassword);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Olá, Operador/ })).toBeVisible();
  expect(errors).toEqual([]);
});
