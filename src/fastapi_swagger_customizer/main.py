import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from jinja2 import Template

logger = logging.getLogger(__name__)

class SwaggerCustomizer:
    def __init__(self, app: FastAPI, static_url: str = "/swagger/static", **kwargs):
        self.app = app
        self.static_url = f"/{static_url.strip('/')}"
        self.package_dir = Path(__file__).resolve().parent
        self.config = kwargs
        
    def setup(self):
        """Подключает кастомный Swagger одной командой"""
        templates_dir = self.package_dir / "templates"
        static_dir = templates_dir / "static"
        
        if static_dir.exists() and static_dir.is_dir():
            self.app.mount(
                self.static_url,
                StaticFiles(directory=str(static_dir)),
                name="swagger-static"
            )
        else:
            raise FileNotFoundError(
                f"[FastAPI Swagger Customizer] Критическая ошибка: "
                f"Директория со статикой не найдена по пути: {static_dir}"
            )
        
        @self.app.get("/docs", include_in_schema=False)
        async def custom_swagger_ui_html():
            index_path = templates_dir / "index.html"
            
            if index_path.exists():
                template_raw = index_path.read_text(encoding="utf-8")
                template = Template(template_raw)
                
                html_content = template.render(
                    static_url=self.static_url,
                    config=self.config
                )
                return HTMLResponse(content=html_content, status_code=200)
            
            from fastapi.openapi.docs import get_swagger_ui_html
            return get_swagger_ui_html(
                openapi_url=self.app.openapi_url,
                title=self.app.title + " - Swagger UI"
            )
        
        return self.app


def setup_custom_swagger(
    app: FastAPI, 
    static_url: str = "/swagger/static", 
    **kwargs
):
    """
    Подключает кастомный Swagger UI к вашему FastAPI приложению одной командой.

    Args:
        app (FastAPI): Экземпляр вашего FastAPI приложения.
        static_url (str): URL-путь для монтирования статических файлов (по умолчанию "/swagger/static").
        **kwargs: Дополнительные параметры конфигурации UI и плагинов:
            
            * **include_groups** (bool): Включить/выключить плагин группировки роутов. По умолчанию True.
            * **include_colors** (bool): Включить/выключить кастомную палитру цветов. По умолчанию True.

    Returns:
        FastAPI: Измененный экземпляр приложения с настроенным кастомным Swagger.

    Examples:
        >>> # Базовое подключение (всё включено)
        >>> setup_custom_swagger(app)
        >>> 
        >>> # Отключение плагина группировки и смена темы оформления
        >>> setup_custom_swagger(
        ...     app, 
        ...     include_groups=False
        ... )
    """
    customizer = SwaggerCustomizer(app, static_url, **kwargs)
    return customizer.setup()