# VisualWebMaker

<div align="center">

![License](https://img.shields.io/badge/License-GPL--3.0-blue.svg)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

**A visual tool for creating websites with drag and drop interface**

</div>

## 📁 Project Structure

```
VisualWebMaker/
├── assets/            # Static resources (images, icons, fonts)
├── src/               # Application source code
│   ├── main/          # Electron main process
│   ├── preload/       # Electron preload scripts
│   └── renderer/      # User interface (HTML, CSS, JS)
├── tests/             # Automated tests
├── package.json       # Project settings
└── README.md          # Documentation
```

## 📋 About the Project

VisualWebMaker is an open source tool that allows you to create web pages visually through an intuitive drag and drop interface. Designed to facilitate web development for both beginners and experienced developers, eliminating the need to write HTML code manually.

## ✨ Features

- **Drag and Drop Interface**: Create HTML elements easily by dragging components to the preview area
- **Real-Time Visualization**: See changes immediately as you build your page
- **DOM Tree**: Navigate through the document structure via a tree view
- **Property Editing**: Easily configure attributes, styles, and content of elements
- **Code Export**: Copy or download the generated HTML code to use in your projects
- **External Preview**: View your creation in a new window to test at full size
- **Desktop Application**: Use as a cross-platform desktop application thanks to Electron

## 🚀 How to Use

### As a Desktop Application (Electron)

#### Requirements

- [Node.js](https://nodejs.org/) (version 14 or higher)
- npm or yarn

#### Installation and Execution

1. Clone the repository:
   ```bash
   git clone https://github.com/VisualWebMaker/VisualWebMaker.git
   ```

2. Navigate to the project folder:
   ```bash
   cd VisualWebMaker
   ```

3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

4. Run the application:
   ```bash
   npm start
   # or
   yarn start
   ```

5. For development with hot-reload:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### As a Web Application

#### Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Local web server (such as Apache, Nginx) or Live Server extension for VS Code

#### Installation

1. Clone the repository as instructed above
2. Open the `index.html` file in your local web server or use an extension like Live Server in VS Code.

### Basic Usage

1. Drag elements from the left sidebar to the preview area
2. Select an element to edit its properties in the right panel
3. View the DOM structure in the tree located at the bottom of the left sidebar
4. Export the HTML code when you finish your design

## 🔧 Building the Application

To create distributable versions of the application:

```bash
# For all platforms
npm run build

# Specific for Windows
npm run build:win

# Specific for macOS
npm run build:mac

# Specific for Linux
npm run build:linux
```

The generated files will be available in the `dist` folder.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GPL-3.0 license - see the [LICENSE](LICENSE) file for details.

## 📊 Roadmap

- [ ] Support for pre-defined templates
- [ ] Integration with popular CSS frameworks
- [ ] Support for custom components
- [ ] Action history (undo/redo)
- [ ] Cloud project saving
- [ ] Real-time collaborative mode