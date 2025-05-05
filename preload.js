const { contextBridge, ipcRenderer } = require('electron');

// Expõe funções seguras do Electron para o processo de renderização
contextBridge.exposeInMainWorld('electron', {
  // Funções para gerenciamento de projetos
  projeto: {
    novo: () => ipcRenderer.send('new-project'),
    salvar: (conteudo) => ipcRenderer.send('save-project-to-file', conteudo),
    carregar: (callback) => ipcRenderer.on('load-project', callback)
  },
  // Funções para exportação de HTML
  exportar: {
    html: (conteudo) => ipcRenderer.send('export-html-to-file', conteudo)
  },
  // Funções para preview externo
  preview: {
    abrir: (conteudo) => ipcRenderer.send('open-external-preview', conteudo)
  },
  // Recebe eventos do processo principal
  receber: {
    novoProjeto: (callback) => ipcRenderer.on('new-project', callback),
    salvarProjeto: (callback) => ipcRenderer.on('save-project', callback),
    exportarHTML: (callback) => ipcRenderer.on('export-html', callback)
  }
});