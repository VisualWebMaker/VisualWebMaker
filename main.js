const { app, BrowserWindow, Menu, dialog, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// Mantenha uma referência global do objeto window para evitar que seja fechado automaticamente
let mainWindow;

function createWindow() {
  // Cria a janela do navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Remove a barra de título padrão
    titleBarStyle: 'hidden', // Oculta a barra de título padrão
    transparent: true, // Habilita a transparência da janela
    backgroundColor: '#1e1e1e00', // Cor de fundo com transparência
    vibrancy: 'under-window', // Adiciona efeito de vibrancy (macOS)
    visualEffectState: 'active', // Estado do efeito visual (macOS)
    webPreferences: {
      nodeIntegration: false, // Por segurança, desabilita a integração Node.js no renderer
      contextIsolation: true, // Isola o contexto do Electron do contexto da página
      preload: path.join(__dirname, 'preload.js') // Carrega o script de preload
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Carrega o arquivo index.html da aplicação
  mainWindow.loadFile('index.html');

  // Abre o DevTools em modo de desenvolvimento
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Evento disparado quando a janela é fechada
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Adiciona listeners para eventos de maximização e restauração
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximization-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximization-changed', false);
  });
  
  // Adiciona listeners para eventos de tela cheia (fullscreen)
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window-fullscreen-changed', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window-fullscreen-changed', false);
  });

  // Cria o menu da aplicação
  createMenu();
}

// Cria o menu da aplicação
function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo Projeto',
          accelerator: 'CmdOrCtrl+N',
          click() { mainWindow.webContents.send('new-project'); }
        },
        {
          label: 'Abrir Projeto',
          accelerator: 'CmdOrCtrl+O',
          click() { openProject(); }
        },
        {
          label: 'Salvar Projeto',
          accelerator: 'CmdOrCtrl+S',
          click() { mainWindow.webContents.send('save-project'); }
        },
        { type: 'separator' },
        {
          label: 'Exportar HTML',
          click() { mainWindow.webContents.send('export-html'); }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4',
          click() { app.quit(); }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'delete', label: 'Excluir' },
        { type: 'separator' },
        { role: 'selectAll', label: 'Selecionar Tudo' }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar Recarga' },
        { role: 'toggleDevTools', label: 'Ferramentas de Desenvolvedor' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click() {
            dialog.showMessageBox(mainWindow, {
              title: 'Sobre Visual Web Maker',
              message: 'Visual Web Maker v1.0.0',
              detail: 'Um editor visual de HTML com interface de arrastar e soltar.',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Documentação',
          click() {
            shell.openExternal('https://github.com/seu-usuario/VisualWebMaker');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Abre um projeto existente
function openProject() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Abrir Projeto',
    filters: [
      { name: 'Arquivos HTML', extensions: ['html'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          dialog.showErrorBox('Erro ao Abrir Projeto', `Não foi possível abrir o arquivo: ${err.message}`);
          return;
        }
        mainWindow.webContents.send('load-project', { filePath, content: data });
      });
    }
  }).catch(err => {
    dialog.showErrorBox('Erro ao Abrir Projeto', `Ocorreu um erro: ${err.message}`);
  });
}

// Variável para armazenar o diretório atual
let currentDirectory = null;

// Abre um diretório para o explorador de arquivos
function openDirectory() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Abrir Diretório',
    properties: ['openDirectory']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const dirPath = result.filePaths[0];
      currentDirectory = dirPath;
      mainWindow.webContents.send('directory-opened', dirPath);
    }
  }).catch(err => {
    dialog.showErrorBox('Erro ao Abrir Diretório', `Ocorreu um erro: ${err.message}`);
  });
}

// Lista os arquivos e diretórios em um caminho específico
async function listDirectory(dirPath) {
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const result = [];
    
    for (const item of items) {
      const isDirectory = item.isDirectory();
      const itemPath = path.join(dirPath, item.name);
      
      result.push({
        name: item.name,
        path: itemPath,
        isDirectory: isDirectory
      });
    }
    
    return result;
  } catch (err) {
    console.error('Erro ao listar diretório:', err);
    return [];
  }
}

// Lê o conteúdo de um arquivo
async function openFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (err) {
    console.error('Erro ao abrir arquivo:', err);
    return null;
  }
}

// Evento disparado quando o Electron termina a inicialização
app.whenReady().then(createWindow);

// Evento disparado quando todas as janelas são fechadas
app.on('window-all-closed', function () {
  // No macOS é comum para aplicativos permanecerem ativos até que o usuário saia explicitamente
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // No macOS é comum recriar uma janela quando o ícone do dock é clicado e não há outras janelas abertas
  if (mainWindow === null) createWindow();
});

// Eventos para controle da janela personalizada
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      // Emite evento informando que a janela não está mais maximizada
      mainWindow.webContents.send('window-maximization-changed', false);
    } else {
      mainWindow.maximize();
      // Emite evento informando que a janela está maximizada
      mainWindow.webContents.send('window-maximization-changed', true);
    }
  }
});



ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// Handlers para métodos invoke
ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('get-window-title', () => {
  return 'Visual Web Maker';
});

// Manipuladores para o explorador de arquivos
ipcMain.on('open-directory', () => {
  openDirectory();
});

ipcMain.handle('list-directory', async (event, dirPath) => {
  return await listDirectory(dirPath);
});

ipcMain.handle('get-current-directory', () => {
  return currentDirectory;
});

ipcMain.handle('open-file', async (event, filePath) => {
  return await openFile(filePath);
});

// Configuração dos eventos IPC para comunicação entre processos
ipcMain.on('save-project-to-file', (event, content) => {
  dialog.showSaveDialog(mainWindow, {
    title: 'Salvar Projeto',
    filters: [{ name: 'Arquivos HTML', extensions: ['html'] }],
    defaultPath: path.join(app.getPath('documents'), 'projeto.html')
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFile(result.filePath, content, err => {
        if (err) {
          dialog.showErrorBox('Erro ao salvar', 'Não foi possível salvar o arquivo.');
          return;
        }
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Sucesso',
          message: 'Projeto salvo com sucesso!',
          buttons: ['OK']
        });
      });
    }
  }).catch(err => {
    dialog.showErrorBox('Erro', 'Ocorreu um erro ao tentar salvar o arquivo.');
  });
});

ipcMain.on('export-html-to-file', (event, content) => {
  dialog.showSaveDialog(mainWindow, {
    title: 'Exportar HTML',
    filters: [{ name: 'Arquivos HTML', extensions: ['html'] }],
    defaultPath: path.join(app.getPath('documents'), 'pagina.html')
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFile(result.filePath, content, err => {
        if (err) {
          dialog.showErrorBox('Erro ao exportar', 'Não foi possível exportar o arquivo HTML.');
          return;
        }
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Sucesso',
          message: 'HTML exportado com sucesso!',
          buttons: ['OK']
        });
      });
    }
  }).catch(err => {
    dialog.showErrorBox('Erro', 'Ocorreu um erro ao tentar exportar o arquivo HTML.');
  });
});

// Abre uma janela de preview externa
ipcMain.on('open-external-preview', (event, content) => {
  const previewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Cria um arquivo temporário para o preview
  const tempPath = path.join(app.getPath('temp'), 'preview.html');
  fs.writeFileSync(tempPath, content);
  
  previewWindow.loadFile(tempPath);
  previewWindow.setTitle('Preview - Visual Web Maker');
});