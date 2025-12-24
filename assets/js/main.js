// Главный скрипт для всего сайта
document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт "Викинги" загружен');
    
    // Инициализация основных функций
    initNavigation();
    initMarkdownLoader();
    initMobileOptimizations();
    initImageZoom();
    initNotifications();
});

// ===== НАВИГАЦИЯ =====
function initNavigation() {
    // Подсветка активной страницы в навигации
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPath.includes(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        }
    });
    
    // Плавная прокрутка для якорных ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start
