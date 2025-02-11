import os
from dotenv import load_dotenv

# 현재 파일(`config.py`)의 절대 경로 가져오기
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 실행할 환경 변수 설정 (기본값: local)
ENV_MODE = os.getenv("ENV_MODE", "local")

# 환경 변수 로드
env_file = os.path.join(BASE_DIR, f".env.{ENV_MODE}")
if os.path.exists(env_file):
    load_dotenv(dotenv_path=env_file)
    print(f"✅ 환경 파일 로드 완료: {env_file}")
else:
    raise FileNotFoundError(f"❌ 환경 파일을 찾을 수 없습니다: {env_file}")

# MySQL 연결 정보 설정
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB")

# 환경 변수 유효성 검사
if not all([MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB]):
    raise ValueError("❌ MySQL 환경 변수 값이 올바르지 않습니다. .env.aws 파일을 확인하세요.")

# SQLAlchemy 연결 URL 설정
DB_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

print(f"🔗 현재 DB 환경: {ENV_MODE} | 연결 URL: {DB_URL}")
