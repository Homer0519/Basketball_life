@echo off
cd /d "%~dp0"
echo 篮球人生 本地服务器: http://127.0.0.1:8848
echo 按 Ctrl+C 停止服务器
start http://127.0.0.1:8848
:loop
python serve_proxy.py
echo 服务器已停止。3秒后重启...
timeout /t 3 /nobreak >nul
goto loop
