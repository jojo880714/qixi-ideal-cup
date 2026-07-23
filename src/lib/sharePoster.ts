function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

/**
 * Builds a self-contained @font-face CSS string with the Noto TC fonts
 * SUBSET to only the glyphs in `text`, each font file inlined as a data URI.
 * Passed to html-to-image as `fontEmbedCSS` so the capture never depends on
 * reading the cross-origin Google Fonts stylesheet (blocked by CORS) or on
 * the browser reusing already-loaded fonts (unreliable on iOS Safari).
 * Returns null on any failure so the caller can fall back gracefully.
 */
async function buildFontEmbedCss(text: string): Promise<string | null> {
  try {
    const family = "Noto+Serif+TC:wght@800;900&family=Noto+Sans+TC:wght@400;500;700";
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}&display=swap`;
    let css = await fetch(cssUrl).then((r) => (r.ok ? r.text() : Promise.reject(new Error("css"))));
    const urls = Array.from(css.matchAll(/url\((https:\/\/[^)]+)\)/g)).map((m) => m[1]!);
    for (const u of urls) {
      const res = await fetch(u);
      if (!res.ok) return null;
      const dataUri = `data:font/woff2;base64,${bufToBase64(await res.arrayBuffer())}`;
      css = css.split(u).join(dataUri);
    }
    return css;
  } catch {
    return null;
  }
}

/**
 * Renders `node` to a PNG blob. Embeds a subset of the web fonts for
 * reliability, and runs the capture twice (Safari/iOS often misses fonts on
 * the first html-to-image pass — the second is reliable).
 */
async function nodeToPng(node: HTMLElement): Promise<Blob | null> {
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready;
    } catch {
      /* ignore */
    }
  }
  const fontEmbedCSS = await buildFontEmbedCss(node.innerText || "");
  const opts = {
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: "#170D2E",
    ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
  } as const;
  try {
    // Lazy-loaded so the ~30KB library stays out of the initial page bundle.
    const { toBlob } = await import("html-to-image");
    await toBlob(node, opts); // warm-up pass
    return await toBlob(node, opts);
  } catch {
    return null;
  }
}

export type ShareOutcome = "shared" | "downloaded" | "error";

/**
 * Turns the poster node into an image and delivers it the best way for the
 * platform:
 *  - Mobile with Web Share (iOS/Android): opens the native share sheet so the
 *    user can "儲存影像" to Photos or post straight to IG Stories.
 *  - Otherwise: downloads the PNG.
 */
export async function sharePosterFromNode(
  node: HTMLElement,
  filename: string,
  shareText: string,
): Promise<ShareOutcome> {
  const blob = await nodeToPng(node);
  if (!blob) return "error";

  const file = new File([blob], filename, { type: "image/png" });

  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "七夕理想型世界盃", text: shareText });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
      // genuine failure → fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
