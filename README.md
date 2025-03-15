# 고객 해지 위험 예측 서비스 구축 프로젝트

## C.P.
<div align="center">
  <img src="https://github.com/user-attachments/assets/e7eded8e-3b33-4abc-be73-62ee340c8e96">
</div>

## 🙌 팀원 소개
<div style="display: flex; justify-content: center;">
<table style="border-collapse: collapse; width:80%; text-align: center; border: 1px solid white;">
    <tr style="background-color: #222; color: white;">
        <th>이름</th>
        <th>역할</th>
    </tr>
    <tr>
        <td>김우진(조장)</td>
        <td>데이터 EDA, 데이터 전처리, 모델링, Front-end, 최종 발표</td>
    </tr>
    <tr>
        <td>김승휴</td>
        <td>데이터 EDA, Front-end, Server, 파이프라인 구축</td>
    </tr>
    <tr>
        <td>변수민</td>
        <td>데이터 EDA, 데이터 전처리, 모델링, Back-end</td>
    </tr>
    <tr>
        <td>이진식</td>
        <td>데이터 EDA, 모델링, DB, Back-end</td>
    </tr>
</table>
</div>

## 📌 CONTENTS
- 프로젝트 개요
- 프로젝트 결과물 (시연 영상)
- 프로젝트 목표
- 기대 효과
- 주요 기능
- 기술 스택
[서비스 아키텍쳐](#📝-서비스-아키텍쳐)
[프로젝트 수행 내용](#✅-프로젝트-수행-내용)

## 💻 프로젝트 개요
- 본 프로젝트는 LG헬로비전 DX DATA SCHOOL 3기 최종 프로젝트로 진행되었으며, LG헬로비전의 실무 데이터를 활용하여 고객 이탈 문제를 해결하는데 초점을 맞췄습니다.
- 유료 방송 시장에서 LG헬로비전의 고객 이탈이 증가하고, 매출이 감소하는 문제를 해결하기 위해, 고객 해지 위험 예측 시스템을 구축하였습니다.
- 이를 통해 <B>해지 가능성이 높은 고객을 사전에 식별하고, 주요 해지 요인을 분석하여 보다 전략적인 의사결정을 지원합니다.</B>

## 🔗 프로젝트 결과물
👉 시연 영상 : https://www.youtube.com/watch?v=qEpQOe5TlsI

## 🎯 프로젝트 목표
1. 해지율 예측 모델 개발
   - 고객 데이터를 분석하여 해지 가능성을 예측하는 최적의 머신러닝 or 딥러닝 모델 개발
2. 위험 고객 조기 식별 및 대응 전략 수립
   - 해지 가능성이 높은 고객군을 사전에 분류하여 위험군 분석 제공
   - 모델이 판단한 주요 해지 요인을 분석하여 맞춤형 대응 전략 제안
3. 데이터 기반 고객 유지율 향상
   - 고객 해지 패턴을 분석하여 고객 유지 전략 수립
   - 각 고객의 주요 해지 요인을 분석하여 맞춤형 마케팅 전략을 제공
4. 웹 서비스 개발 및 배포
   - React와 FastAPI를 활용한 웹 어플리케이션 개발
   - FastAPI 기반 RESTful API를 구축하여 React 프론트엔드와 연동
   - AWS EC2 환경에서 웹 서비스 배포 및 운영
5. 실시간 데이터 파이프라인 구축
   - Apache Airflow를 활용한 자동화된 데이터 수집 및 전처리, 모델링 시스템 구축
   - 데이터베이스에서 데이터를 관리하고 API를 통해 프론트엔드 및 백엔드 연동

## 🚀 기대 효과
1. 마케팅 비용 절감 효과
   - 사전 예측 · 분석 모델을 통해 고객 이탈 가능성이 높은 대상을 선별 후 집중 관리
   - 불필요한 대규모 전방위 마케팅이 아닌, 정밀 타겟팅으로 전환
2. ROI(투자 대비 수익)개선
   - 고비용 · 저효율 마케팅을 줄이고, 해지 위험 고객의 재방문 및 재구매 유도
   - 해지율 감소 + 고객 평생가치(LTV)상승 -> ROI 대폭 개선
3. 월별 이탈률 및 위험도 실시간 모니터링
   - 월별 이탈률 및 위험도 실시간 모니터링
   - 적기에 맞춤형 프로모션과 혜택 제안 -> 고객 이탈 방지

## 💥 주요 기능
### 월별 고객 대시보드 📊
- 고객 유지율, 해지율, 신규 가입자 수 시각화
- 위험군 고객군 분류(주의/위험/매우 위험)
### 해지 예측 및 주요 요인 분석
- 해지 예측 모델을 통한 고객별 해지 가능성 분석
- 주요 해지 요인 분석 (상품, 약정 기간, 상담 내역 등)
### 고객 검색 및 상세 조회 🧐
- 개별 고객의 과거 이용 내역 및 해지 위험도 분석
- 중요 Feature 별 영향도 및 계약 상태 확인 가능
### 마케팅 대응 전략
- 해지 가능성이 높은 고객에게 맞춤형 할인/혜택 제안

## 🛠 기술 스택
### Front-end
- React.js (Next.js 기반)
- TypeScript

### Backend
- FastAPI
- SQLAlchemy
- RESTful API

### DB
- MySQL
- AWS - RDS

### 모델링
- scikit-learn
- Tensorflow
- LightGBM, XGBoost, CatBoost
- AutoGluon
- MLP

### 데이터 처리 및 자동화
- python, Pandas, Numpy
- Apache Airflow

### 배포
- AWS EC2 (Ubuntu)

### 협업 도구
- Notion
- Slack
- Github, Git(버전 관리)

## 📝 서비스 아키텍쳐
<div align="center">
  <img src="https://github.com/user-attachments/assets/c081ea78-8c72-4eab-b956-616165d50fee">
</div>
<b>📌 Backend : FastAPI<br>📌 Database : MySQL<br>📌 Frontend : React.js (Next.js 기반)<br>📌 Model : LightGBM (LGBM)<br>📌 API : RESTful API (FastAPI + SQLAlchemy)</b>

## ✅ 프로젝트 수행 내용
  - 데이터 수집 및 전처리
  - 모델 개발 및 성능 평가
  - API 및 웹 서비스 개발
  - 배포 및 운영






