/* Sovi AreaChart — lightweight SVG area/line built from data points.
   Replaces recharts (not bundled here). Calm: sky line, soft tint fill,
   no axes clutter. Exports to window for the babel screens. */
(function () {
  function AreaChart({ data, height = 180, color = "var(--accent)", id = "g", labels = [] }) {
    const w = 1000; // viewBox width, scales to container
    const h = height;
    const pad = 8;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const stepX = (w - pad * 2) / (data.length - 1);
    const pts = data.map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (h - pad * 2) * (1 - (v - min) / span);
      return [x, y];
    });
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h - pad} L${pts[0][0].toFixed(1)} ${h - pad} Z`;
    const last = pts[pts.length - 1];
    return React.createElement(
      "svg",
      { viewBox: `0 0 ${w} ${h}`, width: "100%", height: h, preserveAspectRatio: "none", style: { display: "block", overflow: "visible" } },
      React.createElement(
        "defs", null,
        React.createElement(
          "linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" },
          React.createElement("stop", { offset: "0%", stopColor: "#38bdf8", stopOpacity: 0.28 }),
          React.createElement("stop", { offset: "100%", stopColor: "#38bdf8", stopOpacity: 0 })
        )
      ),
      React.createElement("path", { d: area, fill: `url(#${id})` }),
      React.createElement("path", { d: line, fill: "none", stroke: color, strokeWidth: 2.5, strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" }),
      React.createElement("circle", { cx: last[0], cy: last[1], r: 4, fill: "#34d399" })
    );
  }
  window.SoviAreaChart = AreaChart;
})();
