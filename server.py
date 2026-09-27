import ipaddress
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import requests

response = requests.get("https://api.ipify.org?format=json", timeout=10)
response.raise_for_status()
ip_data = response.json()

print(f"Ваш внешний IP-адрес: {ip_data['ip']}")

ROOT = Path(__file__).resolve().parent

handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))

ip = "127.0.0.1"

with ThreadingHTTPServer(("192.168.1.99", 8011), handler) as server:
    print("Сайт запущен: http://localhost:8011")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")