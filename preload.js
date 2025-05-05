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
  },
  // Funções para controle da janela (barra de título personalizada)
  janela: {
    minimizar: () => ipcRenderer.send('window-minimize'),
    maximizar: () => ipcRenderer.send('window-maximize'),
    fechar: () => ipcRenderer.send('window-close'),
    isMaximizado: () => ipcRenderer.invoke('window-is-maximized'),
    obterTitulo: () => ipcRenderer.invoke('get-window-title')
  }
});