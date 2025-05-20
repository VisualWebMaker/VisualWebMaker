// Script para controlar a barra de título personalizada

document.addEventListener('DOMContentLoaded', async () => {
    // Detecta se o sistema operacional é macOS
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // Adiciona classe ao body se for macOS
    if (isMac) {
        document.body.classList.add('is-mac');
    }
    
    // Botões da barra de título
    const minimizeButton = document.getElementById('minimize-button');
    const maximizeButton = document.getElementById('maximize-button');
    const closeButton = document.getElementById('close-button');
    const maximizeIcon = maximizeButton.querySelector('i');

    // Verifica se estamos no ambiente Electron
    if (window.electron && window.electron.janela) {
        // Verifica o estado inicial de maximização
        const isMaximized = await window.electron.janela.isMaximizado();
        updateMaximizeButton(isMaximized);
        
        if (isMaximized) {
            document.body.classList.add('is-maximized');
        } else {
            document.body.classList.remove('is-maximized');
        }

        // Adiciona os event listeners para os botões da barra de título
        minimizeButton.addEventListener('click', () => {
            window.electron.janela.minimizar();
        });

        maximizeButton.addEventListener('click', () => {
            window.electron.janela.maximizar();
        });

        closeButton.addEventListener('click', () => {
            window.electron.janela.fechar();
        });

        // Atualiza o ícone do botão de maximizar com base no estado da janela
        function updateMaximizeButton(isMaximized) {
            if (isMaximized) {
                maximizeIcon.textContent = 'filter_none'; // Ícone para restaurar
            } else {
                maximizeIcon.textContent = 'crop_square'; // Ícone para maximizar
            }
        }

        // Adiciona listeners para eventos de maximização e restauração da janela
        window.addEventListener('resize', () => {
            // Atualiza o estado maximizado quando a janela é redimensionada
            setTimeout(async () => {
                const isMaximizado = await window.electron.janela.isMaximizado();
                updateMaximizeButton(isMaximizado);
                if (isMaximizado) {
                    document.body.classList.add('is-maximized');
                } else {
                    document.body.classList.remove('is-maximized');
                }
            }, 50);
        });
        
        // Registra o callback para mudanças no estado de tela cheia
        if (window.electron.janela.onFullscreenMudou) {
            window.electron.janela.onFullscreenMudou((isFullscreen) => {
                document.body.classList.toggle('is-fullscreen', isFullscreen);
            });
        }

        // Obtém e define o título da janela
        // const titleElement = document.querySelector('.titlebar-title');
        // if (titleElement) {
        //     try {
        //         const title = await window.electron.janela.obterTitulo();
        //         if (title) {
        //             const titleSpan = document.createElement('span');
        //             titleSpan.textContent = title;
        //             titleElement.appendChild(titleSpan);
        //         }
        //     } catch (error) {
        //         console.error('Erro ao obter título da janela:', error);
        //     }
        // }
    } else {
        // Se não estamos no Electron, esconde a barra de título
        document.querySelector('.titlebar').style.display = 'none';
        document.body.style.marginTop = '0';
    }
});

// Previne erros de referência indefinida
window.dragEvent = null;