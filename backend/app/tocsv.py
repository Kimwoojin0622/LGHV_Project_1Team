import pandas as pd
from sqlalchemy import create_engine
import config  # config.py에서 DB 정보 불러오기

# MySQL 연결
engine = create_engine(config.DB_URL)

# ✅ 테이블명 변경하여 다른 테이블도 저장 가능
table = "tps_cancel_models"
query = f"SELECT * FROM {table}"

# ✅ Chunk 크기 설정 (한 번에 가져올 행 수)
chunksize = 100000  # 필요하면 더 작은 크기(50000)로 조절

# ✅ CSV 파일명 지정
output_file = f"{table}.csv"

# ✅ Chunk 단위로 데이터를 읽어 CSV에 저장
first_chunk = True
for chunk in pd.read_sql(query, engine, chunksize=chunksize):
    chunk.to_csv(output_file, index=False, encoding="utf-8-sig", mode="a", header=first_chunk)
    first_chunk = False  # 첫 번째 chunk 이후부터는 헤더 제거
    print(f"🔹 {len(chunk)}개 행 저장 완료...")

print(f"✅ {table}.csv 저장 완료!")
