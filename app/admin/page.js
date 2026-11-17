"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { uploadPresigned } from "@vercel/blob/client";

const CATEGORIES = [
  { id: "tree", title: "트리 PNG", english: "TREE ASSETS", note: "메인 화면에서 사용할 트리 이미지" },
  { id: "topper", title: "트리 꼭대기 장식 PNG", english: "TREE TOPPER ASSETS", note: "트리 맨 위에 고정해서 붙일 별, 리본 등의 장식 이미지" },
  { id: "background", title: "배경 PNG", english: "BACKGROUND ASSETS", note: "트리 뒤에 표시할 배경 이미지" },
  { id: "ornament", title: "오너먼트 PNG", english: "ORNAMENT ASSETS", note: "방문자가 트리에 자유롭게 달 수 있는 스티커" },
  { id: "effect", title: "반짝임 PNG", english: "SPARKLE ASSETS", note: "트리에 고정해서 겹쳐 적용할 장식 이미지" },
];

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function formatSize(size) {
  if (!size) return "";
  return size >= 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB";
}

function safeFileName(name) {
  const normalized = name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9._-]+/g, "_").replace(/_+/g, "_");
  return normalized.endsWith(".png") ? normalized : normalized + ".png";
}

function AdminAssetPreview({ asset }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={"admin-asset-preview category-" + asset.category}>
      {failed ? (
        <div className="admin-image-error">
          <strong>이미지를 불러오지 못했어요.</strong>
          <a href={asset.url} target="_blank" rel="noreferrer">사이트 이미지 주소 열기 ↗</a>
          {asset.originalUrl ? <a href={asset.originalUrl} target="_blank" rel="noreferrer">Blob 원본 주소 열기 ↗</a> : null}
        </div>
      ) : (
        <img src={asset.url} alt={asset.name} onError={() => setFailed(true)} />
      )}
    </div>
  );
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [assets, setAssets] = useState([]);
  const hasUnknownAssetUrl = assets.some((asset) => asset.accessMode === "unknown");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyCategory, setBusyCategory] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputs = useRef({});

  const totalByCategory = useMemo(() => {
    return CATEGORIES.reduce((result, category) => {
      result[category.id] = assets.filter((asset) => asset.category === category.id).length;
      return result;
    }, {});
  }, [assets]);

  const refreshAssets = async () => {
    const response = await fetch("/api/assets", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "이미지 목록을 불러오지 못했어요.");
    setAssets(data.assets || []);
  };

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (data) => {
        if (!alive) return;
        setAuthenticated(Boolean(data.authenticated));
        if (data.authenticated) {
          try { await refreshAssets(); }
          catch (loadError) { setError(loadError.message); }
        }
      })
      .catch(() => { if (alive) setError("관리자 상태를 확인하지 못했어요."); })
      .finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, []);

  const login = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "로그인하지 못했어요.");
      setAuthenticated(true);
      setPassword("");
      await refreshAssets();
      setMessage("관리자 페이지에 로그인했어요.");
    } catch (loginError) {
      setError(loginError.message || "로그인하지 못했어요.");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setAssets([]);
    setMessage("로그아웃했어요.");
  };

  const handleUpload = async (event, category) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setBusyCategory(category);
    setUploadProgress(0);
    setError("");
    setMessage("");

    let completed = 0;
    const failures = [];

    for (const file of files) {
      if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
        failures.push(file.name + ": PNG 파일만 업로드할 수 있어요.");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        failures.push(file.name + ": 파일은 15MB 이하로 올려 주세요.");
        continue;
      }

      try {
        const uniqueName = (typeof crypto !== "undefined" && crypto.randomUUID)
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(16).slice(2);
        const pathname = "assets/" + category + "/" + uniqueName + "__" + safeFileName(file.name);
        await uploadPresigned(pathname, file, {
          access: "public",
          contentType: "image/png",
          handleUploadUrl: "/api/admin/upload",
          clientPayload: JSON.stringify({ category }),
          onUploadProgress: (progress) => {
            const withinFile = progress.total ? progress.percentage : 0;
            setUploadProgress(Math.round(((completed + withinFile / 100) / files.length) * 100));
          },
        });
        completed += 1;
        setUploadProgress(Math.round((completed / files.length) * 100));
      } catch (uploadError) {
        failures.push(file.name + ": " + (uploadError.message || "업로드 실패"));
      }
    }

    try { await refreshAssets(); }
    catch (refreshError) { failures.push(refreshError.message); }

    setBusyCategory("");
    setUploadProgress(0);
    if (completed) setMessage(completed + "개의 PNG 이미지를 저장했어요. 메인 화면에도 반영됐어요.");
    if (failures.length) setError(failures.join(" "));
  };

  const deleteAsset = async (asset) => {
    if (!window.confirm("‘" + asset.name + "’ 이미지를 영구 삭제할까요? 메인 선택창에서도 사라져요.")) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname: asset.pathname }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "삭제하지 못했어요.");
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setMessage("이미지를 삭제했어요.");
    } catch (deleteError) {
      setError(deleteError.message || "이미지를 삭제하지 못했어요.");
    }
  };

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <a href="/" className="admin-brand"><span className="brand-icon">✦</span><span>MERRY TREE <b>STUDIO</b></span></a>
        <a href="/" className="back-to-site">사이트로 돌아가기 ↗</a>
      </header>

      <section className="admin-intro">
        <span className="intro-kicker">SITE ASSET MANAGEMENT</span>
        <h1>크리스마스 재료 보관함</h1>
        <p>여기에 등록한 PNG가 모든 방문자의 꾸미기 화면에 공통으로 표시돼요.</p>
      </section>

      {checking ? (
        <div className="admin-login-card"><p>관리자 정보를 확인하고 있어요.</p></div>
      ) : !authenticated ? (
        <form className="admin-login-card" onSubmit={login}>
          <span className="section-eyebrow">ADMIN ONLY</span>
          <h2>관리자 로그인</h2>
          <p>사이트 이미지 재료를 관리하려면 관리자 비밀번호를 입력해 주세요.</p>
          <label htmlFor="admin-password">관리자 비밀번호</label>
          <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력" required />
          <button className="admin-primary-button" type="submit">관리자 페이지 입장하기</button>
          <small>관리자 비밀번호는 Vercel 환경 변수 ADMIN_PASSWORD에 설정해요.</small>
          {error ? <div className="admin-error">{error}</div> : null}
        </form>
      ) : (
        <section className="admin-content">
          <div className="admin-overview">
            <div><span className="section-eyebrow">YOUR ASSET LIBRARY</span><h2>이미지 관리</h2><p>등록한 이미지가 메인 화면의 각 선택창에 자동으로 나타나요.</p></div>
            <button className="admin-logout-button" type="button" onClick={logout}>로그아웃</button>
          </div>

          <div className="admin-summary">
            {CATEGORIES.map((category) => (
              <div className="admin-summary-item" key={category.id}>
                <span>{category.title}</span><strong>{totalByCategory[category.id] || 0}</strong><small>개 등록</small>
              </div>
            ))}
          </div>

          <div className="admin-notice">
            <strong>기본 이미지 적용 방식</strong>
            <span>각 분류에서 가장 최근에 올린 이미지가 메인 화면에서 첫 번째로 선택돼요. 여러 장을 등록하면 방문자가 원하는 이미지를 직접 선택할 수 있어요.</span>
          </div>
          {hasPrivateAssetUrl ? (
            <div className="admin-notice admin-notice-warning">
              <strong>주의: 일부 Blob 이미지 주소 형식을 확인할 수 없어요.</strong>
              <span>저장소 연결을 확인해 주세요. 아래 원본 이미지 열기를 눌러 실제 주소의 응답 상태도 확인할 수 있어요.</span>
            </div>
          ) : null}

          {CATEGORIES.map((category) => {
            const categoryAssets = assets.filter((asset) => asset.category === category.id);
            return (
              <section className="admin-category" key={category.id}>
                <div className="admin-category-heading">
                  <div><span>{category.english}</span><h3>{category.title}</h3><p>{category.note}</p></div>
                  <label className={"admin-upload-button " + (busyCategory === category.id ? "disabled" : "")}>
                    <input
                      ref={(node) => { fileInputs.current[category.id] = node; }}
                      type="file"
                      accept="image/png,.png"
                      multiple
                      disabled={Boolean(busyCategory)}
                      onChange={(event) => handleUpload(event, category.id)}
                    />
                    <b>＋</b> PNG 추가
                  </label>
                </div>

                {busyCategory === category.id ? (
                  <div className="upload-progress"><span>이미지를 저장하고 있어요 · {uploadProgress}%</span><i><b style={{ width: uploadProgress + "%" }} /></i></div>
                ) : null}

                {categoryAssets.length ? (
                  <div className="admin-asset-grid">
                    {categoryAssets.map((asset) => (
                      <article className="admin-asset-card" key={asset.id}>
                        <AdminAssetPreview asset={asset} />
                        <div className="admin-asset-meta"><strong title={asset.name}>{asset.name}</strong><small>{formatSize(asset.size)}</small></div>
                        <button type="button" className="admin-delete-button" onClick={() => deleteAsset(asset)}>삭제</button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty-assets">아직 등록된 이미지가 없어요. 오른쪽 위의 PNG 추가 버튼으로 시작해 주세요.</div>
                )}
              </section>
            );
          })}
          <div className="admin-footer-note">PNG · 파일당 최대 15MB · 업로드한 파일은 Vercel Blob에 영구 보관됩니다.</div>
        </section>
      )}

      {message ? <div className="admin-toast" role="status">{message}</div> : null}
      {error && authenticated ? <div className="admin-error admin-error-floating">{error}</div> : null}
    </main>
  );
}
