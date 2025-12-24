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
                    block: 'start'
                });
            }
        });
    });
}

// ===== ЗАГРУЗКА MARKDOWN =====
function initMarkdownLoader() {
    // Загружаем Markdown файлы при клике на ссылки
    document.addEventListener('click', function(e) {
        // Ищем клик по ссылке, которая ведёт на .md файл
        if (e.target.matches('a[href$=".md"]') || 
            e.target.closest('a[href$=".md"]')) {
            e.preventDefault();
            
            const link = e.target.matches('a') ? e.target : e.target.closest('a');
            const mdFile = link.getAttribute('href');
            
            loadMarkdownFile(mdFile);
        }
    });
    
    // Автоматически загружаем первый .md файл на странице
    const firstMdLink = document.querySelector('a[href$=".md"]');
    if (firstMdLink && window.location.pathname.includes('/rules/')) {
        setTimeout(() => {
            loadMarkdownFile(firstMdLink.getAttribute('href'));
        }, 100);
    }
}

async function loadMarkdownFile(mdFile) {
    try {
        const container = document.getElementById('markdown-content');
        if (!container) return;
        
        // Показываем загрузчик
        container.innerHTML = '<div class="loader"></div>';
        
        // Загружаем файл
        const response = await fetch(mdFile);
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        const markdownText = await response.text();
        
        // Конвертируем Markdown в HTML
        const html = convertMarkdownToHtml(markdownText);
        
        // Вставляем в контейнер
        container.innerHTML = html;
        
        // Обновляем обработчики для новых изображений
        initImageZoom();
        
        // Прокручиваем к началу контента
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        showNotification('Контент загружен', 'success');
        
    } catch (error) {
        console.error('Ошибка загрузки Markdown:', error);
        
        const container = document.getElementById('markdown-content');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="back-button">
                        <i class="fas fa-redo"></i> Обновить страницу
                    </button>
                </div>
            `;
        }
        
        showNotification('Ошибка загрузки контента', 'error');
    }
}

function convertMarkdownToHtml(markdown) {
    // Простой конвертер Markdown в HTML
    return markdown
        // Заголовки
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        
        // Жирный текст
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Курсив
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        // Списки
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        
        // Ссылки
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        
        // Изображения
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
        
        // Таблицы (простая поддержка)
        .replace(/^\| (.*?) \|$/gm, function(match) {
            const cells = match.split('|').filter(cell => cell.trim());
            if (cells.length === 0) return '';
            
            // Если это заголовок таблицы (первая строка после заголовка столбцов)
            if (match.includes('---')) {
                return '</tr><tr>';
            }
            
            const row = cells.map(cell => `<td>${cell.trim()}</td>`).join('');
            return `<tr>${row}</tr>`;
        })
        .replace(/(<tr>.*<\/tr>)/s, function(match) {
            return `<table>${match}</table>`;
        })
        
        // Блоки кода
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        
        // Встроенный код
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        
        // Цитаты
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        
        // Горизонтальные линии
        .replace(/^---$/gm, '<hr>')
        
        // Параграфы
        .replace(/\n\n/g, '</p><p>')
        .replace(/^\s*(.+)$/gm, '<p>$1</p>')
        
        // Убираем лишние теги параграфов внутри списков и таблиц
        .replace(/<p><li>/g, '<li>')
        .replace(/<\/li><\/p>/g, '</li>')
        .replace(/<p><tr>/g, '<tr>')
        .replace(/<\/tr><\/p>/g, '</tr>')
        
        // Восстанавливаем нормальные переносы строк
        .replace(/<p><\/p>/g, '')
        .replace(/<\/p><p>/g, '');
}

// ===== ОПТИМИЗАЦИИ ДЛЯ МОБИЛЬНЫХ =====
function initMobileOptimizations() {
    // Предотвращаем масштабирование при двойном тапе
    let lastTouchEnd = 0;
    
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Улучшаем отзывчивость на тач-устройствах
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // Добавляем активные состояния для кнопок
        document.querySelectorAll('a, button').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('active-touch');
            });
            
            element.addEventListener('touchend', function() {
                this.classList.remove('active-touch');
            });
        });
    }
    
    // Исправляем высоту 100vh на мобильных
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.addEventListener('resize', setVH);
}

// ===== ZOOM ИЗОБРАЖЕНИЙ =====
function initImageZoom() {
    document.querySelectorAll('.markdown-content img').forEach(img => {
        // Пропускаем маленькие иконки
        if (img.width < 50 || img.height < 50) return;
        
        img.style.cursor = 'zoom-in';
        
        img.addEventListener('click', function() {
            const overlay = document.createElement('div');
            overlay.className = 'image-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                cursor: zoom-out;
                animation: fadeIn 0.3s ease;
            `;
            
            const zoomedImg = document.createElement('img');
            zoomedImg.src = this.src;
            zoomedImg.alt = this.alt;
            zoomedImg.style.cssText = `
                max-width: 90vw;
                max-height: 90vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            `;
            
            overlay.appendChild(zoomedImg);
            document.body.appendChild(overlay);
            
            // Закрытие по клику или ESC
            function closeOverlay() {
                overlay.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300);
            }
            
            overlay.addEventListener('click', closeOverlay);
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') closeOverlay();
            });
        });
    });
}

// ===== УВЕДОМЛЕНИЯ =====
function initNotifications() {
    window.showNotification = function(message, type = 'info') {
        // Удаляем старые уведомления
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    };
    
    function getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
}

// ===== ПОЛИФИЛЛЫ ДЛЯ СТАРЫХ БРАУЗЕРОВ =====
// Поддержка forEach в NodeList для старых браузеров
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// Поддержка matches для старых браузеров
if (!Element.prototype.matches) {
    Element.prototype.matches = 
        Element.prototype.matchesSelector || 
        Element.prototype.webkitMatchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector;
}

// Поддержка closest для старых браузеров
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ ОТЛАДКИ =====
window.siteDebug = {
    reloadMarkdown: function() {
        const currentMd = document.querySelector('a[href$=".md"]');
        if (currentMd) {
            loadMarkdownFile(currentMd.getAttribute('href'));
        }
    },
    
    showPageInfo: function() {
        console.log('Текущая страница:', window.location.href);
        console.log('Контейнер Markdown:', document.getElementById('markdown-content'));
        console.log('Ссылки на .md файлы:', document.querySelectorAll('a[href$=".md"]').length);
    }
};
