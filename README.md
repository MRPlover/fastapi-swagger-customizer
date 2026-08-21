# FastAPI Swagger Customizer 🎨

[![PyPI version](https://img.shields.io/pypi/v/fastapi-swagger-customizer.svg)](https://pypi.org/project/fastapi-swagger-customizer/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Кастомизируйте стандартный Swagger UI в вашем FastAPI приложении **одной строчкой кода**. Библиотека позволяет подключить собственную тему оформления, плагины для группировки эндпоинтов и кастомные цветовые схемы без сложной настройки статики.

## ✨ Особенности

* 🚀 **Подключение в одну команду** — заменяет стандартный `/docs` на ваш кастомный интерфейс.
* 📦 **Всё включено** — CSS, JS и плагины (цвета, группировка) поставляются прямо внутри пакета.
* 🧩 **Умное монтирование** — библиотека автоматически подстраивается под пути, указанные в вашем HTML.
* 🛠️ **Полная совместимость** — не ломает стандартную генерацию `openapi.json`.

## 📦 Установка

Установите пакет с помощью pip:

```bash
pip install fastapi-swagger-customizer
```

## 🚀 Быстрый старт

Просто импортируйте функцию `setup_custom_swagger` и передайте в неё ваше FastAPI приложение.

```python
from fastapi import FastAPI
from fastapi_swagger_customizer import setup_custom_swagger

app = FastAPI(
    title="My Awesome API",
    version="1.0.0",
    docs_url=None
)

# Подключаем кастомный Swagger UI одной командой!
setup_custom_swagger(app)

@app.get("/items")
def read_items():
    return {"message": "Hello World"}
```

Теперь запустите ваше приложение и перейдите по адресу `localhost/docs`. Вы увидите обновленный Swagger со стилями и плагинами!

## 🛠️ Что внутри?

Библиотека заменяет стандартный шаблон Swagger на кастомный `index.html`, в который уже встроены:
* **Индивидуальная тема оформления** (`swagger-ui.css` + `add.css`)
* **Плагин группировки роутов** (`swagger-group.js`)
* **Управление цветовой палитрой** (`swagger-color.js` и `swagger-colors-config.js`)

## 🤝 Ссылки и разработка

* **Исходный код:** [GitHub Repository](https://github.com/MRPlover/fastapi-swagger-customizer)
* **Сообщить об ошибке:** [GitHub Issues](https://github.com/MRPlover/fastapi-swagger-customizer/issues)

## 📄 Лицензия

Проект распространяется под лицензией [MIT](LICENSE).
