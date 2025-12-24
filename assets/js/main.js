document.addEventListener('DOMContentLoaded', function() {
    // 1. Защита от случайного масштабирования на мобильных устройствах
    document.addEventListener('touchmove', function(e) {
        if (e.scale !== 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // 2. Добавляем класс для мобильных устройств (для адаптивных стилей)
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        document.body.classList.add('is-mobile');
    }

    // 3. Управление размером шрифта (если нужно)
    const fontButtons = document.querySelectorAll('.font-btn');
    if (fontButtons.length > 0) {
        const htmlElement = document.documentElement;
        const savedFontSize = localStorage.getItem('vikingsFontSize') || 'medium';
        htmlElement.setAttribute('data-font-size', savedFontSize);

        fontButtons.forEach(button => {
            if (button.getAttribute('data-size') === savedFontSize) {
                button.disabled = true;
            }
            button.addEventListener('click', function() {
                fontButtons.forEach(btn => {
                    btn.disabled = false;
                });
                this.disabled = true;
                const size = this.getAttribute('data-size');
                htmlElement.setAttribute('data-font-size', size);
                localStorage.setItem('vikingsFontSize', size);
            });
        });
    }

    // 4. Обработка кликов по изображениям (открытие в новой вкладке)
    document.querySelectorAll('img.content-image').forEach(img => {
        img.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(this.src, '_blank');
        });
    });

    // 5. Загрузка Markdown-контента (если есть)
    if (window.loadMarkdown) return; // Избегаем повторного объявления
    window.loadMarkdown = async function(file, containerId = 'markdown-content') {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error('Файл не найден');
            const markdown = await response.text();
            const html = marked.parse(markdown);
            document.getElementById(containerId).innerHTML = html;
        } catch (error) {
            document.getElementById(containerId).innerHTML = `<p>Ошибка загрузки: ${error.message}</p>`;
        }
    };
});
