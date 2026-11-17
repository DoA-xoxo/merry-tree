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

function encodeOptionName(name) {
  const bytes = new TextEncoder().encode(name.trim());
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fileNameWithoutExtension(name) {
  return name.replace(/\.png$/i, "");
}

function AdminAssetPreview({ asset }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={"admin-asset-preview category-" + asset.category}>
      {failed ? (
        <div className="admin-image-error">
          <strong>이미지를 불러오지 못했어요.</strong>
          <a href={asset.url} target="_blank" rel="noreferrer">사이트 이미지 주소 열기 ↗</a>
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
  const [treeEffectAssignments, setTreeEffectAssignments] = useState({});
  const [savingTreeEffects, setSavingTreeEffects] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyCategory, setBusyCategory] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingUpload, setPendingUpload] = useState(null);
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
    const settingsResponse = await fetch("/api/admin/tree-effects", { cache: "no-store" });
    const settingsData = await settingsResponse.json();
    setTreeEffectAssignments(settingsData.assignments || {});
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

  const prepareUpload = (event, category) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const validFiles = [];
    const failures = [];
    files.forEach((file, index) => {
      if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
        failures.push(file.name + ": PNG 파일만 업로드할 수 있어요.");
      } else if (file.size > MAX_FILE_SIZE) {
        failures.push(file.name + ": 파일은 15MB 이하로 올려 주세요.");
      } else {
        validFiles.push({
          id: String(Date.now()) + "-" + index + "-" + Math.random().toString(16).slice(2),
          file,
          name: fileNameWithoutExtension(file.name).slice(0, 40),
        });
      }
    });

    setError(failures.join(" "));
    setMessage("");
    if (validFiles.length) setPendingUpload({ category, files: validFiles });
  };

  const updatePendingName = (id, name) => {
    setPendingUpload((current) => current ? ({
      ...current,
      files: current.files.map((item) => item.id === id ? { ...item, name: name.slice(0, 40) } : item),
    }) : current);
  };

  const removePendingFile = (id) => {
    setPendingUpload((current) => {
      if (!current) return current;
      const files = current.files.filter((item) => item.id !== id);
      return files.length ? { ...current, files } : null;
    });
  };

  const cancelPendingUpload = () => setPendingUpload(null);

  const confirmUpload = async () => {
    if (!pendingUpload || !pendingUpload.files.length) return;
    if (pendingUpload.files.some((item) => !item.name.trim())) {
      setError("모든 이미지의 옵션 이름을 입력해 주세요.");
      return;
    }

    const category = pendingUpload.category;
    const files = pendingUpload.files;
    setBusyCategory(category);
    setUploadProgress(0);
    setError("");
    setMessage("");

    let completed = 0;
    const failures = [];
    const remaining = [];

    for (const item of files) {
      const { file, name } = item;
      try {
        const uniqueName = (typeof crypto !== "undefined" && crypto.randomUUID)
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(16).slice(2);
        const pathname = "assets/" + category + "/" + uniqueName + "__label__" + encodeOptionName(name) + ".png";
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
        failures.push(name + ": " + (uploadError.message || "업로드 실패"));
        remaining.push(item);
      }
    }

    try { await refreshAssets(); }
    catch (refreshError) { failures.push(refreshError.message); }

    setBusyCategory("");
    setUploadProgress(0);
    setPendingUpload(remaining.length ? { category, files: remaining } : null);
    if (completed) setMessage(completed + "개의 PNG 이미지와 옵션 이름을 저장했어요. 메인 화면에도 반영됐어요.");
    if (failures.length) setError(failures.join(" "));
  };

  const toggleTreeEffect = (treeId, effectId) => {
    setTreeEffectAssignments((current) => {
      const selected = current[treeId] || [];
      const next = selected.includes(effectId) ? selected.filter((id) => id !== effectId) : selected.concat(effectId);
      return { ...current, [treeId]: next };
    });
  };

  const saveTreeEffects = async () => {
    setSavingTreeEffects(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/tree-effects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: treeEffectAssignments }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "트리별 반짝임 설정을 저장하지 못했어요.");
      setTreeEffectAssignments(data.assignments || {});
      setMessage("트리별 반짝임 연결을 저장했어요. 메인 화면에 자동 적용돼요.");
    } catch (saveError) {
      setError(saveError.message || "트리별 반짝임 설정을 저장하지 못했어요.");
    } finally {
      setSavingTreeEffects(false);
    }
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

          <section className="admin-category tree-effect-settings">
            <div className="admin-category-heading">
              <div><span>TREE & SPARKLE MATCHING</span><h3>트리별 반짝임 연결</h3><p>각 트리에 어울리는 반짝임을 여러 개 선택해 주세요. 방문자가 트리를 고르면 자동으로 적용돼요.</p></div>
              <button type="button" className="pending-confirm-button" onClick={saveTreeEffects} disabled={savingTreeEffects}>{savingTreeEffects ? "저장 중..." : "연결 설정 저장"}</button>
            </div>
            {assets.filter((asset) => asset.category === "tree").length ? (
              <div className="tree-effect-list">
                {assets.filter((asset) => asset.category === "tree").map((tree) => {
                  const effects = assets.filter((asset) => asset.category === "effect");
                  const selected = treeEffectAssignments[tree.id] || [];
                  return (
                    <div className="tree-effect-row" key={tree.id}>
                      <div className="tree-effect-name"><strong>{tree.name}</strong><small>{selected.length}개 반짝임 연결</small></div>
                      {effects.length ? (
                        <div className="tree-effect-options">
                          {effects.map((effect) => (
                            <button type="button" key={effect.id} className={"tree-effect-option " + (selected.includes(effect.id) ? "active" : "")} onClick={() => toggleTreeEffect(tree.id, effect.id)}>
                              <span className="tree-effect-check">{selected.includes(effect.id) ? "✓" : "+"}</span>{effect.name}
                            </button>
                          ))}
                        </div>
                      ) : <small className="tree-effect-empty">먼저 반짝임 PNG를 등록해 주세요.</small>}
                    </div>
                  );
                })}
              </div>
            ) : <div className="admin-empty-assets">먼저 트리 PNG를 등록하면 트리별 반짝임을 연결할 수 있어요.</div>}
          </section>

          {CATEGORIES.map((category) => {
            const categoryAssets = assets.filter((asset) => asset.category === category.id);
            return (
              <section className="admin-category" key={category.id}>
                <div className="admin-category-heading">
                  <div><span>{category.english}</span><h3>{category.title}</h3><p>{category.note}</p></div>
                  <label className={"admin-upload-button " + (busyCategory === category.id || pendingUpload ? "disabled" : "")}>
                    <input
                      ref={(node) => { fileInputs.current[category.id] = node; }}
                      type="file"
                      accept="image/png,.png"
                      multiple
                      disabled={Boolean(busyCategory) || Boolean(pendingUpload)}
                      onChange={(event) => prepareUpload(event, category.id)}
                    />
                    <b>＋</b> PNG 추가
                  </label>
                </div>

                {busyCategory === category.id ? (
                  <div className="upload-progress"><span>이미지를 저장하고 있어요 · {uploadProgress}%</span><i><b style={{ width: uploadProgress + "%" }} /></i></div>
                ) : null}

                {pendingUpload?.category === category.id ? (
                  <div className="pending-upload-panel">
                    <div className="pending-upload-heading">
                      <div><strong>옵션 이름 정하기</strong><small>메인 화면의 이미지 선택창에 표시될 이름이에요.</small></div>
                      <button type="button" onClick={cancelPendingUpload}>취소</button>
                    </div>
                    <div className="pending-upload-list">
                      {pendingUpload.files.map((item) => (
                        <div className="pending-upload-row" key={item.id}>
                          <div className="pending-file-info">
                            <span className="pending-file-icon">PNG</span>
                            <div><strong title={item.file.name}>{item.file.name}</strong><small>{formatSize(item.file.size)}</small></div>
                          </div>
                          <label className="pending-name-field">
                            <span>옵션 이름</span>
                            <input
                              type="text"
                              value={item.name}
                              maxLength={40}
                              placeholder="예: 빨간 리본"
                              onChange={(event) => updatePendingName(item.id, event.target.value)}
                            />
                          </label>
                          <button type="button" className="pending-remove-button" onClick={() => removePendingFile(item.id)} aria-label="업로드 목록에서 제거">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="pending-upload-footer">
                      <small>{pendingUpload.files.length}개 선택 · 이름은 최대 40자</small>
                      <button type="button" className="pending-confirm-button" onClick={confirmUpload} disabled={Boolean(busyCategory)}>
                        이름 저장하고 {pendingUpload.files.length}개 업로드
                      </button>
                    </div>
                  </div>
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
          <div className="admin-footer-note">PNG · 파일당 최대 15MB · 옵션 이름 최대 40자 · 업로드한 파일은 Vercel Blob에 영구 보관됩니다.</div>
        </section>
      )}

      {message ? <div className="admin-toast" role="status">{message}</div> : null}
      {error && authenticated ? <div className="admin-error admin-error-floating">{error}</div> : null}
    </main>
  );
}
