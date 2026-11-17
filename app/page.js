"use client";

import { useRef, useState } from "react";

const TREE_OPTIONS = [
  { id: "classic", label: "클래식" },
  { id: "slim", label: "슬림" },
  { id: "round", label: "풍성한" },
];

const BACKGROUNDS = [
  { id: "snow", label: "눈 내리는 창가", detail: "맑고 포근한 겨울" },
  { id: "cream", label: "빈티지 크림", detail: "따뜻한 클래식 무드" },
  { id: "night", label: "별빛 가득한 밤", detail: "깊고 반짝이는 밤" },
];

const STICKERS = [
  ["⭐", "별"], ["🔴", "빨간 방울"], ["🎀", "리본"], ["🔔", "종"],
  ["❄️", "눈꽃"], ["🎁", "선물"], ["🍬", "캔디"], ["❤️", "하트"],
  ["🍪", "쿠키"], ["🦌", "루돌프"], ["🌙", "달"], ["✨", "반짝이"],
];

const STARTER = [
  { id: "s1", emoji: "🎀", x: 450, y: 285, size: 68 },
  { id: "s2", emoji: "🔴", x: 350, y: 410, size: 60 },
  { id: "s3", emoji: "⭐", x: 535, y: 475, size: 62 },
  { id: "s4", emoji: "🎁", x: 405, y: 590, size: 65 },
  { id: "s5", emoji: "🔔", x: 565, y: 665, size: 60 },
  { id: "s6", emoji: "❄️", x: 330, y: 715, size: 56 },
];

const SNOW = [
  [145, 150, 4], [250, 115, 3], [710, 165, 4], [790, 270, 5], [110, 360, 4],
  [770, 425, 3], [190, 565, 3], [715, 635, 5], [120, 770, 4], [800, 830, 3],
  [280, 860, 4], [650, 900, 3], [350, 170, 3], [610, 250, 3], [820, 550, 4],
];

function TreeShape({ kind }) {
  const scale = kind === "slim" ? 0.78 : kind === "round" ? 1.1 : 1;
  const path = "M450 112 C425 165 395 198 407 230 C365 237 340 267 352 300 C311 304 284 335 298 369 C255 378 234 410 257 444 C218 455 207 490 240 520 C202 541 206 574 240 599 C204 624 212 655 250 680 C220 710 240 742 285 758 L615 758 C660 742 680 710 650 680 C688 655 696 624 660 599 C694 574 698 541 660 520 C693 490 682 455 643 444 C666 410 645 378 602 369 C616 335 589 304 548 300 C560 267 535 237 493 230 C505 198 475 165 450 112 Z";
  return (
    <g transform={"translate(450 0) scale(" + scale + " 1) translate(-450 0)"}>
      <ellipse cx="450" cy="900" rx="205" ry="25" fill="#294b3b" opacity=".13" />
      <rect x="405" y="735" width="90" height="160" rx="12" fill="#896044" />
      <path d={path} fill="url(#pine)" stroke="#1f5944" strokeWidth="8" strokeLinejoin="round" />
      <path d="M450 140 C415 235 355 300 305 365 C365 348 418 375 450 400 C482 375 535 348 595 365 C545 300 485 235 450 140Z" fill="#77a77b" opacity=".3" />
      <path d="M450 300 C390 385 320 455 270 520 C345 502 410 540 450 565 C490 540 555 502 630 520 C580 455 510 385 450 300Z" fill="#8fbd8d" opacity=".22" />
      <path d="M450 470 C385 555 315 625 265 675 C345 660 410 695 450 720 C490 695 555 660 635 675 C585 625 515 555 450 470Z" fill="#9cc89b" opacity=".2" />
      {["M390 280 Q450 322 510 280", "M330 405 Q450 465 570 405", "M278 535 Q450 602 622 535", "M254 660 Q450 725 646 660"].map((d, i) => (
        <path key={d} d={d} fill="none" stroke={i % 2 ? "#1c6348" : "#a7c99a"} strokeWidth={kind === "round" ? 12 : 8} strokeLinecap="round" opacity=".34" />
      ))}
      <path d="M390 878 Q450 900 510 878" fill="none" stroke="#d2a46a" strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

function Scene({ svgRef, background, backgroundImage, treeKind, treeImage, ornaments, garland, lights, effects, selected, pointerDown, pointerMove, pointerUp }) {
  const lightPoints = [[354,343],[440,370],[535,407],[330,480],[440,510],[570,535],[285,608],[405,640],[520,657],[630,690],[365,740],[495,765],[580,785]];
  return (
    <svg ref={svgRef} className="tree-scene" viewBox="0 0 900 1000" xmlns="http://www.w3.org/2000/svg"
      onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onPointerLeave={pointerUp}>
      <defs>
        <linearGradient id="pine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#28694c" /><stop offset=".55" stopColor="#174f3a" /><stop offset="1" stopColor="#103c31" />
        </linearGradient>
        <linearGradient id="snowbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d4e9eb" /><stop offset="1" stopColor="#f6f3ec" /></linearGradient>
        <linearGradient id="creamBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0dfc8" /><stop offset="1" stopColor="#fbf2e3" /></linearGradient>
        <linearGradient id="nightBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22364f" /><stop offset="1" stopColor="#52677a" /></linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b" /><feOffset dy="3" result="o" /><feComponentTransfer><feFuncA type="linear" slope=".22" /></feComponentTransfer><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {backgroundImage ? (
        <image href={backgroundImage} x="0" y="0" width="900" height="1000" preserveAspectRatio="xMidYMid slice" />
      ) : background === "night" ? (
        <g><rect width="900" height="1000" fill="url(#nightBg)" /><circle cx="700" cy="205" r="76" fill="#f4e5b7" /><circle cx="730" cy="178" r="72" fill="#2d435b" />
          {SNOW.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={p[2]} fill="#fff1c9" opacity=".78" />)}
          <path d="M0 880 Q200 820 420 880 T900 875 V1000 H0Z" fill="#f7f2e6" opacity=".22" /></g>
      ) : background === "cream" ? (
        <g><rect width="900" height="1000" fill="url(#creamBg)" /><path d="M90 100 Q450 20 810 100 V880 H90Z" fill="#fff2dd" opacity=".48" /><path d="M125 118 Q450 40 775 118" fill="none" stroke="#d6b98f" strokeWidth="4" />
          <path d="M110 875 H790" stroke="#d9c09a" strokeWidth="5" opacity=".65" /><path d="M0 922 Q210 895 420 922 T900 918 V1000 H0Z" fill="#e7d5b8" opacity=".55" /></g>
      ) : (
        <g><rect width="900" height="1000" fill="url(#snowbg)" /><rect x="72" y="68" width="756" height="820" rx="34" fill="#d9edf1" stroke="#fffdf7" strokeWidth="22" />
          <rect x="95" y="91" width="710" height="774" rx="22" fill="#e5f0ed" /><path d="M450 96 V864 M96 470 H804" stroke="#fbf8ef" strokeWidth="22" />
          {SNOW.map((p, i) => <g key={i} opacity=".8"><circle cx={p[0]} cy={p[1]} r={p[2] + 2} fill="white" /><circle cx={p[0] + 15} cy={p[1] + 45} r={Math.max(2, p[2] - 1)} fill="white" /></g>)}
          <path d="M0 904 Q200 866 420 906 T900 902 V1000 H0Z" fill="#f7f4ec" opacity=".9" /></g>
      )}
      <path d="M0 915 Q225 887 450 915 T900 910 V1000 H0Z" fill="#f4f0e7" opacity=".55" />
      {treeImage ? <image href={treeImage} x="110" y="55" width="680" height="850" preserveAspectRatio="xMidYMid meet" /> : <TreeShape kind={treeKind} />}
      {garland && <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M330 315 C575 365 310 440 570 492 C700 520 340 575 325 645 C315 700 580 730 550 800" stroke="#81502d" strokeWidth="17" opacity=".42" />
        <path d="M330 307 C575 357 310 432 570 484 C700 512 340 567 325 637 C315 692 580 722 550 792" stroke="#dfbd78" strokeWidth="12" strokeDasharray="1 2" />
        <path d="M330 303 C575 353 310 428 570 480 C700 508 340 563 325 633 C315 688 580 718 550 788" stroke="#fff0bd" strokeWidth="3" opacity=".8" />
      </g>}
      {lights && <g filter="url(#glow)">
        <path d="M340 335 C560 385 320 455 565 510 C690 540 350 610 330 665 C315 720 575 750 565 805" fill="none" stroke="#e7d7a8" strokeWidth="5" opacity=".75" />
        {lightPoints.map((p, i) => <g key={i}><circle cx={p[0]} cy={p[1]} r="13" fill={i % 3 === 0 ? "#f4d16d" : "#f7eac3"} opacity=".3" /><circle cx={p[0]} cy={p[1]} r="6" fill={i % 3 === 0 ? "#ffe18a" : "#fff6d9"} stroke="#fff4d6" /></g>)}
      </g>}
      {effects.map((item) => <image key={item.id} href={item.src} x="125" y="165" width="650" height="700" preserveAspectRatio="xMidYMid meet" pointerEvents="none" />)}
      {!treeImage && <g filter="url(#shadow)"><polygon points="450,65 466,101 505,105 476,131 484,170 450,150 416,170 424,131 395,105 434,101" fill="#edc66f" stroke="#fff0c4" strokeWidth="8" /><circle cx="450" cy="118" r="9" fill="#fff3cc" /></g>}
      {ornaments.map((item) => <g key={item.id} transform={"translate(" + item.x + " " + item.y + ")"} className="ornament-item"
        style={{ cursor:"grab", touchAction:"none" }} onPointerDown={(e) => pointerDown(e, item.id)} filter="url(#shadow)">
        {item.src ? <image href={item.src} x={-item.size / 2} y={-item.size / 2} width={item.size} height={item.size} preserveAspectRatio="xMidYMid meet" /> :
          <><circle r={item.size * .52} fill="#fffdf7" stroke="white" strokeWidth="4" /><text x="0" y="2" textAnchor="middle" dominantBaseline="middle" fontSize={item.size * .82} fontFamily="Apple Color Emoji, Segoe UI Emoji, sans-serif">{item.emoji}</text></>}
        {selected === item.id && <circle r={item.size * .7} fill="none" stroke="#bd805b" strokeWidth="4" strokeDasharray="8 7" />}
      </g>)}
    </svg>
  );
}

function RemoveAsset({ onClick, title }) {
  return <button className="asset-remove" type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} title={title} aria-label={title}>×</button>;
}

export default function Home() {
  const [treeKind, setTreeKind] = useState("classic");
  const [background, setBackground] = useState("snow");
  const [assets, setAssets] = useState({ tree:[], background:[], ornament:[], effect:[] });
  const [selectedTree, setSelectedTree] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [ornaments, setOrnaments] = useState(STARTER);
  const [selected, setSelected] = useState(null);
  const [garland, setGarland] = useState(true);
  const [lights, setLights] = useState(true);
  const [activeEffects, setActiveEffects] = useState([]);
  const [message, setMessage] = useState("");
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const inputs = { tree:useRef(null), background:useRef(null), ornament:useRef(null), effect:useRef(null) };
  const counter = useRef(0);

  const upload = async (event, category) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const added = [];
    const errors = [];
    for (const file of files) {
      if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
        errors.push(file.name + ": PNG 파일만 업로드할 수 있어요.");
        continue;
      }
      if (file.size > 12 * 1024 * 1024) {
        errors.push(file.name + ": 파일 크기는 12MB 이하로 올려 주세요.");
        continue;
      }
      try {
        const src = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error(file.name + ": 이미지를 읽지 못했어요."));
          reader.readAsDataURL(file);
        });
        added.push({ id:"asset-" + Date.now() + "-" + counter.current++, name:file.name.replace(/\.png$/i,""), src });
      } catch (error) { errors.push(error.message); }
    }
    if (added.length) {
      setAssets((old) => ({ ...old, [category]:old[category].concat(added) }));
      if (category === "tree") setSelectedTree(added[added.length - 1].id);
      if (category === "background") setSelectedBackground(added[added.length - 1].id);
      if (category === "effect") setActiveEffects((old) => old.concat(added.map((x) => x.id)));
      setMessage(added.length + "개의 PNG를 추가했어요. 아래 선택창에서 확인해 보세요.");
    }
    if (errors.length) setMessage(errors.join(" "));
  };

  const removeAsset = (category, id) => {
    setAssets((old) => ({ ...old, [category]:old[category].filter((x) => x.id !== id) }));
    if (category === "tree" && selectedTree === id) setSelectedTree(null);
    if (category === "background" && selectedBackground === id) setSelectedBackground(null);
    if (category === "effect") setActiveEffects((old) => old.filter((x) => x !== id));
    setMessage("선택창에서 이미지를 삭제했어요.");
  };

  const addOrnament = (item) => {
    const spots = [[385,335],[520,380],[315,475],[575,555],[425,625],[520,705],[350,755],[465,450],[395,515],[590,635],[300,600],[490,810]];
    const spot = spots[counter.current % spots.length];
    const id = "ornament-" + Date.now() + "-" + counter.current++;
    setOrnaments((old) => old.concat({ id, emoji:item.emoji, src:item.src, x:spot[0], y:spot[1], size:70 }));
    setSelected(id);
  };

  const point = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x:(event.clientX - rect.left) / rect.width * 900, y:(event.clientY - rect.top) / rect.height * 1000 };
  };

  const pointerDown = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    const item = ornaments.find((x) => x.id === id);
    if (!item) return;
    const p = point(event);
    dragRef.current = { id, dx:p.x - item.x, dy:p.y - item.y };
    setSelected(id);
    event.currentTarget.ownerSVGElement.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event) => {
    if (!dragRef.current) return;
    const p = point(event);
    const d = dragRef.current;
    setOrnaments((old) => old.map((item) => item.id === d.id ? { ...item, x:Math.max(55,Math.min(845,p.x-d.dx)), y:Math.max(80,Math.min(930,p.y-d.dy)) } : item));
  };

  const pointerUp = () => { dragRef.current = null; };

  const removeSelected = () => {
    if (!selected) return;
    setOrnaments((old) => old.filter((item) => item.id !== selected));
    setSelected(null);
  };

  const clearDecorations = () => {
    setOrnaments([]);
    setSelected(null);
    setMessage("트리 위 오너먼트를 모두 비웠어요.");
  };

  const exportPng = async () => {
    try {
      setMessage("고화질 PNG를 만들고 있어요.");
      const clone = svgRef.current.cloneNode(true);
      clone.querySelectorAll("circle[stroke-dasharray]").forEach((node) => node.remove());
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", "1800");
      clone.setAttribute("height", "2000");
      const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], { type:"image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1800;
        canvas.height = 2000;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, 1800, 2000);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) { setMessage("PNG 변환에 실패했어요."); return; }
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = "merry-tree-studio.png";
          a.click();
          setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
          setMessage("완성한 트리를 PNG로 저장했어요!");
        }, "image/png");
      };
      image.onerror = () => { URL.revokeObjectURL(url); setMessage("이미지를 불러오지 못했어요. 다시 시도해 주세요."); };
      image.src = url;
    } catch (error) { setMessage(error.message || "PNG 저장에 실패했어요."); }
  };

  const sharePng = async () => {
    try {
      const clone = svgRef.current.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", "1800");
      clone.setAttribute("height", "2000");
      const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], { type:"image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1800; canvas.height = 2000;
        canvas.getContext("2d").drawImage(image, 0, 0, 1800, 2000);
        URL.revokeObjectURL(url);
        canvas.toBlob(async (blob) => {
          if (!blob) return setMessage("이미지 공유용 파일을 만들지 못했어요.");
          const file = new File([blob], "merry-tree-studio.png", { type:"image/png" });
          if (navigator.canShare && navigator.canShare({ files:[file] }) && navigator.share) {
            await navigator.share({ files:[file], title:"메리 트리 스튜디오", text:"내가 꾸민 크리스마스 트리!" });
            setMessage("이미지를 공유했어요.");
          } else {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = pngUrl; a.download = "merry-tree-studio.png"; a.click();
            setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
            setMessage("이 브라우저는 파일 공유를 지원하지 않아 PNG로 저장했어요.");
          }
        }, "image/png");
      };
      image.onerror = () => { URL.revokeObjectURL(url); setMessage("이미지를 불러오지 못했어요."); };
      image.src = url;
    } catch (error) {
      if (error.name !== "AbortError") setMessage(error.message || "공유할 수 없어요.");
    }
  };

  const chosenTree = assets.tree.find((item) => item.id === selectedTree);
  const chosenBackground = assets.background.find((item) => item.id === selectedBackground);
  const chosenEffects = assets.effect.filter((item) => activeEffects.includes(item.id));

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand-mark" href="#"><span className="brand-icon">✦</span><span>MERRY TREE <b>STUDIO</b></span></a>
        <span className="header-note"><i /> YOUR LITTLE CHRISTMAS WORKSHOP</span>
      </header>
      <section className="intro">
        <div className="intro-kicker">✦ &nbsp; A LITTLE WINTER MAGIC &nbsp; ✦</div>
        <h1>메리 트리 스튜디오</h1>
        <p>나만의 PNG 장식으로 세상에 하나뿐인 크리스마스 트리를 꾸며 보세요.</p>
      </section>
      <div className="workspace">
        <section className="preview-column">
          <div className="preview-heading"><div><span className="section-eyebrow">MY CHRISTMAS CANVAS</span><h2>나만의 크리스마스 트리</h2></div><span className="live-pill"><i /> LIVE PREVIEW</span></div>
          <div className="canvas-card">
            <div className="canvas-topline"><span>✦ &nbsp; 2026 HOLIDAY EDITION</span><span>DRAG TO DECORATE</span></div>
            <div className="scene-frame">
              <Scene svgRef={svgRef} background={background} backgroundImage={chosenBackground ? chosenBackground.src : ""} treeKind={treeKind} treeImage={chosenTree ? chosenTree.src : ""} ornaments={ornaments}
                garland={garland} lights={lights} effects={chosenEffects} selected={selected} pointerDown={pointerDown} pointerMove={pointerMove} pointerUp={pointerUp} />
            </div>
            <div className="canvas-footer"><span>✦ &nbsp; MADE WITH A LITTLE MAGIC</span><span>{ornaments.length} ORNAMENT{ornaments.length === 1 ? "" : "S"}</span></div>
          </div>
          <div className="preview-tip"><span>✧</span> 오너먼트를 드래그해서 원하는 위치에 놓아 보세요.</div>
        </section>
        <aside className="control-panel">
          <div className="panel-header"><div><span className="section-eyebrow">LET'S DECORATE</span><h2>꾸미기 도구</h2></div><button className="reset-button" type="button" onClick={clearDecorations}>장식 비우기 ↺</button></div>

          <section className="tool-section">
            <div className="tool-title-row"><h3><span className="tool-number">01</span> 트리 모양</h3><span className="tool-caption">TREE PNG</span></div>
            <div className="tree-choice-list">
              {TREE_OPTIONS.map((item, index) => <button key={item.id} type="button" className={"tree-choice " + (!selectedTree && treeKind === item.id ? "active" : "")} onClick={() => { setTreeKind(item.id); setSelectedTree(null); }}>
                <span className={"mini-tree mini-tree-" + (index + 1)}><i /><b /><em /></span><span>{item.label}</span>
              </button>)}
            </div>
            {assets.tree.length > 0 && <div className="asset-grid">
              {assets.tree.map((item) => <div className={"asset-card " + (selectedTree === item.id ? "active" : "")} key={item.id}>
                <button className="asset-select" type="button" onClick={() => setSelectedTree(item.id)}><span className="asset-thumb tree-thumb"><img src={item.src} alt="" /></span><span className="asset-name">{item.name}</span></button>
                <RemoveAsset onClick={() => removeAsset("tree", item.id)} title="트리 이미지 삭제" />
              </div>)}
            </div>}
            <button className="upload-line" type="button" onClick={() => inputs.tree.current.click()}><b>＋</b> 내 트리 PNG 업로드 <span>↗</span></button>
            <input ref={inputs.tree} className="visually-hidden" type="file" accept="image/png,.png" multiple onChange={(e) => upload(e,"tree")} />
            <p className="asset-hint">투명 배경 PNG를 추천해요. 여러 장을 보관할 수 있어요.</p>
          </section>

          <section className="tool-section">
            <div className="tool-title-row"><h3><span className="tool-number">02</span> 배경 선택</h3><span className="tool-caption">BACKGROUND PNG</span></div>
            <div className="background-choice-list">
              {BACKGROUNDS.map((item) => <button key={item.id} type="button" className={"background-choice " + (background === item.id && !selectedBackground ? "active" : "")} onClick={() => { setBackground(item.id); setSelectedBackground(null); }}>
                <span className={"background-thumb bg-" + item.id}><i /><b /></span><span className="background-copy"><strong>{item.label}</strong><small>{item.detail}</small></span><span className="choice-check">✓</span>
              </button>)}
            </div>
            {assets.background.length > 0 && <div className="asset-grid">
              {assets.background.map((item) => <div className={"asset-card " + (selectedBackground === item.id ? "active" : "")} key={item.id}>
                <button className="asset-select" type="button" onClick={() => setSelectedBackground(item.id)}><span className="asset-thumb background-thumb-user"><img src={item.src} alt="" /></span><span className="asset-name">{item.name}</span></button>
                <RemoveAsset onClick={() => removeAsset("background", item.id)} title="배경 이미지 삭제" />
              </div>)}
            </div>}
            <button className="upload-line" type="button" onClick={() => inputs.background.current.click()}><b>＋</b> 내 배경 PNG 업로드 <span>↗</span></button>
            <input ref={inputs.background} className="visually-hidden" type="file" accept="image/png,.png" multiple onChange={(e) => upload(e,"background")} />
          </section>

          <section className="tool-section">
            <div className="tool-title-row"><h3><span className="tool-number">03</span> 오너먼트</h3><span className="tool-caption">ORNAMENT PNG</span></div>
            <p className="tool-description">이미지를 누르면 트리에 하나씩 추가돼요.</p>
            <div className="sticker-grid">
              {STICKERS.map(([emoji,label]) => <button key={label} type="button" className="sticker-button" onClick={() => addOrnament({emoji})} title={label + " 추가"}><span>{emoji}</span></button>)}
              {assets.ornament.map((item) => <div className="custom-sticker-wrap" key={item.id}>
                <button type="button" className="sticker-button custom-sticker" onClick={() => addOrnament(item)} title={item.name + " 추가"}><img src={item.src} alt="" /></button>
                <RemoveAsset onClick={() => removeAsset("ornament", item.id)} title="오너먼트 이미지 삭제" />
              </div>)}
            </div>
            <button className="upload-line" type="button" onClick={() => inputs.ornament.current.click()}><b>＋</b> 내 오너먼트 PNG 업로드 <span>↗</span></button>
            <input ref={inputs.ornament} className="visually-hidden" type="file" accept="image/png,.png" multiple onChange={(e) => upload(e,"ornament")} />
            <div className="selected-tools"><span>{selected ? "오너먼트가 선택되었어요" : "트리 위 장식을 선택해 보세요"}</span><button type="button" onClick={removeSelected} disabled={!selected}>선택 삭제 −</button></div>
          </section>

          <section className="tool-section effect-section">
            <div className="tool-title-row"><h3><span className="tool-number">04</span> 반짝임 더하기</h3><span className="tool-caption">SPARKLE PNG</span></div>
            <label className={"effect-toggle " + (garland ? "checked" : "")}><span className="effect-icon">〰</span><span className="effect-copy"><strong>기본 반짝이 끈</strong><small>트리를 따라 금빛 장식 끈</small></span><input type="checkbox" checked={garland} onChange={(e) => setGarland(e.target.checked)} /><span className="toggle-ui" /></label>
            <label className={"effect-toggle " + (lights ? "checked" : "")}><span className="effect-icon">✧</span><span className="effect-copy"><strong>기본 꼬마 전구</strong><small>은은하게 빛나는 조명</small></span><input type="checkbox" checked={lights} onChange={(e) => setLights(e.target.checked)} /><span className="toggle-ui" /></label>
            {assets.effect.length > 0 && <div className="asset-grid">
              {assets.effect.map((item) => <div className={"asset-card " + (activeEffects.includes(item.id) ? "active" : "")} key={item.id}>
                <button type="button" className="asset-select" onClick={() => setActiveEffects((old) => old.includes(item.id) ? old.filter((x) => x !== item.id) : old.concat(item.id))}>
                  <span className="asset-thumb"><img src={item.src} alt="" /></span><span className="asset-name">{item.name}</span><small className="effect-selected">{activeEffects.includes(item.id) ? "✓ 적용 중" : "눌러서 적용"}</small>
                </button><RemoveAsset onClick={() => removeAsset("effect", item.id)} title="반짝임 이미지 삭제" />
              </div>)}
            </div>}
            <button className="upload-line" type="button" onClick={() => inputs.effect.current.click()}><b>＋</b> 내 반짝임 PNG 업로드 <span>↗</span></button>
            <input ref={inputs.effect} className="visually-hidden" type="file" accept="image/png,.png" multiple onChange={(e) => upload(e,"effect")} />
            <p className="asset-hint">업로드한 반짝임은 트리에 고정 적용돼요. 위치를 옮길 수 없어요.</p>
          </section>

          <div className="export-section"><div className="export-copy"><span>YOUR TREE IS READY?</span><strong>완성한 트리를 간직해 보세요.</strong></div>
            <button className="download-button" type="button" onClick={exportPng}>↓ &nbsp; PNG 이미지 저장</button>
            <button className="share-button" type="button" onClick={sharePng}>↗ &nbsp; 이미지 공유하기</button>
          </div>
          <p className="privacy-note">로그인 없이 자유롭게 꾸미고 저장할 수 있어요. ♡</p>
          {message && <div className="notice" role="status">{message}</div>}
        </aside>
      </div>
      <footer className="site-footer">✦ &nbsp; MERRY TREE STUDIO &nbsp; · &nbsp; MADE FOR A COZY CHRISTMAS &nbsp; ✦</footer>
    </main>
  );
}
