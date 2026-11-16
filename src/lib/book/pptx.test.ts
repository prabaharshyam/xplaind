import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { readPptx, slideImageTargets, slideXmlToText } from "./pptx";
import { fitSize, looksLikePicture, mergePicturePages, readPictures } from "./pictures";

const slide = (...lines: string[]) =>
  `<p:sld>${lines.map((l) => `<a:p><a:r><a:t>${l}</a:t></a:r></a:p>`).join("")}</p:sld>`;

describe("PowerPoint text (MB-12)", () => {
  it("makes the first line a heading and decodes entities", () => {
    expect(slideXmlToText(slide("Cells &amp; tissues", "Cells are small"))).toBe("# Cells & tissues\nCells are small");
    expect(slideXmlToText("<p:sld></p:sld>")).toBe("");
  });

  it("finds the picture files a slide uses and ignores web links", () => {
    const rels = `<Relationships>
      <Relationship Id="1" Type="http://x/relationships/image" Target="../media/image1.png"/>
      <Relationship Id="2" Type="http://x/relationships/slideLayout" Target="../slideLayouts/a.xml"/>
      <Relationship Id="3" Type="http://x/relationships/image" Target="https://evil.example/p.png" TargetMode="External"/>
    </Relationships>`;
    expect(slideImageTargets(rels)).toEqual(["ppt/media/image1.png"]);
  });

  it("reads slides in order and returns only large pictures, one per slide", async () => {
    const zip = new JSZip();
    zip.file("ppt/slides/slide2.xml", slide("Second", "b"));
    zip.file("ppt/slides/slide1.xml", slide("First", "a"));
    zip.file("ppt/slides/_rels/slide2.xml.rels", `<Relationships><Relationship Id="1" Type="http://x/relationships/image" Target="../media/big.png"/><Relationship Id="2" Type="http://x/relationships/image" Target="../media/logo.png"/></Relationships>`);
    zip.file("ppt/media/big.png", new Uint8Array(30_000));
    zip.file("ppt/media/logo.png", new Uint8Array(500));
    const out = await readPptx(await zip.generateAsync({ type: "arraybuffer" }));
    expect(out.pages.map((p) => p.text)).toEqual(["# First\na", "# Second\nb"]);
    expect(out.pictures).toHaveLength(1);
    expect(out.pictures[0]).toMatchObject({ n: 2, name: "ppt/media/big.png", mime: "image/png" });
  });
});

describe("picture pages (MB-12)", () => {
  it("treats a page with almost no text as a picture", () => {
    expect(looksLikePicture("  \n 12 ")).toBe(true);
    expect(looksLikePicture("A whole paragraph of real selectable text on this page.")).toBe(false);
  });

  it("shrinks big pictures to the size limit and never enlarges small ones", () => {
    expect(fitSize(2800, 1400)).toEqual({ w: 1400, h: 700 });
    expect(fitSize(800, 600)).toEqual({ w: 800, h: 600 });
  });

  it("puts the picture text on an empty page, or after a slide's own text", () => {
    const merged = mergePicturePages([{ n: 1, text: "" }, { n: 2, text: "# Slide" }, { n: 3, text: "kept" }], [{ n: 1, text: "scan" }, { n: 2, text: "chart" }]);
    expect(merged.map((p) => p.text)).toEqual(["scan", "# Slide\nchart", "kept"]);
  });

  it("sends four at a time and stops with the server's message when Pro is needed", async () => {
    const calls: number[] = [];
    const fetcher = (async (_u: string, init: RequestInit) => {
      const ids = (JSON.parse(String(init.body)) as { images: { id: number }[] }).images.map((i) => i.id);
      calls.push(ids.length);
      if (calls.length === 2) return new Response(JSON.stringify({ error: "Pro only", upgrade: "/pricing" }), { status: 403 });
      return new Response(JSON.stringify({ pages: ids.map((id) => ({ id, text: `p${id}` })) }), { status: 200 });
    }) as unknown as typeof fetch;
    const pics = Array.from({ length: 9 }, (_, i) => ({ n: i + 1, data: "/9j/AAAA" }));
    const seen: number[] = [];
    const r = await readPictures(pics, (d) => seen.push(d), fetcher);
    expect(calls).toEqual([4, 4]);
    expect(r.pages.map((p) => p.n)).toEqual([1, 2, 3, 4]);
    expect(r.stopped).toMatchObject({ message: "Pro only", upgrade: "/pricing" });
    expect(seen).toEqual([0, 4]);
  });
});
