# Maple Wallet

Nexon Open API 기반 메이플스토리 자산관리 및 가계부 서비스입니다.

## 현재 단계

Backend initialization

## 사용 기술

- Python
- FastAPI
- Nexon Open API

## 로컬 실행 방법

1. 백엔드 디렉터리로 이동합니다.

   ```bash
   cd backend
   ```

2. 가상 환경을 만들고 활성화합니다.

   ```bash
   python -m venv .venv
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   ```

3. 의존성을 설치합니다.

   ```bash
   python -m pip install -r requirements.txt
   ```

4. 환경변수 파일을 준비합니다.

   ```bash
   Copy-Item .env.example .env
   ```

   `.env`의 `NEXON_API_KEY`에 Nexon Open API 키를 입력합니다. 실제 키는 Git에 커밋하지 않습니다.

5. 개발 서버를 실행합니다.

   ```bash
   python -m uvicorn app.main:app --reload
   ```

서버 실행 후 `http://127.0.0.1:8000/`과 `http://127.0.0.1:8000/health`에서 상태를 확인할 수 있습니다.

현재는 프로젝트 기반만 구성되어 있으며 Nexon Open API 호출 기능은 구현하지 않았습니다.
