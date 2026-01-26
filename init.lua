local path_to_lazy = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(path_to_lazy) then
  vim.fn.system({ "git", "clone", "--filter=blob:none", "https://github.com/folke/lazy.nvim.git", "--branch=stable", path_to_lazy })
end
vim.opt.rtp:prepend(path_to_lazy)

local my_plugins = {
  { "neovim/nvim-lspconfig" },
  { "williamboman/mason.nvim", opts = {} },
  { "williamboman/mason-lspconfig.nvim" },
  { "nvimtools/none-ls.nvim", dependencies = { "nvim-lua/plenary.nvim" } },
  { "hrsh7th/nvim-cmp", dependencies = { "hrsh7th/cmp-nvim-lsp", "L3MON4D3/LuaSnip" } },
  { "nvim-treesitter/nvim-treesitter", build = ":TSUpdate" },
}

require("lazy").setup(my_plugins)

local cmp = require('cmp')
cmp.setup({
  snippet = { expand = function(x) require('luasnip').lsp_expand(x.body) end },
  mapping = cmp.mapping.preset.insert({
    ['<C-Space>'] = cmp.mapping.complete(),
    ['<CR>'] = cmp.confirm({ select = true }),
  }),
  sources = { { name = 'nvim-lsp' } }
})

local function my_on_attach(client, bufnr)
  local function bind(mode, lhs, rhs)
    vim.keymap.set(mode, lhs, rhs, { buffer = bufnr, silent = true })
  end

  bind("n", "gd", vim.lsp.buf.definition)
  bind("n", "K",  vim.lsp.buf.hover)
  bind("n", "<leader>ca", vim.lsp.buf.code_action)
  bind("n", "<leader>rn", vim.lsp.buf.rename)
  
  if client.supports_method("textDocument/formatting") then
    vim.api.nvim_create_autocmd("BufWritePre", {
      group = vim.api.nvim_create_augroup("LspFormat." .. bufnr, { clear = true }),
      buffer = bufnr,
      callback = function() vim.lsp.buf.format({ bufnr = bufnr }) end,
    })
  end
end

require('mason-lspconfig').setup({ ensure_installed = { "ts_ls", "eslint" } })
local lsp = require('lspconfig')
local default_caps = require('cmp_nvim_lsp').default_capabilities()
lsp.ts_ls.setup({ 
  on_attach = my_on_attach, 
  capabilities = default_caps 
})

local nls = require("null-ls")
nls.setup({
  on_attach = my_on_attach,
  sources = {
    nls.builtins.diagnostics.eslint,
    nls.builtins.formatting.prettier,
  },
})
