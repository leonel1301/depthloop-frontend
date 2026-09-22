import type { CSSProperties } from "react";
import type { ToolId } from "../models";

const bars = [44, 73, 56, 91, 66];

export function ToolPreview({ id }: { id: ToolId }) {
  if (id === "bar") {
    return (
      <div className="tool-preview tool-preview-bars" aria-hidden="true">
        {bars.map((height, index) => <i key={height} style={{ "--value": `${height}%`, "--delay": `${index * 70}ms` } as CSSProperties} />)}
      </div>
    );
  }
  if (id === "line") {
    return (
      <div className="tool-preview tool-preview-line" aria-hidden="true">
        <svg viewBox="0 0 240 90" preserveAspectRatio="none">
          <path className="tool-line-area" d="M0 76 C28 68 37 44 66 52 S103 70 126 42 S169 18 190 32 S217 20 240 8 L240 90 L0 90 Z" />
          <path className="tool-line-stroke" d="M0 76 C28 68 37 44 66 52 S103 70 126 42 S169 18 190 32 S217 20 240 8" />
        </svg>
      </div>
    );
  }
  if (id === "donut") {
    return (
      <div className="tool-preview tool-preview-donut" aria-hidden="true">
        <span /><div><i /><i /><i /></div>
      </div>
    );
  }
  if (id === "world-map") {
    return (
      <div className="tool-preview tool-preview-map" aria-hidden="true">
        <svg viewBox="0 0 300 130">
          <path d="M17 39l25-19 39 8 20 20-12 16-27 2-10 19-19-8-8-21zM82 82l18 8 12 23-9 14-13-24zM130 32l26-12 28 6 18 16 32-7 35 17-15 19-30-2-15 18-22-5-18-30-25-2zM170 62l28 12-7 36-18 13-16-31zM239 93l25-8 19 13-8 18-25 2z" />
          <circle cx="88" cy="91" r="5" /><circle cx="183" cy="58" r="4" /><circle cx="246" cy="57" r="6" />
        </svg>
      </div>
    );
  }
  if (id === "globe") {
    return (
      <div className="tool-preview tool-preview-globe" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle className="tool-preview-globe-body" cx="60" cy="60" r="46" />
          <g className="tool-preview-globe-land">
            <circle cx="38" cy="48" r="1.1" /><circle cx="44" cy="42" r="1.1" /><circle cx="49" cy="50" r="1.1" />
            <circle cx="36" cy="58" r="1.1" /><circle cx="43" cy="63" r="1.1" /><circle cx="51" cy="58" r="1.1" />
            <circle cx="47" cy="72" r="1.1" /><circle cx="54" cy="68" r="1.1" /><circle cx="41" cy="78" r="1.1" />
            <circle cx="62" cy="40" r="1.1" /><circle cx="70" cy="38" r="1.1" /><circle cx="78" cy="44" r="1.1" />
            <circle cx="66" cy="48" r="1.1" /><circle cx="74" cy="52" r="1.1" /><circle cx="82" cy="50" r="1.1" />
            <circle cx="69" cy="58" r="1.1" /><circle cx="77" cy="61" r="1.1" /><circle cx="84" cy="58" r="1.1" />
            <circle cx="72" cy="68" r="1.1" /><circle cx="80" cy="72" r="1.1" /><circle cx="88" cy="66" r="1.1" />
            <circle cx="58" cy="54" r="1.1" /><circle cx="61" cy="62" r="1.1" /><circle cx="57" cy="70" r="1.1" />
          </g>
          <circle className="tool-preview-globe-hot" cx="47" cy="72" r="3.2" />
          <circle className="tool-preview-globe-hot" cx="76" cy="52" r="2.4" />
          <circle className="tool-preview-globe-ring" cx="47" cy="72" r="7.5" />
        </svg>
      </div>
    );
  }
  if (id === "kpi") {
    return (
      <div className="tool-preview tool-preview-kpi" aria-hidden="true">
        <span><small>ACTIVOS</small><strong>1,284</strong><em>+18%</em></span>
        <span><small>EVENTOS</small><strong>8.4k</strong><em>+7%</em></span>
      </div>
    );
  }
  if (id === "funnel") {
    return (
      <div className="tool-preview tool-preview-funnel" aria-hidden="true">
        {[92, 72, 52, 34].map((width, index) => <i key={width} style={{ "--value": `${width}%`, "--delay": `${index * 90}ms` } as CSSProperties} />)}
      </div>
    );
  }
  if (id === "heatmap") {
    return (
      <div className="tool-preview tool-preview-heatmap" aria-hidden="true">
        {[2, 4, 1, 3, 5, 2, 3, 5, 4, 2, 1, 4, 5, 3, 2, 4, 2, 5].map((level, index) => <i key={index} data-level={level} style={{ "--delay": `${index * 28}ms` } as CSSProperties} />)}
      </div>
    );
  }
  if (id === "histogram") {
    return (
      <div className="tool-preview tool-preview-histogram" aria-hidden="true">
        {[18, 38, 69, 92, 74, 47, 24].map((height, index) => <i key={index} style={{ "--value": `${height}%`, "--delay": `${index * 55}ms` } as CSSProperties} />)}
      </div>
    );
  }
  if (id === "area") {
    return (
      <div className="tool-preview tool-preview-area" aria-hidden="true">
        <svg viewBox="0 0 240 90" preserveAspectRatio="none">
          <path d="M0 82 C30 76 38 54 65 60 S105 71 128 42 S170 15 194 31 S222 18 240 9 L240 90 L0 90 Z" />
          <polyline points="0,82 38,54 65,60 105,71 128,42 170,15 194,31 222,18 240,9" />
        </svg>
      </div>
    );
  }
  if (id === "scatter") {
    return (
      <div className="tool-preview tool-preview-scatter" aria-hidden="true">
        {[[14, 74], [28, 62], [39, 69], [48, 47], [63, 42], [72, 27], [85, 19], [78, 49]].map(([left, top], index) => (
          <i key={index} style={{ left: `${left}%`, top: `${top}%`, "--delay": `${index * 60}ms` } as CSSProperties} />
        ))}
      </div>
    );
  }
  if (id === "gauge") {
    return (
      <div className="tool-preview tool-preview-gauge" aria-hidden="true">
        <span><i /><b>74%</b><small>OBJETIVO</small></span>
      </div>
    );
  }
  if (id === "treemap") {
    return (
      <div className="tool-preview tool-preview-treemap" aria-hidden="true">
        {["a", "b", "c", "d", "e"].map((item, index) => <i key={item} style={{ "--delay": `${index * 70}ms` } as CSSProperties} />)}
      </div>
    );
  }
  if (id === "route-map") {
    return (
      <div className="tool-preview tool-preview-route" aria-hidden="true">
        <svg viewBox="0 0 260 110">
          <path d="M22 72 C68 16 112 96 158 42 S220 25 240 62" />
          <circle cx="22" cy="72" r="5" /><circle cx="158" cy="42" r="5" /><circle cx="240" cy="62" r="5" />
        </svg>
      </div>
    );
  }
  return (
    <div className="tool-preview tool-preview-timeline" aria-hidden="true">
      {["09:00", "12:30", "18:10"].map((time, index) => <span key={time}><i /><small>{time}</small><b style={{ "--delay": `${index * 100}ms` } as CSSProperties} /></span>)}
    </div>
  );
}
