@echo off
echo ========================================================
echo Demarrage du serveur PostgreSQL pour le SaaS Beaute
echo Base de donnees : salon_beaute_db
echo Port : 5432
echo ========================================================
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "%~dp0database\pgdata" -l "%~dp0database\postgres.log" start
echo.
echo Serveur PostgreSQL demarre avec succes !
echo Vous pouvez maintenant ouvrir pgAdmin 4 et vous connecter.
pause
