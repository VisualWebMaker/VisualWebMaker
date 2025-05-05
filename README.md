# VisualWebMaker

<div align="center">

![Licença](https://img.shields.io/badge/Licença-GPL--3.0-blue.svg)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)

**Uma ferramenta visual para criação de websites com interface de arrastar e soltar**

</div>

## 📋 Sobre o Projeto

O VisualWebMaker é uma ferramenta open source que permite criar páginas web de forma visual através de uma interface intuitiva de arrastar e soltar. Projetado para facilitar o desenvolvimento web tanto para iniciantes quanto para desenvolvedores experientes, eliminando a necessidade de escrever código HTML manualmente.

## ✨ Funcionalidades

- **Interface de Arrastar e Soltar**: Crie elementos HTML facilmente arrastando componentes para a área de preview
- **Visualização em Tempo Real**: Veja as alterações imediatamente enquanto constrói sua página
- **Árvore DOM**: Navegue pela estrutura do documento através de uma visualização em árvore
- **Edição de Propriedades**: Configure facilmente atributos, estilos e conteúdo dos elementos
- **Exportação de Código**: Copie ou baixe o código HTML gerado para usar em seus projetos
- **Preview Externo**: Visualize sua criação em uma nova janela para testar em tamanho real
- **Aplicativo Desktop**: Utilize como aplicativo desktop multiplataforma graças ao Electron

## 🚀 Como Usar

### Como Aplicativo Desktop (Electron)

#### Requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- npm ou yarn

#### Instalação e Execução

1. Clone o repositório:
   ```bash
   git clone https://github.com/VisualWebMaker/VisualWebMaker.git
   ```

2. Navegue até a pasta do projeto:
   ```bash
   cd VisualWebMaker
   ```

3. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

4. Execute o aplicativo:
   ```bash
   npm start
   # ou
   yarn start
   ```

5. Para desenvolvimento com hot-reload:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

### Como Aplicação Web

#### Requisitos

- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Servidor web local (como Apache, Nginx) ou extensão Live Server para VS Code

#### Instalação

1. Clone o repositório conforme instruções acima
2. Abra o arquivo `index.html` em seu servidor web local ou utilize uma extensão como Live Server no VS Code.

### Uso Básico

1. Arraste elementos da barra lateral esquerda para a área de preview
2. Selecione um elemento para editar suas propriedades no painel direito
3. Visualize a estrutura DOM na árvore localizada na parte inferior da barra lateral esquerda
4. Exporte o código HTML quando finalizar seu design

## 🔧 Construindo o Aplicativo

Para criar versões distribuíveis do aplicativo:

```bash
# Para todas as plataformas
npm run build

# Específico para Windows
npm run build:win

# Específico para macOS
npm run build:mac

# Específico para Linux
npm run build:linux
```

Os arquivos gerados estarão disponíveis na pasta `dist`.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença GPL-3.0 - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📊 Roadmap

- [ ] Suporte a templates pré-definidos
- [ ] Integração com frameworks CSS populares
- [ ] Suporte a componentes personalizados
- [ ] Histórico de ações (desfazer/refazer)
- [ ] Salvamento de projetos na nuvem
- [ ] Modo colaborativo em tempo real