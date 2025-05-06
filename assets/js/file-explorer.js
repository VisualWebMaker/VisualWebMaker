// Módulo para o explorador de arquivos
document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const fileTree = document.getElementById('file-tree');
    const openDirectoryButton = document.getElementById('open-directory-button');
    
    // Variáveis de estado
    let currentDirectory = null;
    
    // Inicialização
    init();
    
    // Função de inicialização
    function init() {
        // Verifica se estamos no ambiente Electron
        if (window.electron) {
            // Configura os listeners de eventos
            setupEventListeners();
            
            // Tenta obter o diretório atual (se houver)
            window.electron.arquivos.obterDiretorioAtual()
                .then(dir => {
                    if (dir) {
                        currentDirectory = dir;
                        renderFileTree(dir);
                    }
                });
        } else {
            console.warn('Explorador de arquivos disponível apenas no ambiente Electron');
        }
    }
    
    // Configura os listeners de eventos
    function setupEventListeners() {
        // Botão para abrir diretório
        if (openDirectoryButton) {
            openDirectoryButton.addEventListener('click', () => {
                window.electron.arquivos.abrirDiretorio();
            });
        }
        
        // Evento quando um diretório é aberto
        window.electron.receberArquivos.diretorioAberto((event, dirPath) => {
            currentDirectory = dirPath;
            renderFileTree(dirPath);
        });
    }
    
    // Função para obter o ícone com base na extensão do arquivo
    function getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        // Mapeia extensões para ícones
        switch (extension) {
            case 'html':
            case 'htm':
                return 'assets/icons/explorer/html.png';
            case 'php':
                return 'assets/icons/explorer/php.png';
            case 'css':
                return 'assets/icons/explorer/css.png';
            case 'js':
                return 'assets/icons/explorer/js.png';
            case 'svg':
                return 'assets/icons/explorer/svg.png';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
                return 'assets/icons/explorer/img.png';
            default:
                return 'assets/icons/explorer/file.png';
        }
    }

    // Renderiza a árvore de arquivos
    async function renderFileTree(dirPath) {
        if (!dirPath) return;
        
        try {
            // Limpa a árvore atual
            fileTree.innerHTML = '';
            
            // Obtém a lista de arquivos e diretórios
            const items = await window.electron.arquivos.listarDiretorio(dirPath);
            
            // Ordena: primeiro diretórios, depois arquivos (em ordem alfabética)
            items.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });
            
            // Cria os elementos da árvore
            for (const item of items) {
                const li = document.createElement('li');
                
                // Cria o elemento de ícone
                const iconImg = document.createElement('img');
                iconImg.classList.add('file-icon');
                
                // Adiciona o ícone apropriado
                if (item.isDirectory) {
                    iconImg.src = 'assets/icons/explorer/folder.png';
                    li.classList.add('directory');
                    li.addEventListener('click', toggleDirectory);
                } else {
                    iconImg.src = getFileIcon(item.name);
                    li.classList.add('file');
                    li.addEventListener('click', openFile);
                }
                
                // Adiciona o ícone e o texto
                li.appendChild(iconImg);
                
                const textSpan = document.createElement('span');
                textSpan.textContent = item.name;
                li.appendChild(textSpan);
                
                li.dataset.path = item.path;
                fileTree.appendChild(li);
            }
        } catch (error) {
            console.error('Erro ao renderizar árvore de arquivos:', error);
        }
    }
    
    // Abre/fecha um diretório na árvore
    async function toggleDirectory(event) {
        event.stopPropagation();
        
        const li = event.currentTarget;
        const dirPath = li.dataset.path;
        
        // Se já está expandido, recolhe
        if (li.classList.contains('expanded')) {
            li.classList.remove('expanded');
            // Remove os filhos (subdiretórios e arquivos)
            const ul = li.querySelector('ul');
            if (ul) li.removeChild(ul);
            return;
        }
        
        // Expande o diretório
        try {
            const items = await window.electron.arquivos.listarDiretorio(dirPath);
            
            // Ordena: primeiro diretórios, depois arquivos
            items.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });
            
            // Cria a lista de subdiretórios e arquivos
            const ul = document.createElement('ul');
            
            for (const item of items) {
                const childLi = document.createElement('li');
                childLi.dataset.path = item.path;
                
                // Cria o elemento de ícone
                const iconImg = document.createElement('img');
                iconImg.classList.add('file-icon');
                
                // Adiciona o ícone apropriado
                if (item.isDirectory) {
                    iconImg.src = 'assets/icons/explorer/folder.png';
                    childLi.classList.add('directory');
                    childLi.addEventListener('click', toggleDirectory);
                } else {
                    iconImg.src = getFileIcon(item.name);
                    childLi.classList.add('file');
                    childLi.addEventListener('click', openFile);
                }
                
                // Adiciona o ícone e o texto
                childLi.appendChild(iconImg);
                
                const textSpan = document.createElement('span');
                textSpan.textContent = item.name;
                childLi.appendChild(textSpan);
                
                ul.appendChild(childLi);
            }
            
            li.appendChild(ul);
            li.classList.add('expanded');
        } catch (error) {
            console.error('Erro ao expandir diretório:', error);
        }
    }
    
    // Abre um arquivo
    async function openFile(event) {
        event.stopPropagation();
        
        const li = event.currentTarget;
        const filePath = li.dataset.path;
        
        try {
            // Obtém o conteúdo do arquivo
            const content = await window.electron.arquivos.abrirArquivo(filePath);
            
            // Aqui você pode implementar a lógica para abrir o arquivo no editor
            // Por enquanto, apenas mostra uma mensagem no console
            console.log(`Arquivo aberto: ${filePath}`);
            console.log('Conteúdo:', content);
            
            // Destaca o arquivo selecionado
            const selectedFiles = fileTree.querySelectorAll('.selected');
            selectedFiles.forEach(el => el.classList.remove('selected'));
            li.classList.add('selected');
        } catch (error) {
            console.error('Erro ao abrir arquivo:', error);
        }
    }
});