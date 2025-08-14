#!/bin/bash

# Script de Restauración para FideFinance
# Uso: ./restore.sh [archivo_db_backup.sql] [archivo_files_backup.tar.gz]

# Configuración
DB_NAME="fidefinance"
DB_USER="root"
DB_PASS=""  # Cambiar si tienes contraseña en MySQL
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

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [archivo_db_backup.sql] [archivo_files_backup.tar.gz]"
    echo ""
    echo "Ejemplos:"
    echo "  $0 backup_db.sql backup_files.tar.gz    # Restaurar ambos"
    echo "  $0 backup_db.sql                        # Solo restaurar BD"
    echo "  $0 \"\" backup_files.tar.gz               # Solo restaurar archivos"
    echo ""
    echo "Si no se proporcionan archivos, se mostrarán los backups disponibles."
}

# Función para listar backups disponibles
list_available_backups() {
    print_message $BLUE "Backups de base de datos disponibles:"
    find "$PROJECT_DIR/../backups" -name "fidefinance_db_backup_*.sql" 2>/dev/null | sort -r | head -10 | while read file; do
        if [ -f "$file" ]; then
            size=$(du -h "$file" | cut -f1)
            date=$(basename "$file" | sed 's/fidefinance_db_backup_\(.*\)\.sql/\1/')
            echo "  📄 $(basename "$file") ($size) - $date"
        fi
    done
    
    echo ""
    print_message $BLUE "Backups de archivos disponibles:"
    find "$PROJECT_DIR/../backups" -name "fidefinance_files_backup_*.tar.gz" 2>/dev/null | sort -r | head -10 | while read file; do
        if [ -f "$file" ]; then
            size=$(du -h "$file" | cut -f1)
            date=$(basename "$file" | sed 's/fidefinance_files_backup_\(.*\)\.tar\.gz/\1/')
            echo "  📦 $(basename "$file") ($size) - $date"
        fi
    done
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para confirmar acción peligrosa
confirm_action() {
    local message=$1
    print_message $YELLOW "$message"
    echo -n "¿Estás seguro? Esta acción NO se puede deshacer. Escribe 'CONFIRMAR' para continuar: "
    read confirmation
    if [ "$confirmation" != "CONFIRMAR" ]; then
        print_message $RED "Operación cancelada por el usuario."
        exit 1
    fi
}

print_message $BLUE "=== Script de Restauración FideFinance ==="

# Verificar parámetros
DB_BACKUP_FILE="$1"
FILES_BACKUP_FILE="$2"

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Si no se proporcionan archivos, mostrar backups disponibles
if [ -z "$DB_BACKUP_FILE" ] && [ -z "$FILES_BACKUP_FILE" ]; then
    list_available_backups
    echo ""
    show_help
    exit 0
fi

# Verificar que mysql esté disponible
if ! command_exists mysql; then
    print_message $RED "Error: mysql no está instalado o no está en el PATH"
    exit 1
fi

# Procesar restauración de base de datos
if [ -n "$DB_BACKUP_FILE" ] && [ "$DB_BACKUP_FILE" != '""' ]; then
    if [ ! -f "$DB_BACKUP_FILE" ]; then
        print_message $RED "Error: Archivo de backup de BD no encontrado: $DB_BACKUP_FILE"
        exit 1
    fi
    
    confirm_action "ADVERTENCIA: Esto sobrescribirá COMPLETAMENTE la base de datos '$DB_NAME' con el backup."
    
    print_message $BLUE "1. Restaurando base de datos desde: $(basename "$DB_BACKUP_FILE")"
    
    # Verificar que el archivo de backup no esté vacío
    if [ ! -s "$DB_BACKUP_FILE" ]; then
        print_message $RED "Error: El archivo de backup está vacío"
        exit 1
    fi
    
    # Crear backup de seguridad de la BD actual
    SAFETY_BACKUP="$PROJECT_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).sql"
    print_message $YELLOW "Creando backup de seguridad de la BD actual..."
    
    if [ -z "$DB_PASS" ]; then
        mysqldump -u"$DB_USER" "$DB_NAME" > "$SAFETY_BACKUP" 2>/dev/null
    else
        mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$SAFETY_BACKUP" 2>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✓ Backup de seguridad creado: $(basename "$SAFETY_BACKUP")"
    else
        print_message $YELLOW "⚠ No se pudo crear backup de seguridad (la BD podría no existir)"
        rm -f "$SAFETY_BACKUP" 2>/dev/null
    fi
    
    # Restaurar base de datos
    print_message $BLUE "Restaurando base de datos..."
    
    if [ -z "$DB_PASS" ]; then
        mysql -u"$DB_USER" "$DB_NAME" < "$DB_BACKUP_FILE" 2>/dev/null
    else
        mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$DB_BACKUP_FILE" 2>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✓ Base de datos restaurada exitosamente"
        
        # Verificar tablas restauradas
        if [ -z "$DB_PASS" ]; then
            TABLE_COUNT=$(mysql -u"$DB_USER" -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | wc -l)
        else
            TABLE_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | wc -l)
        fi
        
        print_message $BLUE "  Tablas restauradas: $((TABLE_COUNT - 1))"
    else
        print_message $RED "✗ Error al restaurar la base de datos"
        
        # Intentar restaurar backup de seguridad
        if [ -f "$SAFETY_BACKUP" ]; then
            print_message $YELLOW "Intentando restaurar backup de seguridad..."
            if [ -z "$DB_PASS" ]; then
                mysql -u"$DB_USER" "$DB_NAME" < "$SAFETY_BACKUP"
            else
                mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SAFETY_BACKUP"
            fi
        fi
        exit 1
    fi
fi

# Procesar restauración de archivos
if [ -n "$FILES_BACKUP_FILE" ] && [ "$FILES_BACKUP_FILE" != '""' ]; then
    if [ ! -f "$FILES_BACKUP_FILE" ]; then
        print_message $RED "Error: Archivo de backup de archivos no encontrado: $FILES_BACKUP_FILE"
        exit 1
    fi
    
    confirm_action "ADVERTENCIA: Esto sobrescribirá los archivos del proyecto en '$PROJECT_DIR'."
    
    print_message $BLUE "2. Restaurando archivos desde: $(basename "$FILES_BACKUP_FILE")"
    
    # Verificar que el archivo tar sea válido
    if ! tar -tzf "$FILES_BACKUP_FILE" >/dev/null 2>&1; then
        print_message $RED "Error: El archivo de backup de archivos está corrupto"
        exit 1
    fi
    
    # Crear backup de seguridad de archivos importantes
    SAFETY_FILES_BACKUP="$PROJECT_DIR/safety_files_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    print_message $YELLOW "Creando backup de seguridad de archivos importantes..."
    
    cd "$PROJECT_DIR" || exit 1
    tar -czf "$SAFETY_FILES_BACKUP" \
        config/ \
        *.php \
        *.md \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✓ Backup de seguridad de archivos creado: $(basename "$SAFETY_FILES_BACKUP")"
    fi
    
    # Restaurar archivos
    print_message $BLUE "Extrayendo archivos..."
    
    cd "$PROJECT_DIR" || exit 1
    tar -xzf "$FILES_BACKUP_FILE" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✓ Archivos restaurados exitosamente"
        
        # Contar archivos restaurados
        FILE_COUNT=$(tar -tzf "$FILES_BACKUP_FILE" | wc -l)
        print_message $BLUE "  Archivos restaurados: $FILE_COUNT"
        
        # Restaurar permisos
        print_message $BLUE "Configurando permisos..."
        chmod -R 755 . 2>/dev/null
        chmod -R 777 logs cache uploads 2>/dev/null
        
        print_message $GREEN "✓ Permisos configurados"
    else
        print_message $RED "✗ Error al extraer archivos"
        exit 1
    fi
fi

# Verificación post-restauración
print_message $BLUE "3. Verificando restauración..."

# Verificar conexión a BD
if [ -n "$DB_BACKUP_FILE" ] && [ "$DB_BACKUP_FILE" != '""' ]; then
    if [ -z "$DB_PASS" ]; then
        mysql -u"$DB_USER" -e "USE $DB_NAME; SELECT 'OK' as status;" 2>/dev/null >/dev/null
    else
        mysql -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT 'OK' as status;" 2>/dev/null >/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✓ Conexión a base de datos verificada"
    else
        print_message $RED "✗ Error en la conexión a base de datos"
    fi
fi

# Verificar archivos clave
if [ -n "$FILES_BACKUP_FILE" ] && [ "$FILES_BACKUP_FILE" != '""' ]; then
    KEY_FILES=("config/database.php" "api/login.php" "models/User.php")
    for file in "${KEY_FILES[@]}"; do
        if [ -f "$PROJECT_DIR/$file" ]; then
            print_message $GREEN "✓ $file restaurado"
        else
            print_message $YELLOW "⚠ $file no encontrado"
        fi
    done
fi

# Log de la restauración
LOG_DIR="$PROJECT_DIR/logs"
[ ! -d "$LOG_DIR" ] && mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/restore.log"

{
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Restauración completada"
    [ -n "$DB_BACKUP_FILE" ] && echo "  - BD desde: $DB_BACKUP_FILE"
    [ -n "$FILES_BACKUP_FILE" ] && echo "  - Archivos desde: $FILES_BACKUP_FILE"
    echo "  - Usuario: $(whoami)"
    echo "  - Directorio: $PROJECT_DIR"
} >> "$LOG_FILE"

# Resumen final
print_message $GREEN "=== Restauración Completada ==="
[ -n "$DB_BACKUP_FILE" ] && [ "$DB_BACKUP_FILE" != '""' ] && echo "✓ Base de datos restaurada desde: $(basename "$DB_BACKUP_FILE")"
[ -n "$FILES_BACKUP_FILE" ] && [ "$FILES_BACKUP_FILE" != '""' ] && echo "✓ Archivos restaurados desde: $(basename "$FILES_BACKUP_FILE")"
echo ""
print_message $BLUE "Siguiente paso: Verifica que la aplicación funcione correctamente"
print_message $YELLOW "Los backups de seguridad se mantuvieron en caso de problemas"

exit 0