from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from config import DB_URL

# 1️⃣ 데이터베이스 엔진 생성
engine = create_engine(
    DB_URL,
    echo=False,
    pool_size=50,         # 최대 연결 수 증가
    max_overflow=20,      # 추가 커넥션 가능 개수 증가
    pool_recycle=1800,    # 연결 재활용 시간 조정
    pool_pre_ping=True
)

# 2️⃣ 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3️⃣ Base 클래스 선언 (모든 모델이 상속받음)
Base = declarative_base()

# 4️⃣ DB 세션 관리 함수 (FastAPI 의존성 주입용)
def get_db():
    db = SessionLocal()  # 새로운 DB 세션 생성
    try:
        yield db  # 세션 반환 (API에서 사용 가능)
    finally:
        db.close()  # 요청 완료 후 세션 종료

# 5️⃣ 컨텍스트 매니저 지원 (백그라운드 작업용)
@contextmanager
def db_session():
    """with 문을 사용한 안전한 DB 세션 컨텍스트 매니저"""
    db = SessionLocal()
    try:
        yield db
        db.commit()  # 정상 처리 시 커밋
    except Exception as e:
        db.rollback()  # 오류 발생 시 롤백
        raise e  # 예외 재발생
    finally:
        db.close()  # 세션 종료
