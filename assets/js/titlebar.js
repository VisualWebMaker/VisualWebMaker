// Script para controlar a barra de título personalizada

document.addEventListener('DOMContentLoaded', () => {
    // Detecta se o sistema operacional é macOS
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // Adiciona classe ao body se for macOS
    if (isMac) {
        document.body.classList.add('is-mac');
    }
    
    // Função para verificar e atualizar o estado maximizado
    const atualizarEstadoMaximizado = async () => {
        if (window.electron && window.electron.janela) {
            try {
                const isMaximizado = await window.electron.janela.isMaximizado();
                console.log('Estado maximizado:', isMaximizado); // Log para depuração
                if (isMaximizado) {
                    document.body.classList.add('is-maximized');
                } else {
                    document.body.classList.remove('is-maximized');
                }
                // Verifica se a classe foi aplicada corretamente
                console.log('Classe is-maximized aplicada:', document.body.classList.contains('is-maximized'));
            } catch (error) {
                console.error('Erro ao verificar estado maximizado:', error);
            }
        }
    };
    
    // Verifica o estado inicial
    atualizarEstadoMaximizado();
    
    // Adiciona listeners para eventos de maximização e restauração da janela
    if (window.electron) {
        window.addEventListener('resize', () => {
            // Atualiza o estado maximizado quando a janela é redimensionada
            setTimeout(atualizarEstadoMaximizado, 50);
        });
        
        // Adiciona listener para eventos de tela cheia (fullscreen)
        if (window.electron.janela.onFullscreenMudou) {
            window.electron.janela.onFullscreenMudou((isFullscreen) => {
                console.log('Estado de tela cheia:', isFullscreen);
                if (isFullscreen) {
                    document.body.classList.add('is-fullscreen');
                } else {
                    document.body.classList.remove('is-fullscreen');
                }
            });
        }
    }
    
    // Referências aos botões da barra de título
    const minimizeButton = document.getElementById('minimize-button');
    const maximizeButton = document.getElementById('maximize-button');
    const closeButton = document.getElementById('close-button');
    const maximizeIcon = maximizeButton.querySelector('i');

    // Verifica se estamos no ambiente Electron
    if (window.electron && window.electron.janela) {
        // Atualiza o ícone do botão maximizar com base no estado atual da janela
        const atualizarIconeMaximizar = async () => {
            try {
                const isMaximizado = await window.electron.janela.isMaximizado();
                maximizeIcon.textContent = isMaximizado ? 'filter_none' : 'crop_square';
            } catch (error) {
                console.error('Erro ao verificar estado da janela:', error);
            }
        };

        // Inicializa o ícone
        atualizarIconeMaximizar();

        // Adiciona os event listeners para os botões
        minimizeButton.addEventListener('click', () => {
            window.electron.janela.minimizar();
        });

        maximizeButton.addEventListener('click', () => {
            window.electron.janela.maximizar();
            // Atualiza o ícone e o estado maximizado após um pequeno delay para garantir que o estado da janela foi alterado
            setTimeout(() => {
                atualizarIconeMaximizar();
                atualizarEstadoMaximizado();
            }, 200); // Aumentado o tempo de espera para garantir que a janela tenha tempo de mudar de estado
        });

        closeButton.addEventListener('click', () => {
            window.electron.janela.fechar();
        });

        // Atualiza o título da janela
        // const atualizarTitulo = async () => {
        //     try {
        //         const titulo = await window.electron.janela.obterTitulo();
        //         document.querySelector('.titlebar-title').textContent = titulo;
        //     } catch (error) {
        //         console.error('Erro ao obter título da janela:', error);
        //     }
        // };

        // atualizarTitulo();
    } else {
        // Se não estamos no Electron, esconde a barra de título
        document.querySelector('.titlebar').style.display = 'none';
        document.body.style.marginTop = '0';
    }
});