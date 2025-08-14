#!/bin/bash

# Configuración por defecto
DB_NAME="fidefinance"
DB_USER="root"
DB_PASS=""  # Cambiar si tienes contraseña en MySQL
BACKUP_DIR="${1:-../backups}"  # Usar parámetro o directorio por defecto
DATE=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_message $BLUE "=== Iniciando Backup de FideFinance ==="

# Verificar que mysqldump esté disponible
if ! command_exists mysqldump; then
    print_message $RED "Error: mysqldump no está instalado o no está en el PATH"
    exit 1
fi

# Crear directorio de backup si no existe
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    print_message $GREEN "Directorio de backup creado: $BACKUP_DIR"
fi

# Verificar permisos de escritura
if [ ! -w "$BACKUP_DIR" ]; then
    print_message $RED "Error: No hay permisos de escritura en $BACKUP_DIR"
    exit 1
fi

print_message $YELLOW "Configuración del backup:"
echo "  - Base de datos: $DB_NAME"
echo "  - Usuario: $DB_USER"
echo "  - Directorio destino: $BACKUP_DIR"
echo "  - Fecha: $DATE"
echo ""

# Backup de base de datos
print_message $BLUE "1. Realizando backup de la base de datos..."
DB_BACKUP_FILE="$BACKUP_DIR/fidefinance_db_backup_$DATE.sql"

if [ -z "$DB_PASS" ]; then
    # Sin contraseña
    mysqldump -u"$DB_USER" "$DB_NAME" > "$DB_BACKUP_FILE" 2>/dev/null
else
    # Con contraseña
    mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$DB_BACKUP_FILE" 2>/dev/null
fi

if [ $? -eq 0 ] && [ -s "$DB_BACKUP_FILE" ]; then
    print_message $GREEN "✓ Backup de base de datos completado: $(basename "$DB_BACKUP_FILE")"
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    print_message $BLUE "  Tamaño: $DB_SIZE"
else
    print_message $RED "✗ Error en el backup de la base de datos"
    # Eliminar archivo vacío si existe
    [ -f "$DB_BACKUP_FILE" ] && rm "$DB_BACKUP_FILE"
    exit 1
fi

# Backup de archivos del proyecto
print_message $BLUE "2. Realizando backup de archivos del proyecto..."
FILES_BACKUP_FILE="$BACKUP_DIR/fidefinance_files_backup_$DATE.tar.gz"

# Crear backup excluyendo directorios temporales y logs
cd "$PROJECT_DIR" || exit 1

tar -czf "$FILES_BACKUP_FILE" \
    --exclude='logs/*' \
    --exclude='cache/*' \
    --exclude='uploads/*' \
    --exclude='vendor/*' \
    --exclude='backups/*' \
    --exclude='.git/*' \
    --exclude='*.log' \
    --exclude='*.tmp' \
    . 2>/dev/null

if [ $? -eq 0 ] && [ -s "$FILES_BACKUP_FILE" ]; then
    print_message $GREEN "✓ Backup de archivos completado: $(basename "$FILES_BACKUP_FILE")"
    FILES_SIZE=$(du -h "$FILES_BACKUP_FILE" | cut -f1)
    print_message $BLUE "  Tamaño: $FILES_SIZE"
else
    print_message $RED "✗ Error en el backup de archivos"
    exit 1
fi

# Backup de configuración
print_message $BLUE "3. Creando backup de configuración..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/fidefinance_config_backup_$DATE.txt"

{
    echo "=== FideFinance Backup Info ==="
    echo "Fecha: $(date)"
    echo "Servidor: $(hostname)"
    echo "Usuario: $(whoami)"
    echo "Directorio proyecto: $PROJECT_DIR"
    echo "Versión PHP: $(php -v | head -n 1)"
    echo ""
    echo "=== Estructura de archivos incluidos ==="
    tar -tzf "$FILES_BACKUP_FILE" | head -20
    if [ $(tar -tzf "$FILES_BACKUP_FILE" | wc -l) -gt 20 ]; then
        echo "... y $(( $(tar -tzf "$FILES_BACKUP_FILE" | wc -l) - 20 )) archivos más"
    fi
    echo ""
    echo "=== Información de la base de datos ==="
    echo "Base de datos: $DB_NAME"
    echo "Tamaño backup DB: $DB_SIZE"
    echo "Tablas incluidas:"
    if [ -z "$DB_PASS" ]; then
        mysql -u"$DB_USER" -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | tail -n +2
    else
        mysql -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | tail -n +2
    fi
} > "$CONFIG_BACKUP_FILE"

print_message $GREEN "✓ Información de backup guardada: $(basename "$CONFIG_BACKUP_FILE")"

# Limpiar backups antiguos (mantener últimos 30)
print_message $BLUE "4. Limpiando backups antiguos (manteniendo últimos 30)..."
CLEANED=0

# Limpiar backups de DB antiguos
for file in "$BACKUP_DIR"/fidefinance_db_backup_*.sql; do
    if [ -f "$file" ]; then
        if [ $(find "$BACKUP_DIR" -name "fidefinance_db_backup_*.sql" | wc -l) -gt 30 ]; then
            rm "$file"
            CLEANED=$((CLEANED + 1))
        else
            break
        fi
    fi
done

# Limpiar backups de archivos antiguos
for file in "$BACKUP_DIR"/fidefinance_files_backup_*.tar.gz; do
    if [ -f "$file" ]; then
        if [ $(find "$BACKUP_DIR" -name "fidefinance_files_backup_*.tar.gz" | wc -l) -gt 30 ]; then
            rm "$file"
            CLEANED=$((CLEANED + 1))
        else
            break
        fi
    fi
done

if [ $CLEANED -gt 0 ]; then
    print_message $YELLOW "✓ $CLEANED backups antiguos eliminados"
else
    print_message $BLUE "✓ No hay backups antiguos para eliminar"
fi

# Generar log del backup
LOG_FILE="$BACKUP_DIR/backup.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup completado exitosamente" >> "$LOG_FILE"
echo "  - DB: $(basename "$DB_BACKUP_FILE") ($DB_SIZE)" >> "$LOG_FILE"
echo "  - Files: $(basename "$FILES_BACKUP_FILE") ($FILES_SIZE)" >> "$LOG_FILE"
echo "  - Config: $(basename "$CONFIG_BACKUP_FILE")" >> "$LOG_FILE"

# Resumen final
print_message $GREEN "=== Backup Completado Exitosamente ==="
echo "Archivos creados:"
echo "  📄 Base de datos: $(basename "$DB_BACKUP_FILE") ($DB_SIZE)"
echo "  📦 Archivos: $(basename "$FILES_BACKUP_FILE") ($FILES_SIZE)"
echo "  📋 Configuración: $(basename "$CONFIG_BACKUP_FILE")"
echo ""
echo "Ubicación: $BACKUP_DIR"
echo "Tiempo total: $(date)"

print_message $BLUE "=== Fin del Backup ==="

# Opcional: mostrar espacio disponible
AVAILABLE_SPACE=$(df -h "$BACKUP_DIR" | awk 'NR==2{print $4}')
print_message $YELLOW "Espacio disponible en destino: $AVAILABLE_SPACE"

exit 0