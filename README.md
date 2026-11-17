# 메리 트리 스튜디오 (Merry Tree Studio)

관리자가 등록한 PNG 재료를 이용해 방문자가 크리스마스 트리를 꾸미는 Next.js 앱입니다.

## 메인 화면

- 관리자 페이지에 등록한 트리 PNG 중 하나를 선택
- 관리자 페이지에 등록한 배경 PNG 중 하나를 선택
- 오너먼트 PNG를 원하는 개수만큼 추가하고 드래그로 위치 조정
- 반짝임 PNG를 여러 개 선택해 트리에 고정 적용
- 완성한 트리를 1800 × 2000 PNG로 저장하거나 공유

## 관리자 페이지

주소: `/admin`

- 관리자 비밀번호로 로그인
- 트리 / 배경 / 오너먼트 / 반짝임 PNG 업로드
- 카테고리별 등록 이미지 미리보기 및 삭제
- 가장 최근 등록한 트리와 배경이 메인 화면에서 기본 선택
- PNG 파일당 최대 15MB

## Vercel 설정 (필수)

### 1. Vercel Blob 연결

1. Vercel 대시보드에서 이 프로젝트를 엽니다.
2. **Storage** 탭으로 이동합니다.
3. **Create Database → Blob**을 선택합니다.
4. Store 이름을 정하고 Access는 **Public**으로 설정합니다. 방문자의 브라우저가 이미지를 표시할 수 있어야 합니다.
5. 생성된 Blob Store를 이 프로젝트에 연결하고 Production 및 Preview 환경을 선택합니다.
6. Vercel이 프로젝트 환경 변수에 `BLOB_READ_WRITE_TOKEN`을 연결했는지 확인합니다.

### 2. 관리자 비밀번호 설정

1. 프로젝트의 **Settings → Environment Variables**로 이동합니다.
2. `ADMIN_PASSWORD` 변수를 추가합니다.
3. 관리자 페이지에 사용할 강력한 비밀번호를 값으로 입력합니다.
4. Production (필요하다면 Preview도)을 선택하고 저장합니다.
5. 변경 사항이 적용되도록 새 배포를 진행합니다.

관리자 로그인은 `https://배포주소/admin`에서 할 수 있습니다. 로그인 세션은 12시간 후 만료됩니다. 비밀번호는 코드나 브라우저에 노출되지 않습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

로컬에서 이미지 저장 기능을 테스트하려면 Vercel Blob의 `BLOB_READ_WRITE_TOKEN`과 `ADMIN_PASSWORD`를 `.env.local`에 설정해야 합니다.

## 기술 구성

- Next.js 15.5.29
- React 19.1.10
- Vercel Blob 2.9.0
- 별도 회원가입, 포인트, 사용자 계정, 데이터베이스 불필요
