from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from config import DB_URL

# 1️⃣ 데이터베이스 엔진 생성
engine = create_engine(
    DB_URL,
    echo=False,           # SQL 실행 로깅 (필요하면 True로 변경)
    pool_size=20,         # 최대 커넥션 수 (디폴트는 5, 성능 개선을 위해 증가)
    max_overflow=10,      # 초과 허용 커넥션 수
    pool_recycle=1800,    # 30분마다 커넥션 재활용
    pool_pre_ping=True    # DB 연결 체크 (죽은 커넥션 자동 종료)
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
