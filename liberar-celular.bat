@echo off
setlocal enabledelayedexpansion
REM ============================================================
REM  Enlace - liberar acesso pelo celular (mesma rede Wi-Fi)
REM  Da um duplo-clique neste arquivo e clique SIM no aviso.
REM
REM  O aplicativo usa a porta 3007.
REM ============================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Pedindo permissao de administrador...
  powershell -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b
)

REM Descobre o IP da placa que tem a rota padrao - e o endereco que o
REM celular enxerga. Detectar e melhor do que deixar fixo no arquivo:
REM o IP muda quando o roteador reinicia ou a maquina troca de rede.
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command ^
  "$i=(Get-NetRoute -DestinationPrefix '0.0.0.0/0' ^| Sort-Object RouteMetric ^| Select-Object -First 1).InterfaceIndex; (Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $i).IPAddress"`) do set IP=%%i

netsh advfirewall firewall delete rule name="Enlace 3007" >nul 2>&1
netsh advfirewall firewall add rule name="Enlace 3007" dir=in action=allow protocol=TCP localport=3007

echo.
echo ============================================================
echo  Pronto! Porta 3007 liberada no firewall.
echo.
echo  1) Deixe o servidor rodando neste PC:
echo        npm run dev
echo     (na raiz do projeto - ele ja sobe em 0.0.0.0)
echo.
echo  2) No CELULAR, no mesmo Wi-Fi, abra:
echo.
echo        http://!IP!:3007
echo.
echo  Login de teste: ana@enlace.app  /  enlace123
echo.
echo  ATENCAO: por http, o navegador do celular BLOQUEIA camera,
echo  microfone e localizacao (so libera em https). Entao gravar
echo  audio, tirar foto pela camera e o mapa ao vivo nao vao
echo  funcionar assim. Para testar essas partes, use https com:
echo        npx ngrok http 3007
echo  e abra no celular o endereco https que o ngrok mostrar.
echo ============================================================
echo.
pause
