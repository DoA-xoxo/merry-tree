"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const GROUPS = [
  { id: "tree", title: "트리 이미지", description: "관리자가 등록한 트리 중 하나를 선택해요." },
  { id: "topper", title: "트리 꼭대기 장식", description: "나무 맨 위에 고정해서 붙이는 장식이에요." },
  { id: "background", title: "배경 이미지", description: "트리 뒤에 깔릴 배경을 선택해요." },
  { id: "ornament", title: "오너먼트", description: "이미지를 누르면 트리에 장식이 추가돼요." },
  { id: "effect", title: "반짝임 이미지", description: "트리에 고정해서 적용하는 반짝임이에요." },
];

async function createPngBlob(svgElement) {
  const clone = svgElement.cloneNode(true);
  clone.querySelectorAll(".selection-outline").forEach((node) => node.remove());
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "1800");
  clone.setAttribute("height", "2000");

  const source = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = objectUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("이미지를 불러오지 못했어요. PNG 주소의 공개 권한을 확인해 주세요."));
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1800;
    canvas.height = 2000;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지 캔버스를 만들 수 없어요.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("PNG 변환에 실패했어요."));
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function TreeCanvas({ svgRef, background, tree, topper, effects, ornaments, selectedId, onImageError, onPointerDown, onPointerMove, onPointerUp }) {
  return (
    <svg
      ref={svgRef}
      className="tree-scene"
      viewBox="0 0 900 1000"
      xmlns="http://www.w3.org/2000/svg"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <rect width="900" height="1000" fill="#f5f0e7" />
      {background ? (
        <image href={background.url} x="0" y="0" width="900" height="1000" preserveAspectRatio="xMidYMid slice" onError={() => onImageError(background)} />
      ) : (
        <g>
          <rect width="900" height="1000" fill="#f2eee5" />
          <path d="M0 880 Q220 840 450 880 T900 870 V1000 H0Z" fill="#e6ded0" opacity=".55" />
        </g>
      )}
      {tree ? (
        <image href={tree.url} crossOrigin="anonymous" x="55" y="45" width="790" height="900" preserveAspectRatio="xMidYMid meet" onError={() => onImageError(tree)} />
      ) : null}
      {effects.map((item) => (
        <image key={item.id} href={item.url} crossOrigin="anonymous" x="55" y="45" width="790" height="900" preserveAspectRatio="xMidYMid meet" pointerEvents="none" onError={() => onImageError(item)} />
      ))}
      {tree && topper ? (
        <image href={topper.url} crossOrigin="anonymous" x="365" y="8" width="170" height="170" preserveAspectRatio="xMidYMid meet" pointerEvents="none" onError={() => onImageError(topper)} />
      ) : null}
      {ornaments.map((item) => (
        <g
          key={item.id}
          transform={"translate(" + item.x + " " + item.y + ")"}
          onPointerDown={(event) => onPointerDown(event, item.id)}
          style={{ cursor: "grab", touchAction: "none" }}
        >
          <image
            href={item.url}
            crossOrigin="anonymous"
            x={-item.size / 2}
            y={-item.size / 2}
            width={item.size}
            height={item.size}
            preserveAspectRatio="xMidYMid meet"
            onError={() => onImageError(item)}
          />
          {selectedId === item.id ? (
            <circle className="selection-outline" r={item.size * 0.68} fill="none" stroke="#a96c57" strokeWidth="4" strokeDasharray="9 7" />
          ) : null}
        </g>
      ))}
    </svg>
  );
}

function AssetChoice({ item, active, onClick, compact = false }) {
  const [failed, setFailed] = useState(false);
  return (
    <button type="button" className={"asset-choice " + (active ? "active" : "") + (compact ? " compact" : "")} onClick={onClick}>
      <span className="asset-choice-thumb">
        {failed ? <span className="asset-image-failed">이미지<br/>불러오기 실패</span> : <img src={item.url} alt="" onError={() => setFailed(true)} />}
      </span>
      <span className="asset-choice-name">{item.name || "이름 없는 PNG"}</span>
      {active ? <span className="asset-choice-check">✓</span> : null}
    </button>
  );
}

export default function Home() {
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetError, setAssetError] = useState("");
  const [imageErrorDetails, setImageErrorDetails] = useState([]);
  const [treeId, setTreeId] = useState("");
  const [topperId, setTopperId] = useState("");
  const [backgroundId, setBackgroundId] = useState("");
  const [ornaments, setOrnaments] = useState([]);
  const [activeEffects, setActiveEffects] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const serialRef = useRef(0);

  const trees = useMemo(() => assets.filter((item) => item.category === "tree"), [assets]);
  const toppers = useMemo(() => assets.filter((item) => item.category === "topper"), [assets]);
  const backgrounds = useMemo(() => assets.filter((item) => item.category === "background"), [assets]);
  const ornamentAssets = useMemo(() => assets.filter((item) => item.category === "ornament"), [assets]);
  const effectAssets = useMemo(() => assets.filter((item) => item.category === "effect"), [assets]);

  const selectedTree = trees.find((item) => item.id === treeId) || trees[0] || null;
  const selectedTopper = topperId === "__none__" ? null : (toppers.find((item) => item.id === topperId) || toppers[0] || null);
  const selectedBackground = backgrounds.find((item) => item.id === backgroundId) || backgrounds[0] || null;
  const appliedEffects = effectAssets.filter((item) => activeEffects.includes(item.id));

  const refreshAssets = async () => {
    setLoadingAssets(true);
    try {
      const response = await fetch("/api/assets", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "이미지 목록을 불러오지 못했어요.");
      setAssets(data.assets || []);
      setImageErrorDetails([]);
      setAssetError("");
    } catch (error) {
      setAssetError(error.message || "이미지 목록을 불러오지 못했어요.");
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    refreshAssets();
  }, []);

  const handleAssetImageError = (item) => {
    setImageErrorDetails((current) => current.some((entry) => entry.id === item.id)
      ? current
      : current.concat({ id: item.id, name: item.name, url: item.url, isPublicUrl: item.isPublicUrl }));
  };

  const hasPrivateAssetUrl = assets.some((item) => item.isPublicUrl === false && item.isSignedUrl !== true);

  const addOrnament = (asset) => {
    const index = ornaments.length;
    const angle = index * 2.399963;
    const radius = 75 + (index % 4) * 30;
    const id = "ornament-" + Date.now() + "-" + serialRef.current++;
    setOrnaments((current) => current.concat({
      id,
      assetId: asset.id,
      url: asset.url,
      name: asset.name,
      x: Math.max(120, Math.min(780, 450 + Math.cos(angle) * radius)),
      y: 275 + (index % 7) * 83 + Math.sin(angle) * 25,
      size: 72,
    }));
    setSelectedId(id);
  };

  const getPoint = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 900,
      y: ((event.clientY - rect.top) / rect.height) * 1000,
    };
  };

  const onPointerDown = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    const item = ornaments.find((ornament) => ornament.id === id);
    if (!item) return;
    const point = getPoint(event);
    dragRef.current = { id, dx: point.x - item.x, dy: point.y - item.y };
    setSelectedId(id);
    if (svgRef.current?.setPointerCapture) svgRef.current.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const point = getPoint(event);
    const drag = dragRef.current;
    setOrnaments((current) => current.map((item) => item.id === drag.id ? {
      ...item,
      x: Math.max(45, Math.min(855, point.x - drag.dx)),
      y: Math.max(45, Math.min(955, point.y - drag.dy)),
    } : item));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setOrnaments((current) => current.filter((item) => item.id !== selectedId));
    setSelectedId("");
  };

  const clearOrnaments = () => {
    setOrnaments([]);
    setSelectedId("");
    setMessage("트리 위 오너먼트를 모두 비웠어요.");
  };

  const downloadPng = async () => {
    if (!selectedTree) {
      setMessage("먼저 관리자 페이지에서 트리 PNG를 등록해 주세요.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setMessage("고화질 PNG를 만들고 있어요.");
    try {
      const blob = await createPngBlob(svgRef.current);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "merry-tree-studio.png";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setMessage("완성한 트리를 PNG로 저장했어요!");
    } catch (error) {
      setMessage(error.message || "PNG 저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  const sharePng = async () => {
    if (!selectedTree) {
      setMessage("먼저 관리자 페이지에서 트리 PNG를 등록해 주세요.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const blob = await createPngBlob(svgRef.current);
      const file = new File([blob], "merry-tree-studio.png", { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "메리 트리 스튜디오", text: "내가 꾸민 크리스마스 트리!" });
        setMessage("완성한 트리를 공유했어요.");
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "merry-tree-studio.png";
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        setMessage("이 브라우저는 파일 공유를 지원하지 않아 PNG로 저장했어요.");
      }
    } catch (error) {
      if (error.name !== "AbortError") setMessage(error.message || "이미지 공유에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  const toggleEffect = (id) => {
    setActiveEffects((current) => current.includes(id) ? current.filter((value) => value !== id) : current.concat(id));
  };

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand-mark" href="/"><span className="brand-icon">✦</span><span>MERRY TREE <b>STUDIO</b></span></a>
        <a className="admin-shortcut" href="/admin">ADMINISTRATOR ↗</a>
      </header>

      <section className="intro">
        <div className="intro-kicker">✦ &nbsp; A LITTLE WINTER MAGIC &nbsp; ✦</div>
        <h1>메리 트리 스튜디오</h1>
        <p>준비된 이미지로 오너먼트를 달고 나만의 크리스마스 트리를 완성해 보세요.</p>
      </section>

      <div className="workspace">
        <section className="preview-column">
          <div className="preview-heading">
            <div><span className="section-eyebrow">MY CHRISTMAS CANVAS</span><h2>나만의 크리스마스 트리</h2></div>
            <span className="live-pill"><i /> LIVE PREVIEW</span>
          </div>
          <div className="canvas-card">
            <div className="canvas-topline"><span>✦ &nbsp; MERRY TREE STUDIO</span><span>DRAG TO DECORATE</span></div>
            <div className="scene-frame">
              <TreeCanvas
                svgRef={svgRef}
                background={selectedBackground}
                tree={selectedTree}
                topper={selectedTopper}
                effects={appliedEffects}
                ornaments={ornaments}
                selectedId={selectedId}
                onImageError={handleAssetImageError}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              />
              {!selectedTree ? (
                <div className="scene-empty">
                  <span>✦</span>
                  <strong>트리 이미지가 아직 없어요</strong>
                  <small>관리자 페이지에서 사용할 트리 PNG를 등록해 주세요.</small>
                  <a href="/admin">관리자 페이지 열기 ↗</a>
                </div>
              ) : null}
            </div>
            <div className="canvas-footer"><span>✦ &nbsp; MADE WITH YOUR OWN ARTWORK</span><span>{ornaments.length} ORNAMENT{ornaments.length === 1 ? "" : "S"}</span></div>
          </div>
          <div className="preview-tip"><span>✧</span> 오너먼트를 드래그해 원하는 위치에 놓아 보세요.</div>
        </section>

        <aside className="control-panel">
          <div className="panel-header"><div><span className="section-eyebrow">LET'S DECORATE</span><h2>꾸미기 도구</h2></div><button className="reset-button" type="button" onClick={clearOrnaments}>장식 비우기 ↺</button></div>

          {assetError ? <div className="notice warning">{assetError}<a href="/admin">관리자 설정 확인 ↗</a></div> : null}
          {hasPrivateAssetUrl ? <div className="notice warning">Blob 이미지 주소를 브라우저가 직접 열 수 없어요. 저장소 연결과 Access 설정을 확인해 주세요. <a href="/admin">관리자 페이지에서 원본 주소 확인 ↗</a></div> : null}
          {imageErrorDetails.length ? (
            <div className="notice warning">
              {imageErrorDetails.length}개 이미지가 브라우저에서 열리지 않아요. 원본 이미지 링크를 열어 403 또는 404 오류인지 확인해 주세요.
              {imageErrorDetails.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer">{item.name || "PNG 이미지"} 원본 열기 ↗</a>)}
            </div>
          ) : null}

          <section className="tool-section">
            <div className="tool-title-row"><h3><span className="tool-number">01</span> 트리 선택</h3><span className="tool-caption">TREE PNG</span></div>
            {loadingAssets ? <p className="empty-copy">트리 이미지를 불러오는 중이에요.</p> : trees.length ? (
              <div className="asset-picker-grid tree-picker">
                {trees.map((item) => <AssetChoice key={item.id} item={item} active={selectedTree?.id === item.id} onClick={() => setTreeId(item.id)} />)}
              </div>
            ) : <p className="empty-copy">관리자 페이지에서 트리 PNG를 등록하면 여기에 선택지가 생겨요.</p>}
          </section>

          <section className="tool-section">
            <div className="tool-title-row"><h3><span className="tool-number">02</span> 트리 꼭대기 장식</h3><span className="tool-caption">TOPPER PNG</span></div>
            <p className="tool-description">트리 맨 위에 고정해서 붙일 장식을 선택해요.</p>
            {toppers.length ? (
              <>
                <div className="topper-picker-grid">
                  <button type="button" className={"topper-choice topper-none " + (!selectedTopper ? "active" : "")} onClick={() => setTopperId("__none__")}>
                    <span className="topper-none-icon">×</span><small>사용 안 함</small>
                  </button>
                  {toppers.map((item) => (
                    <AssetChoice key={item.id} item={item} active={selectedTopper?.id === item.id} onClick={() => setTopperId(item.id)} />
                  ))}
                </div>
              </>
            ) : <p className="empty-copy">관리자 페이지에서 트리 꼭대기 장식 PNG를 등록하면 여기에 선택지가 생겨요.</p>}
          </section>

          <section className="tool-section">
            <div className="tool-title-row"><h3><span className="tool-number">03</span> 배경 선택</h3><span className="tool-caption">BACKGROUND PNG</span></div>
            {backgrounds.length ? (
              <div className="asset-picker-grid">
                {backgrounds.map((item) => <AssetChoice key={item.id} item={item} active={selectedBackground?.id === item.id} onClick={() => setBackgroundId(item.id)} />)}
              </div>
            ) : <p className="empty-copy">등록된 배경이 없어요. 배경 없이도 트리를 꾸밀 수 있어요.</p>}
          </section>

          <section className="tool-section">
            <div className="tool-title-row"><h3><span className="tool-number">04</span> 오너먼트</h3><span className="tool-caption">ORNAMENT PNG</span></div>
            <p className="tool-description">오너먼트를 누르면 트리에 하나씩 추가돼요.</p>
            {ornamentAssets.length ? (
              <div className="ornament-picker-grid">
                {ornamentAssets.map((item) => (
                  <button key={item.id} type="button" className="ornament-choice" onClick={() => addOrnament(item)} title={item.name + " 추가"}>
                    <span><img src={item.url} alt="" onError={() => handleAssetImageError(item)} /></span><small>{item.name}</small>
                  </button>
                ))}
              </div>
            ) : <p className="empty-copy">관리자 페이지에서 오너먼트 PNG를 등록해 주세요.</p>}
            <div className="selected-tools"><span>{selectedId ? "오너먼트가 선택되었어요." : "트리 위 장식을 선택해 보세요."}</span><button type="button" onClick={removeSelected} disabled={!selectedId}>선택 삭제 −</button></div>
          </section>

          <section className="tool-section effect-section">
            <div className="tool-title-row"><h3><span className="tool-number">05</span> 반짝임 더하기</h3><span className="tool-caption">SPARKLE PNG</span></div>
            <p className="tool-description">선택한 반짝임은 트리에 고정되어 적용돼요.</p>
            {effectAssets.length ? (
              <div className="effect-picker-list">
                {effectAssets.map((item) => (
                  <button key={item.id} type="button" className={"effect-choice " + (activeEffects.includes(item.id) ? "active" : "")} onClick={() => toggleEffect(item.id)}>
                    <span className="effect-choice-thumb"><img src={item.url} alt="" onError={() => handleAssetImageError(item)} /></span>
                    <span className="effect-choice-name">{item.name}</span>
                    <span className="effect-choice-check">{activeEffects.includes(item.id) ? "✓ 적용 중" : "적용하기 +"}</span>
                  </button>
                ))}
              </div>
            ) : <p className="empty-copy">관리자 페이지에서 반짝임 PNG를 등록해 주세요.</p>}
          </section>

          <div className="export-section">
            <div className="export-copy"><span>YOUR TREE IS READY?</span><strong>완성한 트리를 간직해 보세요.</strong></div>
            <button className="download-button" type="button" onClick={downloadPng} disabled={busy}>↓ &nbsp; PNG 이미지 저장</button>
            <button className="share-button" type="button" onClick={sharePng} disabled={busy}>↗ &nbsp; 이미지 공유하기</button>
          </div>
          <p className="privacy-note">로그인 없이 자유롭게 꾸미고 저장할 수 있어요. ♡</p>
          {message ? <div className="notice" role="status">{message}</div> : null}
        </aside>
      </div>
      <footer className="site-footer">✦ &nbsp; MERRY TREE STUDIO &nbsp; · &nbsp; MADE FOR A COZY CHRISTMAS &nbsp; ✦</footer>
    </main>
  );
}
