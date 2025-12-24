document.addEventListener('DOMContentLoaded', function() {
    // === КОНФИГУРАЦИЯ ===
    const CONFIG = {
        minFontSize: 14,
        defaultFontSize: 16,
        maxFontSize: 22,
        fontSizeStep: 2,
        localStorageKey: 'vikings_font_size'
    };

    // === ИНИЦИАЛИЗАЦИЯ ===
    function init() {
        setupFontControls();
        setupMobileTouch();
        setupSmoothScroll();
        setupBackButtons();
        restoreFontSize();
        setupImageZoom();
        preventCopyFooter();
    }

    // === УПРАВЛЕНИЕ ШРИФТОМ ===
    function setupFontControls() {
        const smallerBtn = document.getElementById('font-smaller');
        const resetBtn = document.getElementById('font-reset');
        const largerBtn = document.getElementById('font-larger');

        if (smallerBtn) {
            smallerBtn.addEventListener('click', () => changeFontSize(-CONFIG.fontSizeStep));
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', resetFontSize);
        }
        if (largerBtn) {
            largerBtn.addEventListener('click', () => changeFontSize(CONFIG.fontSizeStep));
        }
    }

    function changeFontSize(step) {
        const html = document.documentElement;
        const currentSize = parseInt(getComputedStyle(document.body).fontSize);
        const newSize = currentSize + step;
        
        if (newSize >= CONFIG.minFontSize && newSize <= CONFIG.maxFontSize) {
            document.body.style.fontSize = newSize + 'px';
            localStorage.setItem(CONFIG.localStorageKey, newSize);
            updateFontSizeClass(newSize);
        }
    }

    function resetFontSize() {
        document.body.style.fontSize = CONFIG.defaultFontSize + 'px';
        localStorage.setItem(CONFIG.localStorageKey, CONFIG.defaultFontSize);
        updateFontSizeClass(CONFIG.defaultFontSize);
    }

    function restoreFontSize() {
        const savedSize = localStorage.getItem(CONFIG.localStorageKey);
        if (savedSize) {
            const size = parseInt(savedSize);
            if (size >= CONFIG.minFontSize && size <= CONFIG.maxFontSize) {
                document.body.style.fontSize = size + 'px';
                updateFontSizeClass(size);
            }
        }
    }

    function updateFontSizeClass(size) {
        document.body.classList.remove('font-large', 'font-xlarge');
        if (size >= 18 && size < 20) {
            document.body.classList.add('font-large');
        } else if (size >= 20) {
            document.body.classList.add('font-xlarge');
        }
    }

    // === МОБИЛЬНЫЕ КАСАНИЯ ===
    function setupMobileTouch() {
        let lastTouchEnd = 0;
        
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Запрет масштабирования
        document.addEventListener('touchmove', function(event) {
            if (event.scale !== 1) {
                event.preventDefault();
            }
        }, { passive: false });

        // Улучшенная навигация для мобильных
        if ('ontouchstart' in window) {
            document.querySelectorAll('a, button').forEach(el => {
                el.style.cursor = 'pointer';
                el.addEventListener('touchstart', function() {
                    this.classList.add('active');
                });
                el.addEventListener('touchend', function() {
                    this.classList.remove('active');
                });
            });
        }
    }

    // === ПЛАВНАЯ ПРОКРУТКА ===
    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = document.querySelector('.main-header').offsetHeight;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // === КНОПКИ НАЗАД В MARKDOWN ===
    function setupBackButtons() {
        document.addEventListener('click', function(e) {
            if (e.target.matches('.markdown-content a[href$="/"]')) {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                if (href.includes('rules/') || href.includes('factions/') || href.includes('units/')) {
                    window.location.href = href;
                }
            }
        });
    }

    // === ЗУМ ИЗОБРАЖЕНИЙ ===
    function setupImageZoom() {
        document.querySelectorAll('.markdown-content img').forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function() {
                const overlay = document.createElement('div');
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
                    z-index: 2000;
                    cursor: zoom-out;
                `;
                
                const zoomedImg = document.createElement('img');
                zoomedImg.src = this.src;
                zoomedImg.alt = this.alt;
                zoomedImg.style.cssText = `
                    max-width: 90%;
                    max-height: 90%;
                    object-fit: contain;
                    border: 3px solid var(--primary-gold);
                    border-radius: 10px;
                `;
                
                overlay.appendChild(zoomedImg);
                document.body.appendChild(overlay);
                
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay || e.target === zoomedImg) {
                        document.body.removeChild(overlay);
                    }
                });
            });
        });
    }

    // === ЗАЩИТА ФУТЕРА ОТ КОПИРОВАНИЯ ===
    function preventCopyFooter() {
        const footer = document.querySelector('.main-footer');
        if (footer) {
            footer.addEventListener('copy', function(e) {
                e.preventDefault();
                showNotification('Копирование информации из футера запрещено', 'warning');
            });
            
            footer.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                showNotification('Действие запрещено', 'warning');
            });
            
            // Делаем текст в футере некопируемым
            footer.style.userSelect = 'none';
            footer.style.webkitUserSelect = 'none';
        }
    }

    function showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        const oldNotification = document.querySelector('.custom-notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `custom-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'warning' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'warning' ? '#721c24' : '#0c5460'};
            padding: 15px 25px;
            border-radius: 8px;
            border: 2px solid ${type === 'warning' ? '#f5c6cb' : '#bee5eb'};
            z-index: 3000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // === ДОБАВЛЯЕМ СТИЛИ ДЛЯ АНИМАЦИЙ ===
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .active {
            transform: scale(0.95);
            opacity: 0.9;
        }
        
        @media (hover: none) and (pointer: coarse) {
            a, button {
                -webkit-tap-highlight-color: transparent;
            }
            
            .nav-card:active {
                background: linear-gradient(135deg, var(--primary-gold), var(--accent-red));
                color: white;
            }
        }
    `;
    document.head.appendChild(style);

    // === ЗАПУСК ===
    init();

    // === ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ MARKDOWN ===
    if (!window.loadMarkdown) {
        window.loadMarkdown = async function(file, containerId = 'markdown-content') {
            try {
                const response = await fetch(file);
                if (!response.ok) throw new Error('Файл не найден');
                const markdown = await response.text();
                
                // Используем Marked.js если доступен
                let html;
                if (typeof marked !== 'undefined') {
                    marked.setOptions({
                        breaks: true,
                        gfm: true,
                        headerIds: true
                    });
                    html = marked.parse(markdown);
                } else {
                    // Простой парсер если Marked.js не загружен
                    html = markdown
                        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                        .replace(/\n/g, '<br>');
                }
                
                const container = document.getElementById(containerId);
                container.innerHTML = html;
                
                // Обновляем обработчики для новых изображений
                setupImageZoom();
                
                // Плавная прокрутка к контенту
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
            } catch (error) {
                console.error('Ошибка загрузки Markdown:', error);
                const container = document.getElementById(containerId);
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Ошибка загрузки</h3>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" class="retry-btn">
                            <i class="fas fa-redo"></i> Попробовать снова
                        </button>
                    </div>
                `;
            }
        };
    }
});

// === ПОЛИФИЛЛ ДЛЯ СТАРЫХ БРАУЗЕРОВ ===
if (!Element.prototype.matches) {
    Element.prototype.matches = 
        Element.prototype.matchesSelector || 
        Element.prototype.webkitMatchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector;
}

// === ОБРАБОТЧИК ОШИБОК ===
window.addEventListener('error', function(e) {
    console.error('Глобальная ошибка:', e.error);
});
