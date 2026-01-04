@echo off
chcp 65001 > nul
echo Whness 서비스를 시작합니다...
echo.
cd /d "c:\Users\jungindae\Desktop\whness"

echo 브라우저를 엽니다: http://localhost:3000
start http://localhost:3000

echo.
echo 서버를 시작합니다...
npm run dev

pause
