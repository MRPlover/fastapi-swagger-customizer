import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

class SwaggerCustomizer:
    # 1. Меняем дефолтное значение на "/swagger/static"
    def __init__(self, app: FastAPI, static_url: str = "/swagger/static"):
        self.app = app
        self.static_url = static_url
        self.package_dir = Path(__file__).resolve().parent
        
    def setup(self):
        """Подключает кастомный Swagger одной командой"""
        templates_dir = self.package_dir / "templates"
        static_dir = templates_dir / "static"
        
        # Нормализуем путь до вида "/swagger/static"
        url = f"/{self.static_url.strip('/')}"
        
        if static_dir.exists() and static_dir.is_dir():
            self.app.mount(
                url,
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
                html_content = index_path.read_text(encoding="utf-8")
                return HTMLResponse(content=html_content, status_code=200)
            
            from fastapi.openapi.docs import get_swagger_ui_html
            return get_swagger_ui_html(
                openapi_url=self.app.openapi_url,
                title=self.app.title + " - Swagger UI"
            )
        
        return self.app


# 2. В функции ТАКЖЕ меняем дефолтное значение на "/swagger/static"
def setup_custom_swagger(app: FastAPI, static_url: str = "/swagger/static"):
    """
    Одна команда для подключения кастомного Swagger UI
    

    
    Args:
        app: FastAPI приложение
        static_url: URL для статики (по умолчанию /swagger-static)
    
    Returns:
        FastAPI приложение с подключенным кастомным Swagger
    
    Example:
        >>> from fastapi import FastAPI
        >>> from fastapi_swagger_customizer import setup_custom_swagger
        >>> 
        >>> app = FastAPI()
        >>> setup_custom_swagger(app)  # Одна команда!
    """
    customizer = SwaggerCustomizer(app, static_url)
    return customizer.setup()