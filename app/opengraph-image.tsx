import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Daniel Mendes — Desenvolvimento, design e experiências digitais";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/images/DanielMendesBranco.svg"));
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", background: "#080809", color: "#f0ede5", padding: "64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20 }}><span>DESENVOLVIMENTO + DESIGN</span><span>PORTFÓLIO</span></div>
      <img src={"data:image/svg+xml;base64," + logo.toString("base64")} alt="" width={500} height={Math.round(500 * 464 / 815)} style={{ objectFit: "contain" }} />
      <div style={{ fontSize: 26 }}>Desenvolvedor front-end & designer.</div>
    </div>, size,
  );
}
