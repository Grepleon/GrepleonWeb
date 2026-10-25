from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent

# Всё, что можно отдавать наружу (первый сегмент пути)
ALLOWED = {"index.html", "404.html", "styles", "scripts", "res", "projects", "Grepleon 2026.08 logo150.png"}

class Handler(SimpleHTTPRequestHandler):
    def _allowed(self):
        path = unquote(urlsplit(self.path).path)
        parts = [p for p in path.split("/") if p]
        return not parts or parts[0] in ALLOWED   # "/" разрешён

    def do_GET(self):
        if not self._allowed():
            return self.send_error(404)
        super().do_GET()

    def do_HEAD(self):
        if not self._allowed():
            return self.send_error(404)
        super().do_HEAD()

    def list_directory(self, path):
        # Запрещаем показ содержимого папок
        self.send_error(404)
        return None

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            page = ROOT / "404.html"
            if page.exists():
                body = page.read_bytes()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(body)
                return
        super().send_error(code, message, explain)

handler = partial(Handler, directory=str(ROOT))
ip = "192.168.1.99"
port = 8011
with ThreadingHTTPServer((ip, port), handler) as server:
    print("Сайт запущен:", "http://" + ip + ":" + str(port))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")