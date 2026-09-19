import base64, hashlib, hmac, json, os, time
from fastapi import Depends, Header, HTTPException, status

JWT_SECRET = os.getenv('HEAL6_JWT_SECRET', 'change-this-heal6-secret-in-production').encode()
JWT_TTL_SECONDS = int(os.getenv('HEAL6_JWT_TTL_SECONDS', '86400'))

def _b64(data: bytes) -> str: return base64.urlsafe_b64encode(data).decode().rstrip('=')
def _unb64(s: str) -> bytes: return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))

def sign_token(user_id: int, email: str) -> str:
    header = _b64(b'{"alg":"HS256","typ":"JWT"}')
    payload = _b64(json.dumps({'sub': str(user_id), 'email': email, 'iat': int(time.time()), 'exp': int(time.time()) + JWT_TTL_SECONDS}, separators=(',', ':')).encode())
    signing = f'{header}.{payload}'.encode()
    sig = _b64(hmac.new(JWT_SECRET, signing, hashlib.sha256).digest())
    return f'{header}.{payload}.{sig}'

def verify_token(token: str) -> dict:
    try:
        header, payload, sig = token.split('.')
        expected = _b64(hmac.new(JWT_SECRET, f'{header}.{payload}'.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected): raise ValueError('invalid signature')
        data = json.loads(_unb64(payload));
        if int(data.get('exp', 0)) < int(time.time()): raise ValueError('expired')
        return data
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired access token')

async def current_user(authorization: str | None = Header(default=None)) -> int:
    if not authorization or not authorization.lower().startswith('bearer '): raise HTTPException(status_code=401, detail='Authentication required')
    data = verify_token(authorization.split(' ',1)[1].strip())
    return int(data['sub'])

def hash_password(password: str) -> str:
    salt = os.urandom(16); digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 120_000)
    return f'{_b64(salt)}${_b64(digest)}'

def verify_password(password: str, encoded: str) -> bool:
    try:
        salt_b64, digest_b64 = encoded.split('$',1)
        expected = _unb64(digest_b64); actual = hashlib.pbkdf2_hmac('sha256', password.encode(), _unb64(salt_b64), 120_000)
        return hmac.compare_digest(actual, expected)
    except Exception: return False
