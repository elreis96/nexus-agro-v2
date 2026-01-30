"""
Security middleware e utilities para FastAPI
Inclui: validação de payloads, sanitização, headers de segurança
"""
import re
from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse


# ============================================
# VALIDAÇÃO E SANITIZAÇÃO DE INPUTS
# ============================================

def sanitize_string(value: str, max_length: int = 500, allow_special: bool = False) -> str:
    """
    Sanitiza strings removendo caracteres perigosos
    """
    if not value:
        return ""
    
    # Limitar tamanho
    value = value[:max_length]
    
    # Remover null bytes e caracteres de controle
    value = value.replace('\x00', '').replace('\r', '').replace('\n', ' ')
    
    if not allow_special:
        # Remover caracteres SQL injection
        dangerous_patterns = [
            r'(\-\-)',  # SQL comments
            r'(\/\*.*\*\/)',  # SQL comments
            r'(\bOR\b.*=.*)',  # SQL OR injection
            r'(\bAND\b.*=.*)',  # SQL AND injection
            r'(\bUNION\b)',  # SQL UNION
            r'(\bSELECT\b)',  # SQL SELECT
            r'(\bINSERT\b)',  # SQL INSERT
            r'(\bUPDATE\b)',  # SQL UPDATE
            r'(\bDELETE\b)',  # SQL DELETE
            r'(\bDROP\b)',  # SQL DROP
            r'(<script.*?>)',  # XSS script tags
            r'(javascript:)',  # XSS javascript
            r'(on\w+\s*=)',  # XSS event handlers
        ]
        
        for pattern in dangerous_patterns:
            value = re.sub(pattern, '', value, flags=re.IGNORECASE)
    
    return value.strip()


def validate_email(email: str) -> str:
    """
    Valida formato de email
    """
    email = sanitize_string(email, max_length=255)
    
    # Regex simplificado para email
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email inválido"
        )
    
    return email.lower()


def validate_date_format(date_str: str) -> str:
    """
    Valida formato de data ISO (YYYY-MM-DD)
    """
    if not date_str:
        return date_str
    
    date_pattern = r'^\d{4}-\d{2}-\d{2}$'
    
    if not re.match(date_pattern, date_str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato de data inválido: {date_str}. Use YYYY-MM-DD"
        )
    
    return date_str


def validate_numeric_range(value: Any, field_name: str, min_val: float = None, max_val: float = None) -> float:
    """
    Valida que um número está dentro de um range seguro
    """
    try:
        num = float(value)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} deve ser um número válido"
        )
    
    if min_val is not None and num < min_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} deve ser maior ou igual a {min_val}"
        )
    
    if max_val is not None and num > max_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} deve ser menor ou igual a {max_val}"
        )
    
    return num


def sanitize_dict(data: Dict[str, Any], allowed_keys: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Sanitiza um dicionário removendo chaves não permitidas
    """
    if not data:
        return {}
    
    if allowed_keys:
        # Remover chaves não permitidas
        sanitized = {k: v for k, v in data.items() if k in allowed_keys}
    else:
        sanitized = data.copy()
    
    # Sanitizar valores string
    for key, value in sanitized.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_string(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, allowed_keys)
    
    return sanitized


# ============================================
# VALIDAÇÃO DE SENHA
# ============================================

def validate_password_strength(password: str) -> None:
    """
    Valida força de senha
    - Mínimo 8 caracteres
    - Pelo menos 1 maiúscula
    - Pelo menos 1 minúscula
    - Pelo menos 1 número
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve ter no mínimo 8 caracteres"
        )
    
    if not re.search(r'[A-Z]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve conter pelo menos uma letra maiúscula"
        )
    
    if not re.search(r'[a-z]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve conter pelo menos uma letra minúscula"
        )
    
    if not re.search(r'\d', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve conter pelo menos um número"
        )
    
    # Verificar senhas comuns (lista reduzida)
    common_passwords = [
        'password', '12345678', 'qwerty123', 'abc123456',
        'password123', '123456789', 'senha123', 'admin123'
    ]
    
    if password.lower() in common_passwords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha muito comum. Escolha uma senha mais forte"
        )


# ============================================
# MIDDLEWARE DE SEGURANÇA
# ============================================

async def security_headers_middleware(request: Request, call_next):
    """
    Adiciona headers de segurança HTTP
    """
    response = await call_next(request)
    connect_src = " ".join([
        "'self'",
        "https://*.supabase.co",
        "https://*.supabase.in",
        "https://*.railway.app",
        "https://*.vercel.app",
        "http://localhost:8080",
        "http://localhost:5173",
        "wss://*.supabase.co",
    ])
    
    # Headers de segurança
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # CSP básico (ajustar conforme necessário)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "img-src 'self' data: https:; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "object-src 'none'; "
        "frame-ancestors 'none'; "
        f"connect-src {connect_src};"
    )
    
    return response


# ============================================
# VALIDADORES DE PAYLOAD
# ============================================

def validate_auth_payload(payload: Dict[str, Any]) -> Dict[str, str]:
    """
    Valida payload de autenticação
    """
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload vazio"
        )
    
    email = payload.get('email')
    password = payload.get('password')
    
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email e senha são obrigatórios"
        )
    
    # Validar email
    email = validate_email(email)
    
    # Validar senha (não sanitizar, apenas verificar formato)
    if not isinstance(password, str) or len(password) > 72:  # Bcrypt max 72 bytes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha inválida"
        )
    
    return {
        'email': email,
        'password': password
    }


def validate_user_update_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Valida payload de atualização de usuário
    """
    allowed_keys = ['nome', 'email', 'role']
    sanitized = sanitize_dict(payload, allowed_keys)
    
    if 'email' in sanitized:
        sanitized['email'] = validate_email(sanitized['email'])
    
    if 'role' in sanitized:
        valid_roles = ['admin', 'gestor', 'user']
        if sanitized['role'] not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role inválida. Valores permitidos: {valid_roles}"
            )
    
    if 'nome' in sanitized:
        sanitized['nome'] = sanitize_string(sanitized['nome'], max_length=255)
        if len(sanitized['nome']) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome deve ter no mínimo 2 caracteres"
            )
    
    return sanitized
