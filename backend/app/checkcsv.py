import pandas as pd

# ✅ 확인할 CSV 파일 경로
csv_file = "tps_cancel_models.csv"

# ✅ 파일이 잘 생성되었는지 확인
try:
    df = pd.read_csv(csv_file, encoding="utf-8-sig")  # 인코딩 확인
    print(f"✅ '{csv_file}' 파일 로드 성공! 총 {len(df)}개 행")
    print(df.head())  # 상위 5개 행 출력
except Exception as e:
    print(f"❌ 파일 로드 실패: {e}")

print(f"총 데이터 개수: {len(df)} 개")
