# 메리 트리 스튜디오 (Merry Tree Studio)

관리자가 등록한 PNG 재료를 이용해 방문자가 크리스마스 트리를 꾸미는 Next.js 앱입니다.

## 메인 화면

- 관리자 페이지에 등록한 트리 PNG 중 하나를 선택
- 트리 꼭대기 장식 PNG 중 하나를 골라 나무 맨 위에 고정 적용하거나 사용 안 함 선택
- 관리자 페이지에 등록한 배경 PNG 중 하나를 선택
- 오너먼트 PNG를 원하는 개수만큼 추가하고 드래그로 위치 조정
- 반짝임 PNG를 여러 개 선택해 트리에 고정 적용
- 완성한 트리를 1800 × 2000 PNG로 저장하거나 공유

## 관리자 페이지

주소: `/admin`

- 관리자 비밀번호로 로그인
- 트리 / 트리 꼭대기 장식 / 배경 / 오너먼트 / 반짝임 PNG 업로드
- 카테고리별 등록 이미지 미리보기 및 삭제
- 가장 최근 등록한 트리와 배경이 메인 화면에서 기본 선택
- PNG 파일당 최대 15MB

## Vercel 설정 (필수)

### 1. Vercel Blob 연결

1. Vercel 대시보드에서 `merry-tree` 프로젝트를 엽니다.
2. **Storage** 탭에서 생성한 Blob Store를 선택합니다.
3. Blob Store의 Access가 **Public**인지 확인합니다. 이미지가 메인 사이트 방문자에게 직접 표시되어야 하므로 Public이어야 합니다.
4. Blob Store의 **Projects** 탭에서 `merry-tree` 프로젝트가 연결되어 있는지 확인합니다.
5. 프로젝트의 연결 환경에 **Production**이 포함되어 있어야 합니다. Preview 배포에서도 사용하려면 Preview도 선택합니다.
6. OIDC 기본 연결은 다음 변수를 자동으로 제공합니다.
   - `BLOB_STORE_ID`
   - `VERCEL_OIDC_TOKEN`
   - `BLOB_WEBHOOK_PUBLIC_KEY`
7. 이 프로젝트는 `handleUploadPresigned`를 사용하므로 OIDC 연결로 업로드할 수 있습니다. 별도의 `BLOB_READ_WRITE_TOKEN`은 필요하지 않습니다.

프로젝트가 이미 연결되어 있다는 메시지가 나오면 중복 연결을 만들 필요가 없습니다. Blob Store의 **Projects** 탭에서 기존 `merry-tree` 연결 오른쪽의 메뉴(⋯) → **Update Project Connection**을 열고 Production 환경이 선택되어 있는지 확인한 다음 저장합니다.

### 2. 관리자 비밀번호 설정

1. 프로젝트의 **Settings → Environment Variables**로 이동합니다.
2. `ADMIN_PASSWORD` 변수를 추가합니다.
3. 관리자 페이지에 사용할 강력한 비밀번호를 값으로 입력합니다.
4. Production을 선택하고 저장합니다. Preview 배포에서 관리자 기능도 테스트할 경우 Preview도 선택합니다.
5. 변경 사항이 적용되도록 새 배포를 진행합니다.

관리자 로그인은 `https://배포주소/admin`에서 할 수 있습니다. 로그인 세션은 12시간 후 만료됩니다. 비밀번호는 코드나 브라우저에 노출되지 않습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

로컬 개발에서는 Vercel OIDC 연결 변수가 자동으로 주입되지 않으므로 `vercel link` 후 `vercel env pull`로 Development 환경 변수를 가져와야 합니다.

## 기술 구성

- Next.js 15.5.29
- React 19.1.10
- Vercel Blob 2.9.0
- OIDC 기반 Blob 접근 및 Presigned PNG 업로드
- 사이트 내부 이미지 API가 Blob에서 PNG를 스트리밍해 브라우저의 교차 출처 이미지 표시 문제를 방지
- 관리자 업로드 이미지는 메인 화면에서 모든 방문자에게 표시되는 사이트 공개 재료로 사용
- 별도 방문자 회원가입, 포인트, 사용자 계정, 데이터베이스 불필요
