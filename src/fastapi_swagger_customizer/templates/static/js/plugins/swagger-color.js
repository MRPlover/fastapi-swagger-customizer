/**
 * swagger-color.js
 * Настройка цветов эндпоинтов Swagger UI
 * Фон карточек вычисляется автоматически из основного цвета
 */
(function() {
    'use strict';

    // ============ КОНФИГУРАЦИЯ ПО УМОЛЧАНИЮ ============
    const DEFAULT_CONFIG = {
        colors: {
            GET: '#61affe',
            POST: '#49cc90',
            PUT: '#fca130',
            DELETE: '#f93e3e',
            PATCH: '#50e3c2',
            HEAD: '#9012fe',
            OPTIONS: '#0d5aa7'
        },
        enabled: true,
        backgroundEnabled: true
    };

    let config = { ...DEFAULT_CONFIG };
    let isConfigLoaded = false;
    let settingsPanel = null;

    // ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ЦВЕТОВ ============
    
    // Конвертация HEX в RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Конвертация RGB в HEX
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(c => {
            const hex = Math.round(c).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    // Смешивание цвета с белым (полупрозрачный фон)
    function mixWithWhite(hex, opacity = 0.85) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        
        // Смешиваем с белым (255, 255, 255)
        const r = rgb.r * (1 - opacity) + 255 * opacity;
        const g = rgb.g * (1 - opacity) + 255 * opacity;
        const b = rgb.b * (1 - opacity) + 255 * opacity;
        
        return rgbToHex(r, g, b);
    }

    // Создание светлой версии цвета (для фона)
    function getBackgroundColor(hex) {
        // Если цвет темный, делаем очень светлый фон
        const rgb = hexToRgb(hex);
        if (!rgb) return '#f5f5f5';
        
        // Вычисляем яркость
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        
        if (brightness < 128) {
            // Темный цвет → светлый фон с сильным разбеливанием
            return mixWithWhite(hex, 0.9);
        } else {
            // Светлый цвет → чуть светлее
            return mixWithWhite(hex, 0.8);
        }
    }

    // ============ ЗАГРУЗКА КОНФИГА ============
    function loadConfig() {
        if (typeof SWAGGER_COLORS_CONFIG !== 'undefined') {
            config = { ...DEFAULT_CONFIG, ...SWAGGER_COLORS_CONFIG };
            isConfigLoaded = true;
            console.log('✅ Конфигурация загружена из SWAGGER_COLORS_CONFIG');
        } else {
            console.log('⚠️ Используем настройки по умолчанию');
            isConfigLoaded = false;
        }
        applyColors();
        applyBackgrounds();
        if (settingsPanel) updateColorPickerValues();
    }

    // ============ СОХРАНЕНИЕ ============
    function saveConfigToFile() {
        const jsContent = `// Настройка цветов эндпоинтов Swagger UI
// Автоматически сгенерировано
const SWAGGER_COLORS_CONFIG = ${JSON.stringify({
    colors: config.colors,
    enabled: config.enabled,
    backgroundEnabled: config.backgroundEnabled
}, null, 4)};
`;
        const blob = new Blob([jsContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'swagger-colors-config.js';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        try {
            localStorage.setItem('swagger-colors-config-backup', JSON.stringify({
                colors: config.colors,
                enabled: config.enabled,
                backgroundEnabled: config.backgroundEnabled
            }));
            console.log('💾 Резервная копия сохранена в localStorage');
        } catch (e) {}
        
        window.SWAGGER_COLORS_CONFIG = {
            colors: config.colors,
            enabled: config.enabled,
            backgroundEnabled: config.backgroundEnabled
        };
        
        alert('✅ Файл сгенерирован! Скачайте и замените им файл на сервере.');
    }

    // ============ АВТОЗАМЕНА ИЗ localStorage ============
    function autoReplaceFromLocalStorage() {
        try {
            const saved = localStorage.getItem('swagger-colors-config-backup');
            if (saved) {
                const data = JSON.parse(saved);
                config = { ...DEFAULT_CONFIG, ...data };
                isConfigLoaded = true;
                window.SWAGGER_COLORS_CONFIG = {
                    colors: config.colors,
                    enabled: config.enabled,
                    backgroundEnabled: config.backgroundEnabled
                };
                applyColors();
                applyBackgrounds();
                if (settingsPanel) updateColorPickerValues();
                console.log('🔄 Конфигурация восстановлена из localStorage');
                return true;
            }
        } catch (e) {}
        return false;
    }

    // ============ ПРИМЕНЕНИЕ ЦВЕТОВ МЕТОДОВ ============
    function applyColors() {
        if (!config.enabled) {
            document.querySelectorAll('.opblock-summary-method').forEach(el => {
                el.style.backgroundColor = '';
            });
            return;
        }
        document.querySelectorAll('.opblock-summary-method').forEach(el => {
            const method = el.textContent.trim().toUpperCase();
            if (config.colors[method]) {
                el.style.backgroundColor = config.colors[method];
            }
        });
    }

    // ============ ПРИМЕНЕНИЕ ФОНОВ (автоматически из цвета) ============
    function applyBackgrounds() {
        if (!config.backgroundEnabled) {
            document.querySelectorAll('.opblock').forEach(el => {
                el.style.backgroundColor = '';
                el.style.borderColor = '';
            });
            return;
        }
        
        document.querySelectorAll('.opblock').forEach(el => {
            const methodEl = el.querySelector('.opblock-summary-method');
            if (methodEl) {
                const method = methodEl.textContent.trim().toUpperCase();
                if (config.colors[method]) {
                    // Вычисляем фон из основного цвета
                    const bgColor = getBackgroundColor(config.colors[method]);
                    el.style.backgroundColor = bgColor;
                    // Граница = основной цвет, но чуть прозрачнее
                    el.style.borderColor = config.colors[method];
                    el.style.borderWidth = '1px';
                    el.style.borderStyle = 'solid';
                }
            }
        });
    }

    // ============ ОБНОВЛЕНИЕ ПАЛИТРЫ ============
    function updateColorPickerValues() {
        if (!settingsPanel) return;
        
        const inputs = settingsPanel.querySelectorAll('.color-picker-input');
        inputs.forEach(input => {
            const method = input.dataset.method;
            if (config.colors[method]) {
                input.value = config.colors[method];
                const item = input.closest('.color-item');
                if (item) {
                    const preview = item.querySelector('.color-preview');
                    const hexInput = item.querySelector('.color-hex-input');
                    const bgPreview = item.querySelector('.bg-preview');
                    if (preview) preview.style.backgroundColor = config.colors[method];
                    if (hexInput) hexInput.value = config.colors[method];
                    // Показываем автоматический фон
                    if (bgPreview) {
                        bgPreview.style.backgroundColor = getBackgroundColor(config.colors[method]);
                    }
                }
            }
        });

        const toggle = settingsPanel.querySelector('#enable-colors');
        if (toggle) toggle.checked = config.enabled;
        
        const bgToggle = settingsPanel.querySelector('#enable-backgrounds');
        if (bgToggle) bgToggle.checked = config.backgroundEnabled;
    }

    // ============ СОЗДАНИЕ UI ============
    function createSettingsUI() {
        const container = document.createElement('div');
        container.id = 'swagger-colors-settings';
        container.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 380px;
            height: 100vh;
            background: white;
            box-shadow: -2px 0 10px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 10000;
            padding: 20px;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 15px;">
                <h3 style="margin: 0; font-size: 18px;">Настройка цветов</h3>
                <button id="close-settings" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0 5px;">✕</button>
            </div>
            
            <div style="margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 13px; color: #666;">
                Конфигурация: <strong>swagger-colors-config.js</strong>
                <br>
                <span style="color: ${isConfigLoaded ? '#28a745' : '#dc3545'};">
                    ${isConfigLoaded ? '✅ Загружена' : '⚠️ Используется по умолчанию'}
                </span>
                <br>
                <span style="font-size: 11px; color: #999;">
                    localStorage: ${localStorage.getItem('swagger-colors-config-backup') ? '✅ есть резервная копия' : '❌ нет копии'}
                </span>
                <br>
                <span style="font-size: 11px; color: #888;">
                    Фон карточек вычисляется автоматически из основного цвета
                </span>
            </div>

            <!-- ЦВЕТА МЕТОДОВ -->
            <div style="margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Цвета методов</h4>
                <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; margin-bottom: 10px;">
                    <input type="checkbox" id="enable-colors" ${config.enabled ? 'checked' : ''}>
                    Включить кастомные цвета
                </label>
                
                <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; margin-bottom: 10px;">
                    <input type="checkbox" id="enable-backgrounds" ${config.backgroundEnabled ? 'checked' : ''}>
                    Включить фоны карточек (автоматически)
                </label>
                
                <div id="color-picker-container">
                    ${Object.keys(config.colors).map(method => `
                        <div class="color-item" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; padding: 4px 8px; border-radius: 4px; background: #fafafa;">
                            <span style="min-width: 60px; font-weight: bold; font-size: 12px; color: #333;">${method}</span>
                            <input type="color" class="color-picker-input" data-method="${method}" value="${config.colors[method]}" style="width: 35px; height: 35px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; padding: 2px;">
                            <span class="color-preview" style="width: 25px; height: 25px; border-radius: 4px; background-color: ${config.colors[method]}; border: 1px solid #ddd;"></span>
                            <span style="font-size: 11px; color: #999;">→</span>
                            <span class="bg-preview" style="width: 25px; height: 25px; border-radius: 4px; background-color: ${getBackgroundColor(config.colors[method])}; border: 1px solid #ddd;" title="Автоматический фон"></span>
                            <input type="text" class="color-hex-input" data-method="${method}" value="${config.colors[method]}" style="flex: 1; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; font-family: monospace;">
                        </div>
                    `).join('')}
                </div>
                <div style="font-size: 11px; color: #999; margin-top: 5px;">
                    Фон карточки автоматически вычисляется из основного цвета
                </div>
            </div>

            <!-- КНОПКИ -->
            <div style="margin-top: 20px; border-top: 2px solid #eee; padding-top: 20px;">
                <button id="reset-colors" style="width: 100%; padding: 10px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 14px; margin-bottom: 10px;">
                    Сбросить к настройкам по умолчанию
                </button>
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button id="save-local-btn" style="width: 100%; padding: 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">
                        Сохранить в localStorage (автозамена)
                    </button>
                    
                    <button id="save-file-btn" style="width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">
                        Скачать JS-файл
                    </button>
                    
                    <button id="restore-btn" style="width: 100%; padding: 12px; background: #ffc107; color: #333; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">
                        Восстановить из localStorage
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        settingsPanel = container;

        // ============ ОБРАБОТЧИКИ ============
        document.getElementById('close-settings').addEventListener('click', () => {
            container.style.transform = 'translateX(100%)';
        });

        document.getElementById('enable-colors').addEventListener('change', function() {
            config.enabled = this.checked;
            applyColors();
        });

        document.getElementById('enable-backgrounds').addEventListener('change', function() {
            config.backgroundEnabled = this.checked;
            applyBackgrounds();
        });

        // Цветовые пикеры
        container.querySelectorAll('.color-picker-input').forEach(input => {
            input.addEventListener('input', function() {
                const method = this.dataset.method;
                const color = this.value;
                config.colors[method] = color;
                const item = this.closest('.color-item');
                item.querySelector('.color-preview').style.backgroundColor = color;
                item.querySelector('.color-hex-input').value = color;
                // Автоматически обновляем фон
                const bgPreview = item.querySelector('.bg-preview');
                if (bgPreview) {
                    bgPreview.style.backgroundColor = getBackgroundColor(color);
                }
                applyColors();
                applyBackgrounds();
            });
        });

        // Hex-поля
        container.querySelectorAll('.color-hex-input').forEach(input => {
            input.addEventListener('change', function() {
                const method = this.dataset.method;
                let color = this.value.trim();
                if (!color.startsWith('#')) color = '#' + color;
                if (/^#[0-9a-f]{6}$/i.test(color) || /^#[0-9a-f]{3}$/i.test(color)) {
                    config.colors[method] = color;
                    const item = this.closest('.color-item');
                    item.querySelector('.color-picker-input').value = color;
                    item.querySelector('.color-preview').style.backgroundColor = color;
                    const bgPreview = item.querySelector('.bg-preview');
                    if (bgPreview) {
                        bgPreview.style.backgroundColor = getBackgroundColor(color);
                    }
                    applyColors();
                    applyBackgrounds();
                } else {
                    alert('❌ Неверный формат цвета. Используйте HEX: #RRGGBB');
                    this.value = config.colors[method];
                }
            });
        });

        // Сохранить в localStorage
        document.getElementById('save-local-btn').addEventListener('click', function() {
            try {
                localStorage.setItem('swagger-colors-config-backup', JSON.stringify({
                    colors: config.colors,
                    enabled: config.enabled,
                    backgroundEnabled: config.backgroundEnabled
                }));
                window.SWAGGER_COLORS_CONFIG = {
                    colors: config.colors,
                    enabled: config.enabled,
                    backgroundEnabled: config.backgroundEnabled
                };
                alert('✅ Настройки сохранены в localStorage! При следующем обновлении они применятся автоматически.');
            } catch (e) {
                alert('❌ Ошибка сохранения: ' + e.message);
            }
        });

        // Скачать файл
        document.getElementById('save-file-btn').addEventListener('click', function() {
            saveConfigToFile();
        });

        // Восстановить из localStorage
        document.getElementById('restore-btn').addEventListener('click', function() {
            if (autoReplaceFromLocalStorage()) {
                alert('✅ Настройки восстановлены из localStorage!');
            } else {
                alert('❌ Нет сохраненных настроек в localStorage');
            }
        });

        // Сброс
        document.getElementById('reset-colors').addEventListener('click', function() {
            if (confirm('Сбросить все цвета к настройкам по умолчанию?')) {
                config.colors = { ...DEFAULT_CONFIG.colors };
                config.enabled = true;
                config.backgroundEnabled = true;
                updateColorPickerValues();
                document.getElementById('enable-colors').checked = true;
                document.getElementById('enable-backgrounds').checked = true;
                applyColors();
                applyBackgrounds();
                alert('✅ Цвета сброшены к настройкам по умолчанию.');
            }
        });

        return container;
    }

    // ============ КНОПКА НАСТРОЕК ============
    function createSettingsButton() {
        const btn = document.createElement('button');
        btn.id = 'swagger-colors-toggle';
        btn.innerHTML = '🎨';
        btn.title = 'Настройка цветов эндпоинтов';
        btn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: white;
            border: 2px solid #e0e0e0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            color: #333;
        `;
        btn.addEventListener('click', function() {
            const settings = document.getElementById('swagger-colors-settings');
            if (settings) settings.style.transform = 'translateX(0)';
        });
        document.body.appendChild(btn);
        return btn;
    }

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    function init() {
        if (!autoReplaceFromLocalStorage()) {
            loadConfig();
        }
        
        createSettingsButton();
        createSettingsUI();
        
        setTimeout(() => {
            applyColors();
            applyBackgrounds();
        }, 500);

        const observer = new MutationObserver(() => {
            if (config.enabled) applyColors();
            if (config.backgroundEnabled) applyBackgrounds();
        });
        const target = document.getElementById('swagger-ui');
        if (target) observer.observe(target, { childList: true, subtree: true });

        console.log('Настройка цветов эндпоинтов запущена!');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();