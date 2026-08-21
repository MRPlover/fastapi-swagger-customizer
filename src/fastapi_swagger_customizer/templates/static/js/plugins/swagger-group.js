/**
 * Обработчик для группировки тегов с точками в Swagger UI
 * Использует оригинальные стили и элементы Swagger UI
 */
(function() {
    'use strict';

    console.log('🔄 Запуск обработчика группировки тегов...');

    // Хранилище контейнеров с полными путями
    const containerRegistry = new Map();

    // Главная функция
    function processTags() {
        const tagSections = document.querySelectorAll('.opblock-tag-section');
        if (tagSections.length === 0) {
            setTimeout(processTags, 300);
            return;
        }

        // 1. Собираем все теги с точками
        const tagsWithDots = [];
        const ordinaryTags = [];
        
        tagSections.forEach(section => {
            const tagEl = section.querySelector('.opblock-tag');
            if (!tagEl) return;
            
            const tagName = tagEl.getAttribute('data-tag');
            if (!tagName) return;
            
            if (tagName.includes('.')) {
                tagsWithDots.push({
                    name: tagName,
                    section: section,
                    tagEl: tagEl,
                    parts: tagName.split('.')
                });
            } else {
                ordinaryTags.push({
                    name: tagName,
                    section: section,
                    tagEl: tagEl
                });
            }
        });

        if (tagsWithDots.length === 0) {
            console.log('✅ Тегов с точками не найдено');
            return;
        }

        console.log(`📁 Найдено тегов с точками: ${tagsWithDots.length}`);

        // 2. Группируем по префиксу (только первый сегмент)
        const groups = new Map();
        tagsWithDots.forEach(tag => {
            const prefix = tag.parts[0];
            if (!groups.has(prefix)) {
                groups.set(prefix, []);
            }
            groups.get(prefix).push(tag);
        });

        console.log(`📂 Групп для объединения: ${groups.size}`);

        // 3. Обрабатываем каждую группу первого уровня
        groups.forEach((tags, prefix) => {
            let container = findContainer(prefix);
            
            if (!container) {
                const existingOrdinary = ordinaryTags.find(t => t.name === prefix);
                if (existingOrdinary) {
                    container = convertOrdinaryToContainer(existingOrdinary, prefix, tags);
                } else {
                    container = createContainer(prefix, tags);
                    const firstTag = tags[0];
                    if (firstTag) {
                        firstTag.section.parentNode.insertBefore(container, firstTag.section);
                    }
                }
            }

            // Перемещаем теги в контейнер
            tags.forEach(tag => {
                const newName = tag.parts.slice(1).join('.');
                tag.tagEl.setAttribute('data-tag', newName);
                
                const link = tag.tagEl.querySelector('a.nostyle');
                if (link) {
                    link.href = `#/${newName}`;
                    const span = link.querySelector('span');
                    if (span) {
                        span.textContent = newName;
                    }
                }

                container.querySelector('.operation-tag-content').appendChild(tag.section);
            });
        });

        // 4. Последовательно обрабатываем вложенные теги
        processNestedTagsSequentially();

        console.log('✅ Группировка завершена!');
    }

    // Последовательная обработка вложенных тегов
    function processNestedTagsSequentially() {
        console.log('🔄 Начинаем последовательную обработку вложенных тегов...');
        
        // Получаем все контейнеры на текущем уровне
        const containers = document.querySelectorAll('.opblock-tag-section[data-prefix]');
        let hasNested = false;
        
        containers.forEach(container => {
            const contentContainer = container.querySelector('.operation-tag-content');
            if (!contentContainer) return;
            
            // Находим теги с точками внутри контейнера
            const nestedTags = [];
            const sections = contentContainer.querySelectorAll(':scope > .opblock-tag-section');
            
            sections.forEach(section => {
                const tagEl = section.querySelector('.opblock-tag');
                if (!tagEl) return;
                
                const tagName = tagEl.getAttribute('data-tag');
                if (!tagName || !tagName.includes('.')) return;

                nestedTags.push({
                    name: tagName,
                    section: section,
                    tagEl: tagEl,
                    parts: tagName.split('.')
                });
            });

            if (nestedTags.length === 0) return;
            
            hasNested = true;

            // Группируем вложенные теги по первому сегменту
            const nestedGroups = new Map();
            nestedTags.forEach(tag => {
                const prefix = tag.parts[0];
                if (!nestedGroups.has(prefix)) {
                    nestedGroups.set(prefix, []);
                }
                nestedGroups.get(prefix).push(tag);
            });

            nestedGroups.forEach((tags, prefix) => {
                // Строим полный путь для вложенного контейнера
                const parentFullPath = container.dataset.fullPath || container.dataset.prefix;
                const fullPath = parentFullPath ? `${parentFullPath}.${prefix}` : prefix;
                
                console.log(`  📂 Обработка вложенной группы: "${fullPath}" (отображение: "${prefix}")`);
                
                // Ищем контейнер по полному пути
                let nestedContainer = findContainer(fullPath);
                
                if (!nestedContainer) {
                    // Проверяем, есть ли обычный тег с таким именем внутри
                    let existingOrdinary = null;
                    const ordinarySections = contentContainer.querySelectorAll(':scope > .opblock-tag-section');
                    ordinarySections.forEach(section => {
                        const tagEl = section.querySelector('.opblock-tag');
                        if (tagEl) {
                            const tagName = tagEl.getAttribute('data-tag');
                            if (tagName === prefix && !tagName.includes('.')) {
                                existingOrdinary = {
                                    section: section,
                                    tagEl: tagEl
                                };
                            }
                        }
                    });
                    
                    if (existingOrdinary) {
                        console.log(`    🔄 Преобразуем обычный тег "${prefix}" в контейнер "${fullPath}"`);
                        nestedContainer = convertOrdinaryToContainer(existingOrdinary, fullPath, tags);
                        // Обновляем отображение - показываем только последний сегмент
                        const tagEl = nestedContainer.querySelector('.opblock-tag');
                        if (tagEl) {
                            const displayName = prefix;
                            tagEl.setAttribute('data-tag', displayName);
                            const link = tagEl.querySelector('a.nostyle');
                            if (link) {
                                link.href = `#/${displayName}`;
                                const span = link.querySelector('span');
                                if (span) {
                                    span.textContent = displayName;
                                }
                            }
                        }
                        nestedContainer.dataset.prefix = fullPath;
                        nestedContainer.dataset.fullPath = fullPath;
                        
                        // Обновляем счетчик
                        const count = tagEl.querySelector('small');
                        if (count) {
                            count.textContent = ` ${tags.length}`;
                        }
                        
                        const firstTag = tags[0];
                        if (firstTag) {
                            contentContainer.insertBefore(nestedContainer, firstTag.section);
                        }
                    } else {
                        console.log(`    📦 Создаем контейнер "${fullPath}" (отображение: "${prefix}")`);
                        nestedContainer = createNestedContainer(fullPath, prefix, tags);
                        const firstTag = tags[0];
                        if (firstTag) {
                            contentContainer.insertBefore(nestedContainer, firstTag.section);
                        }
                    }
                }

                // Перемещаем теги во вложенный контейнер
                tags.forEach(tag => {
                    const newName = tag.parts.slice(1).join('.');
                    tag.tagEl.setAttribute('data-tag', newName);
                    
                    const link = tag.tagEl.querySelector('a.nostyle');
                    if (link) {
                        link.href = `#/${newName}`;
                        const span = link.querySelector('span');
                        if (span) {
                            span.textContent = newName;
                        }
                    }

                    const nestedContent = nestedContainer.querySelector('.operation-tag-content');
                    if (nestedContent) {
                        nestedContent.appendChild(tag.section);
                    }
                });
            });
        });

        // Если есть вложенные теги, обрабатываем следующий уровень с задержкой
        if (hasNested) {
            console.log('  ⏳ Есть вложенные теги, продолжаем обработку...');
            setTimeout(processNestedTagsSequentially, 300);
        } else {
            console.log('  ✅ Все уровни обработаны');
        }
    }

    // Функция преобразования обычного тега в контейнер
    function convertOrdinaryToContainer(ordinaryTag, prefix, tags) {
        const section = ordinaryTag.section;
        const tagEl = ordinaryTag.tagEl;
        
        section.dataset.prefix = prefix;
        section.dataset.fullPath = prefix;
        tagEl.setAttribute('data-tag', prefix);
        tagEl.setAttribute('data-full-path', prefix);
        
        const count = tagEl.querySelector('small');
        if (count) {
            count.textContent = ` ${tags.length}`;
        } else {
            const newCount = document.createElement('small');
            newCount.textContent = ` ${tags.length}`;
            newCount.style.cssText = `
                font-size: 12px;
                color: #999;
                margin-left: 4px;
            `;
            tagEl.appendChild(newCount);
        }
        
        let content = section.querySelector('.no-margin');
        if (!content) {
            content = document.createElement('div');
            content.className = 'no-margin';
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'operation-tag-content';
            content.appendChild(tagsContainer);
            section.appendChild(content);
        }
        
        let tagsContainer = content.querySelector('.operation-tag-content');
        if (!tagsContainer) {
            tagsContainer = document.createElement('div');
            tagsContainer.className = 'operation-tag-content';
            content.appendChild(tagsContainer);
        }
        
        let button = tagEl.querySelector('.expand-operation');
        if (!button) {
            button = document.createElement('button');
            button.setAttribute('aria-expanded', 'true');
            button.className = 'expand-operation';
            button.title = 'Collapse operation';
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="arrow" width="20" height="20" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M 17.418 14.908 C 17.69 15.176 18.127 15.176 18.397 14.908 C 18.667 14.64 18.668 14.207 18.397 13.939 L 10.489 6.109 C 10.219 5.841 9.782 5.841 9.51 6.109 L 1.602 13.939 C 1.332 14.207 1.332 14.64 1.602 14.908 C 1.873 15.176 2.311 15.176 2.581 14.908 L 10 7.767 L 17.418 14.908 Z"></path>
                </svg>
            `;
            tagEl.appendChild(button);
        }
        
        section.classList.add('is-open');
        tagEl.setAttribute('data-is-open', 'true');
        
        tagEl.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = section.classList.contains('is-open');
            const contentEl = section.querySelector('.no-margin');
            const arrow = this.querySelector('.arrow');
            const btn = this.querySelector('.expand-operation');
            
            if (isOpen) {
                section.classList.remove('is-open');
                if (contentEl) contentEl.style.display = 'none';
                this.setAttribute('data-is-open', 'false');
                if (btn) btn.setAttribute('aria-expanded', 'false');
                if (arrow) {
                    arrow.style.transform = 'rotate(0deg)';
                }
            } else {
                section.classList.add('is-open');
                if (contentEl) contentEl.style.display = 'block';
                this.setAttribute('data-is-open', 'true');
                if (btn) btn.setAttribute('aria-expanded', 'true');
                if (arrow) {
                    arrow.style.transform = 'rotate(180deg)';
                }
            }
        });
        
        containerRegistry.set(prefix, section);
        
        console.log(`  ✅ Преобразован обычный тег "${prefix}" в контейнер`);
        return section;
    }

    function findContainer(prefix) {
        if (containerRegistry.has(prefix)) {
            return containerRegistry.get(prefix);
        }
        const containers = document.querySelectorAll('.opblock-tag-section[data-prefix]');
        for (const container of containers) {
            const header = container.querySelector('.opblock-tag');
            if (header && header.getAttribute('data-tag') === prefix) {
                containerRegistry.set(prefix, container);
                return container;
            }
        }
        return null;
    }

    function createContainer(prefix, tags) {
        const container = document.createElement('div');
        container.className = 'opblock-tag-section is-open';
        container.dataset.prefix = prefix;
        container.dataset.fullPath = prefix;

        const header = document.createElement('h3');
        header.className = 'opblock-tag no-desc';
        header.id = `operations-tag-${prefix.replace(/\./g, '_')}`;
        header.setAttribute('data-tag', prefix);
        header.setAttribute('data-full-path', prefix);
        header.setAttribute('data-is-open', 'true');

        const link = document.createElement('a');
        link.className = 'nostyle';
        link.href = `#/${prefix}`;
        
        const span = document.createElement('span');
        span.textContent = prefix;
        link.appendChild(span);

        const count = document.createElement('small');
        count.textContent = ` ${tags.length}`;
        count.style.cssText = `
            font-size: 12px;
            color: #999;
            margin-left: 4px;
        `;

        const button = document.createElement('button');
        button.setAttribute('aria-expanded', 'true');
        button.className = 'expand-operation';
        button.title = 'Collapse operation';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="arrow" width="20" height="20" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M 17.418 14.908 C 17.69 15.176 18.127 15.176 18.397 14.908 C 18.667 14.64 18.668 14.207 18.397 13.939 L 10.489 6.109 C 10.219 5.841 9.782 5.841 9.51 6.109 L 1.602 13.939 C 1.332 14.207 1.332 14.64 1.602 14.908 C 1.873 15.176 2.311 15.176 2.581 14.908 L 10 7.767 L 17.418 14.908 Z"></path>
            </svg>
        `;

        header.appendChild(link);
        header.appendChild(count);
        header.appendChild(button);
        container.appendChild(header);

        const content = document.createElement('div');
        content.className = 'no-margin';
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'operation-tag-content';
        content.appendChild(tagsContainer);
        container.appendChild(content);

        header.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = container.classList.contains('is-open');
            const contentEl = container.querySelector('.no-margin');
            const arrow = this.querySelector('.arrow');
            
            if (isOpen) {
                container.classList.remove('is-open');
                if (contentEl) contentEl.style.display = 'none';
                this.setAttribute('data-is-open', 'false');
                button.setAttribute('aria-expanded', 'false');
                if (arrow) {
                    arrow.style.transform = 'rotate(0deg)';
                }
            } else {
                container.classList.add('is-open');
                if (contentEl) contentEl.style.display = 'block';
                this.setAttribute('data-is-open', 'true');
                button.setAttribute('aria-expanded', 'true');
                if (arrow) {
                    arrow.style.transform = 'rotate(180deg)';
                }
            }
        });

        containerRegistry.set(prefix, container);

        return container;
    }

    function createNestedContainer(fullPath, displayName, tags) {
        const container = document.createElement('div');
        container.className = 'opblock-tag-section is-open';
        container.dataset.prefix = fullPath;
        container.dataset.fullPath = fullPath;

        const header = document.createElement('h3');
        header.className = 'opblock-tag no-desc';
        header.id = `operations-tag-${fullPath.replace(/\./g, '_')}`;
        header.setAttribute('data-tag', displayName);
        header.setAttribute('data-full-path', fullPath);
        header.setAttribute('data-is-open', 'true');
        header.style.cssText = `
            font-size: 14px !important;
            padding: 5px 0 !important;
            margin: 0 !important;
            background: none !important;
            border: none !important;
        `;

        const link = document.createElement('a');
        link.className = 'nostyle';
        link.href = `#/${displayName}`;
        
        const span = document.createElement('span');
        span.textContent = displayName;
        link.appendChild(span);

        const count = document.createElement('small');
        count.textContent = ` ${tags.length}`;
        count.style.cssText = `
            font-size: 11px;
            color: #999;
            margin-left: 4px;
        `;

        const button = document.createElement('button');
        button.setAttribute('aria-expanded', 'true');
        button.className = 'expand-operation';
        button.title = 'Collapse operation';
        button.style.cssText = `
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            padding: 0 5px !important;
            opacity: 0.6 !important;
        `;
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="arrow" width="16" height="16" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M 17.418 14.908 C 17.69 15.176 18.127 15.176 18.397 14.908 C 18.667 14.64 18.668 14.207 18.397 13.939 L 10.489 6.109 C 10.219 5.841 9.782 5.841 9.51 6.109 L 1.602 13.939 C 1.332 14.207 1.332 14.64 1.602 14.908 C 1.873 15.176 2.311 15.176 2.581 14.908 L 10 7.767 L 17.418 14.908 Z"></path>
            </svg>
        `;

        header.appendChild(link);
        header.appendChild(count);
        header.appendChild(button);
        container.appendChild(header);

        const content = document.createElement('div');
        content.className = 'no-margin';
        content.style.cssText = `
            margin-left: 30px !important;
            border-left: 2px solid #e0e0e0 !important;
            padding-left: 15px !important;
        `;

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'operation-tag-content';
        content.appendChild(tagsContainer);
        container.appendChild(content);

        header.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = container.classList.contains('is-open');
            const contentEl = container.querySelector('.no-margin');
            const arrow = this.querySelector('.arrow');
            
            if (isOpen) {
                container.classList.remove('is-open');
                if (contentEl) contentEl.style.display = 'none';
                this.setAttribute('data-is-open', 'false');
                button.setAttribute('aria-expanded', 'false');
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            } else {
                container.classList.add('is-open');
                if (contentEl) contentEl.style.display = 'block';
                this.setAttribute('data-is-open', 'true');
                button.setAttribute('aria-expanded', 'true');
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        });

        containerRegistry.set(fullPath, container);

        return container;
    }

    function init() {
        containerRegistry.clear();
        document.querySelectorAll('.opblock-tag-section[data-prefix]').forEach(el => el.remove());
        setTimeout(processTags, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    const observer = new MutationObserver(() => {
        const containers = document.querySelectorAll('.opblock-tag-section[data-prefix]');
        const tags = document.querySelectorAll('.opblock-tag[data-tag*="."]');
        
        if (tags.length > 0 && containers.length === 0) {
            containerRegistry.clear();
            document.querySelectorAll('.opblock-tag-section[data-prefix]').forEach(el => el.remove());
            setTimeout(processTags, 300);
        }
    });

    const target = document.getElementById('swagger-ui');
    if (target) {
        observer.observe(target, { childList: true, subtree: true });
    }

    console.log('🚀 Обработчик группировки тегов запущен!');
})();