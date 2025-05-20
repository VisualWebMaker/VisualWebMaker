function toggleCollapse(element) {
    const sidebarTitle = element.closest('sidebar-title');
    if (sidebarTitle) {
        const parentSection = sidebarTitle.parentElement;
        if (parentSection) {
            parentSection.classList.toggle('collapsed');
        }
    }
}
  
// Adiciona um event listener a todos os elementos sidebar-title para chamar a função
document.addEventListener('click', function(event) {
    if (event.target.closest('sidebar-title')) {
        toggleCollapse(event.target);
    }
});