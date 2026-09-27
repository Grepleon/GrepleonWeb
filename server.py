from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent

handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))

with ThreadingHTTPServer(("127.0.0.1", 8000), handler) as server:
    print("Сайт запущен: http://localhost:8000")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")