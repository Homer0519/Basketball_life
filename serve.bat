@echo off
cd /d "%~dp0"
echo 篮球人生 本地服务器: http://127.0.0.1:8848
start http://127.0.0.1:8848
python serve_proxy.py
pause
