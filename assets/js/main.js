document.addEventListener('DOMContentLoaded', function() {
    // Управление размером шрифта
    const fontButtons = document.querySelectorAll('.font-btn');
    const htmlElement = document.documentElement;

    // Загружаем сохраненные настройки
    const savedFontSize = localStorage.getItem('vikingsFontSize') || 'medium';
    htmlElement.setAttribute('data-font-size', savedFontSize);
    document.querySelector(`.font-btn[data-size="${savedFontSize}"]`).disabled = true;

    fontButtons.forEach(button => {
        button.addEventListener('click', function() {
            fontButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('active');
            });
            this.disabled = true;
            this.classList.add('active');

            const size = this.getAttribute('data-size');
            htmlElement.setAttribute('data-font-size', size);
            localStorage.setItem('vikingsFontSize', size);
            applyFontSize(size);
        });
    });

    function applyFontSize(size) {
        let baseSize;
        switch(size) {
            case 'small':
                baseSize = '14px';
                break;
            case 'large':
                baseSize = '18px';
                break;
            default:
                baseSize = '16px';
        }
        document.documentElement.style.fontSize = baseSize;
    }

    // Обработка изображений
    document.querySelectorAll('img.content-image').forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function(e) {
            e.preventDefault();
            const newTab = window.open(this.src, '_blank');
            if (newTab) newTab.focus();
        });
    });

    // Защита от случайного скролла на мобильных
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        if (Math.abs(diff) > 50) return;
        if (Math.abs(diff) > 10) {
            e.preventDefault();
        }
    }, { passive: false });

    // Защита от контекстного меню на мобильных
    document.addEventListener('contextmenu', function(e) {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            e.preventDefault();
        }
    });

    // Применяем сохраненный размер шрифта
    applyFontSize(savedFontSize);
});
