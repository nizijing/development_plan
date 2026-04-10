@echo off
chcp 65001 >nul
echo ========================================
echo     培养管理系统 启动脚本
echo ========================================
echo.
echo 正在启动桌面应用...
echo 数据将保存在本地文件中
echo.

cd /d "%~dp0app"
npm run tauri:dev

if errorlevel 1 (
    echo.
    echo [错误] 启动失败！
    echo 请确保已安装以下环境:
    echo   1. Node.js - https://nodejs.org/
    echo   2. Rust - https://rustup.rs/
    echo.
    pause
)
