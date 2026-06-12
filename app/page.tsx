export default function Home() {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const rows: [string, string][] = [
    ["PROJECT", "YOUR HOME"],
    ["DRG NO.", "NS-001"],
    ["DRAWN BY", "NIRMANSHASTRA"],
    ["CHECKED AGAINST", "IS 456 · 1077 · 732 · 1172 · 1893"],
    ["SCALE", "1:1 COST CERTAINTY"],
    ["DATE", `${today}   REV A`],
  ];

  return (
    <main className="sheet-frame min-h-screen bg-sheet-white flex items-center justify-center p-16">
      <div
        className="border border-iron-ink"
        style={{ fontFamily: "var(--font-plex-mono, monospace)" }}
      >
        <table className="border-collapse text-iron-ink" style={{ minWidth: "420px" }}>
          <tbody>
            {rows.map(([label, value], i) => (
              <tr
                key={label}
                className={i > 0 ? "border-t border-iron-ink" : ""}
              >
                <td
                  className="border-r border-iron-ink px-4 py-2 text-[10px] uppercase tracking-widest whitespace-nowrap"
                  style={{ color: "rgba(30,34,39,0.6)" }}
                >
                  {label}
                </td>
                <td className="px-4 py-2 text-[13px]">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
