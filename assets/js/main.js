// Главный скрипт для сайта "Викинги"
document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт "Викинги" загружен');
    
    // Инициализация основных функций
    initNavigation();
    initImageZoom();
    initMobileSupport();
});

// ===== НАВИГАЦИЯ =====
function initNavigation() {
    // Подсветка активной страницы
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href) && href !== 'index.html') {
            link.classList.add('active');
        }
    });
}

// ===== ЗАГРУЗКА MARKDOWN ФАЙЛОВ =====
async function loadMarkdownFile(mdFile) {
    try {
        const container = document.getElementById('markdown-content');
        if (!container) {
            console.error('Контейнер для Markdown не найден');
            return;
        }
        
        // Показываем загрузку
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Загрузка контента...</p>
            </div>
        `;
        
        // Загружаем файл
        const response = await fetch(mdFile);
        
        if (!response.ok) {
            throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
        
        const markdown = await response.text();
        
        // Конвертируем Markdown в HTML
        const html = parseMarkdown(markdown);
        
        // Вставляем HTML в контейнер
        container.innerHTML = html;
        
        // Инициализируем zoom для новых изображений
        initImageZoom();
        
        // Прокручиваем к началу контента
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        console.log(`Markdown файл "${mdFile}" успешно загружен`);
        
    } catch (error) {
        console.error('Ошибка загрузки Markdown:', error);
        
        const container = document.getElementById('markdown-content');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки</h3>
                    <p>Не удалось загрузить контент.</p>
                    <p><small>${error.message}</small></p>
                    <button onclick="location.reload()" class="back-button">
                        <i class="fas fa-redo"></i> Обновить страницу
                    </button>
                </div>
            `;
        }
    }
}

// ===== ПАРСЕР MARKDOWN =====
function parseMarkdown(markdown) {
    // Базовый парсер Markdown
    return markdown
        // Заголовки
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
        
        // Жирный текст
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        
        // Курсив
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        
        // Зачёркнутый текст
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        
        // Списки
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^\+ (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        
        // Нумерованные списки
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, function(match) {
            if (match.includes('<ul>')) return match;
            return '<ol>' + match + '</ol>';
        })
        
        // Ссылки
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        
        // Изображения
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image">')
        
        // Код
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        
        // Цитаты
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        
        // Горизонтальная линия
        .replace(/^---$/gm, '<hr>')
        .replace(/^___$/gm, '<hr>')
        .replace(/^\*\*\*$/gm, '<hr>')
        
        // Таблицы (простая поддержка)
        .replace(/^\|(.+)\|$/gm, function(match, row) {
            const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
            if (cells.length === 0) return '';
            
            // Если строка содержит только ---, это разделитель заголовка
            if (cells.every(cell => /^[-:]+$/.test(cell))) {
                return '';
            }
            
            const rowHtml = cells.map(cell => `<td>${cell}</td>`).join('');
            return `<tr>${rowHtml}</tr>`;
        })
        .replace(/(<tr>[\s\S]*?<\/tr>)/gs, function(match) {
            if (match.includes('<table>')) return match;
            return `<table>${match}</table>`;
        })
        
        // Переносы строк
        .replace(/\n\n/g, '</p><p>')
        .replace(/([^\n])\n([^\n])/g, '$1<br>$2')
        
        // Обрамляем в параграфы
        .replace(/^(?!<[a-z]).*$/gm, '<p>$&</p>')
        
        // Убираем лишние параграфы внутри других элементов
        .replace(/<p><(h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th)>/g, '<$1>')
        .replace(/<\/(h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th)><\/p>/g, '</$1>')
        
        // Очищаем пустые параграфы
        .replace(/<p><\/p>/g, '')
        .replace(/<p>\s*<\/p>/g, '');
}

// ===== ZOOM ИЗОБРАЖЕНИЙ =====
function initImageZoom() {
    document.querySelectorAll('.markdown-image').forEach(img => {
        // Пропускаем маленькие изображения
        if (img.naturalWidth < 100 || img.naturalHeight < 100) return;
        
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
                background: rgba(0,0,0,0.95);
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
                max-width: 95vw;
                max-height: 95vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.7);
                color: white;
                border: none;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                font-size: 1.5rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            `;
            closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(212, 160, 23, 0.9)';
            closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(0,0,0,0.7)';
            
            overlay.appendChild(zoomedImg);
            overlay.appendChild(closeBtn);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            
            // Закрытие по клику на overlay или кнопку
            function closeOverlay() {
                overlay.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    document.body.style.overflow = '';
                }, 300);
            }
            
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeOverlay();
            });
            
            closeBtn.addEventListener('click', closeOverlay);
            
            // Закрытие по ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') closeOverlay();
            });
        });
    });
}

// ===== ПОДДЕРЖКА МОБИЛЬНЫХ =====
function initMobileSupport() {
    // Предотвращаем масштабирование при двойном тапе
    let lastTouchEnd = 0;
    
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Увеличиваем зоны клика на мобильных
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        document.querySelectorAll('a, button').forEach(element => {
            element.style.minHeight = '44px';
            element.style.minWidth = '44px';
        });
    }
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
// Делаем функции доступными глобально
window.loadMarkdownFile = loadMarkdownFile;
window.parseMarkdown = parseMarkdown;

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .fa-spin {
        animation: fa-spin 2s linear infinite;
    }
    
    @keyframes fa-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error-message {
        text-align: center;
        padding: 40px;
        color: var(--accent-red);
    }
    
    .error-message h3 {
        margin-bottom: 20px;
    }
    
    .error-message i {
        margin-right: 10px;
    }
`;
document.head.appendChild(style);
