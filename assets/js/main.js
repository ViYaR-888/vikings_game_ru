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
        
        // Конвертируем Markdown в HTML с улучшенным парсером
        const html = parseMarkdownEnhanced(markdown);
        
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
                    <button onclick="location.reload()" style="
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        padding: 12px 25px;
                        background: var(--primary-brown);
                        color: white;
                        border-radius: 6px;
                        border: 2px solid var(--primary-gold);
                        cursor: pointer;
                        font-family: var(--font-body);
                        font-size: 1rem;
                    ">
                        <i class="fas fa-redo"></i> Обновить страницу
                    </button>
                </div>
            `;
        }
    }
}

// ===== УЛУЧШЕННЫЙ ПАРСЕР MARKDOWN =====
function parseMarkdownEnhanced(markdown) {
    let html = markdown;
    
    // 1. Обработка заголовков
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
    html = html.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
    html = html.replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
    
    // 2. Жирный текст
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // 3. Курсив
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // 4. Зачёркнутый текст
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // 5. Улучшенная обработка списков
    const lines = html.split('\n');
    let inList = false;
    let listType = ''; // 'ul' или 'ol'
    let resultLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Проверяем, является ли строка элементом списка
        const isUnorderedItem = line.match(/^[*+-]\s+(.*)/);
        const isOrderedItem = line.match(/^\d+\.\s+(.*)/);
        
        if (isUnorderedItem || isOrderedItem) {
            const isCurrentUnordered = !!isUnorderedItem;
            const content = isUnorderedItem ? isUnorderedItem[1] : isOrderedItem[1];
            
            // Если это начало списка
            if (!inList) {
                listType = isCurrentUnordered ? 'ul' : 'ol';
                resultLines.push(`<${listType}>`);
                inList = true;
            }
            // Если тип списка изменился
            else if ((isCurrentUnordered && listType === 'ol') || 
                     (!isCurrentUnordered && listType === 'ul')) {
                resultLines.push(`</${listType}>`);
                listType = isCurrentUnordered ? 'ul' : 'ol';
                resultLines.push(`<${listType}>`);
            }
            
            resultLines.push(`<li>${processInlineMarkdown(content)}</li>`);
        } 
        // Если строка не является элементом списка, но мы были в списке
        else if (inList) {
            resultLines.push(`</${listType}>`);
            inList = false;
            listType = '';
            resultLines.push(line);
        } 
        // Обычная строка
        else {
            resultLines.push(line);
        }
    }
    
    // Закрываем список, если он остался открытым
    if (inList) {
        resultLines.push(`</${listType}>`);
    }
    
    html = resultLines.join('\n');
    
    // 6. Улучшенная обработка таблиц
    html = html.replace(/\n([|].*[|]\n)([-:| ]+[|]*)+\n([|].*[|]\n?)+/g, function(match) {
        const rows = match.trim().split('\n');
        let tableHtml = '<table>';
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].split('|').filter(cell => cell.trim() !== '');
            
            // Пропускаем строку-разделитель
            if (cells.every(cell => /^[-: ]+$/.test(cell.trim()))) {
                continue;
            }
            
            const tag = (i === 0) ? 'th' : 'td';
            tableHtml += '<tr>';
            
            cells.forEach(cell => {
                tableHtml += `<${tag}>${cell.trim()}</${tag}>`;
            });
            
            tableHtml += '</tr>';
        }
        
        tableHtml += '</table>';
        return tableHtml;
    });
    
    // 7. Блоки кода
    html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // 8. Встроенный код
    html = html.replace(/`([^`]+)`/g, function(match, code) {
        return `<code>${escapeHtml(code)}</code>`;
    });
    
    // 9. Цитаты
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
    
    // 10. Горизонтальные линии
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^___$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');
    
    // 11. Ссылки
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // 12. Изображения
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image">');
    
    // 13. Параграфы (обработка последней)
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        
        // Не оборачиваем в <p> если уже есть другие теги
        if (trimmed.match(/^<(\w+)[^>]*>/) || 
            trimmed.match(/^<(\/)?(h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th|img|a|code|strong|em|del)>/i)) {
            return trimmed;
        }
        
        return `<p>${processInlineMarkdown(trimmed)}</p>`;
    }).join('\n');
    
    // 14. Чистка лишних переносов
    html = html.replace(/\n{3,}/g, '\n\n');
    
    return html;
}

// Обработка инлайн-разметки внутри текста
function processInlineMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== ZOOM ИЗОБРАЖЕНИЙ =====
function initImageZoom() {
    document.querySelectorAll('.markdown-image').forEach(img => {
        // Пропускаем маленькие изображения
        if (img.naturalWidth < 100 && img.naturalHeight < 100) return;
        
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
                z-index: 10000;
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
    
    // Исправляем viewport для iOS
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
// Делаем функции доступными глобально
window.loadMarkdownFile = loadMarkdownFile;
window.parseMarkdownEnhanced = parseMarkdownEnhanced;

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
    
    /* Улучшенная прокрутка для таблиц на мобильных */
    @media (max-width: 768px) {
        .markdown-content {
            -webkit-overflow-scrolling: touch;
        }
        
        .markdown-content table {
            display: block;
            width: 100%;
            overflow-x: auto;
        }
    }
`;
document.head.appendChild(style);
