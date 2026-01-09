# Script para rebuild rápido Android APK
# Ejecuta: .\quick-rebuild.ps1

Write-Host "🚀 Rebuild rápido Android APK" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. Build + Sync
Write-Host "`n📦 Building y sincronizando..." -ForegroundColor Yellow
npm run android:sync

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en build/sync" -ForegroundColor Red
    exit 1
}

# 2. Assemble APK
Write-Host "`n🔨 Generando APK..." -ForegroundColor Yellow
cd android
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
.\gradlew assembleDebug --console=plain

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al generar APK" -ForegroundColor Red
    cd ..
    exit 1
}

cd ..

# 3. Abrir carpeta del APK
Write-Host "`n✅ APK generado exitosamente!" -ForegroundColor Green
Write-Host "📂 Abriendo carpeta..." -ForegroundColor Green
explorer "android\app\build\outputs\apk\debug"

Write-Host "`n🎉 ¡Listo! Instala 'Estacion Homies 2025-debug.apk' en tu celular" -ForegroundColor Cyan
