import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __avatarDrawCalls: number;
  }
}

async function observeAvatarDrawing(page: Page) {
  await page.addInitScript(() => {
    window.__avatarDrawCalls = 0;
    const prototypes = [
      window.WebGLRenderingContext?.prototype,
      window.WebGL2RenderingContext?.prototype,
    ];

    for (const prototype of prototypes) {
      if (!prototype) continue;
      const drawElements = prototype.drawElements;
      prototype.drawElements = function (this: WebGLRenderingContext, ...args: Parameters<WebGLRenderingContext["drawElements"]>) {
        if (this.canvas instanceof HTMLCanvasElement && this.canvas.classList.contains("avatar-canvas")) {
          window.__avatarDrawCalls += 1;
        }
        return drawElements.apply(this, args);
      };
    }
  });
}

const drawCalls = (page: Page) => page.evaluate(() => window.__avatarDrawCalls);

async function expectAvatarIdle(page: Page) {
  // Sample real GPU draw calls over 400 ms, allowing pointer/scroll easing to settle.
  await expect.poll(async () => {
    const before = await drawCalls(page);
    await page.waitForTimeout(400);
    return (await drawCalls(page)) - before;
  }, { timeout: 8_000, message: "The avatar should stop drawing after movement settles" }).toBe(0);
}

async function openPage(page: Page, skipModel = false) {
  if (skipModel) await page.route("**/*.glb", (route) => route.abort());
  await page.goto("/");
  await page.evaluate(async () => { await document.fonts.ready; });
  if (skipModel) await expect(page.locator(".story-avatar")).toHaveAttribute("data-model-state", "error");
}

async function openGallery(page: Page) {
  await page.locator(".projects-stage").evaluate((stage) => {
    window.scrollTo({ top: stage.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  });
  await expect(page.locator("#project-deskclub .project-media")).toBeInViewport({ ratio: 0.15 });
  await expect(page.locator("#project-deskclub")).toHaveClass(/is-active/);
}

test("avatar uses one canvas and draws only while its visible pose changes", async ({ page }) => {
  await observeAvatarDrawing(page);
  await openPage(page);
  const avatar = page.locator(".story-avatar");
  const canvas = page.locator(".avatar-canvas");
  await expect(avatar).toHaveAttribute("data-model-state", "ready", { timeout: 20_000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(await drawCalls(page)).toBeGreaterThan(0);
  await expectAvatarIdle(page);

  const beforePointer = await drawCalls(page);
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width * 0.85, viewport.height * 0.6);
  await expect.poll(() => drawCalls(page)).toBeGreaterThan(beforePointer);
  await expectAvatarIdle(page);

  const beforeScroll = await drawCalls(page);
  const previousAngle = await canvas.getAttribute("data-avatar-angle");
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.25, behavior: "instant" }));
  await expect.poll(() => drawCalls(page)).toBeGreaterThan(beforeScroll);
  await expect(canvas).not.toHaveAttribute("data-avatar-angle", previousAngle!);
  await expectAvatarIdle(page);

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(avatar).not.toBeInViewport();
  await expectAvatarIdle(page);
  const offscreenCalls = await drawCalls(page);
  await page.mouse.move(viewport.width * 0.2, viewport.height * 0.2);
  await expectAvatarIdle(page);
  expect(await drawCalls(page)).toBe(offscreenCalls);
});

test("failed GLB loading keeps the avatar poster and introduction visible", async ({ page }) => {
  let modelAborted = false;
  await page.route("**/*.glb", async (route) => {
    modelAborted = true;
    await route.abort("failed");
  });
  await openPage(page);
  await expect.poll(() => modelAborted).toBe(true);
  await expect(page.locator(".story-avatar")).toHaveAttribute("data-model-state", "error");
  const poster = page.locator(".avatar-fallback");
  await expect(poster).toBeVisible();
  await expect.poll(() => poster.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "Olá, me chamo Daniel Mendes" })).toBeVisible();
});

test("education words stay fully bright after their entrance when scrolling forward and backward", async ({ page }) => {
  await openPage(page, true);
  const education = page.locator('.story-beat[data-beat="3"]');
  const words = education.locator(".lyric-word");
  const wordCount = await words.count();
  expect(wordCount).toBeGreaterThan(0);
  const inkColor = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "var(--ink)";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });

  // The complete fourth phrase should be readable as soon as its entrance ends,
  // and remain readable while moving through the scene in either direction.
  for (const progress of [0.68, 0.77, 0.68]) {
    await page.evaluate((position) => {
      const mobile = matchMedia("(max-width: 767px), (max-width: 1100px) and (orientation: portrait)").matches;
      window.scrollTo({ top: window.innerHeight * (mobile ? 4.2 : 4.8) * position, behavior: "instant" });
    }, progress);
    await expect.poll(async () => {
      const actual = Number(await page.locator("#hero").getAttribute("data-story-progress"));
      return Math.abs(actual - progress);
    }).toBeLessThan(0.001);
    await expect(education).toHaveCSS("opacity", "1");
    await expect.poll(() => words.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).color)), {
      message: "Every word of the fully visible education phrase should use the bright text color",
    }).toEqual(Array(wordCount).fill(inkColor));
  }
});

test("project videos are requested only after entering the gallery", async ({ page }) => {
  const videoRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith(".mp4")) videoRequests.push(request.url());
  });
  await openPage(page, true);
  await expect(page.locator(".project-video")).toHaveCount(5);
  await expect(page.locator(".project-video[src]")).toHaveCount(0);
  expect(videoRequests).toEqual([]);

  await openGallery(page);
  await expect(page.locator("#project-deskclub video")).toHaveAttribute("src", "/videos/deskclub.mp4");
  await expect.poll(() => videoRequests.length).toBeGreaterThan(0);
});

test("gallery navigation and pause/play work in desktop and mobile layouts", async ({ page }, testInfo) => {
  await openPage(page, true);
  await expect(page.locator(".projects-stage")).toHaveClass(testInfo.project.name === "mobile" ? /is-native/ : /is-pinned/);
  await openGallery(page);
  await expect(page.getByRole("button", { name: "Projeto anterior", exact: true })).toBeDisabled();

  const firstVideo = page.locator("#project-deskclub video");
  const toggle = page.locator("#project-deskclub .project-video-toggle");
  await expect(toggle).toHaveAttribute("aria-pressed", "true", { timeout: 10_000 });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => firstVideo.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => firstVideo.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(false);

  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  await expect(page.locator("#project-nitefy")).toHaveClass(/is-active/);
  await expect.poll(() => firstVideo.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
  const carousel = page.getByRole("region", { name: /Projetos selecionados/ });
  await carousel.focus();
  await carousel.press("ArrowRight");
  await expect(page.locator("#project-scenr")).toHaveClass(/is-active/);
  await page.getByRole("button", { name: "Projeto anterior", exact: true }).click();
  await expect(page.locator("#project-nitefy")).toHaveClass(/is-active/);
  await page.getByRole("button", { name: "Ir para XiS Tickets", exact: true }).click();
  await expect(page.locator("#project-xis")).toHaveClass(/is-active/);
  await expect(page.getByRole("button", { name: "Próximo projeto", exact: true })).toBeDisabled();
});

test("reduced motion disables video autoplay while allowing manual playback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPage(page, true);
  await expect(page.locator(".projects-stage")).toHaveClass(/is-native/);
  await openGallery(page);
  const firstVideo = page.locator("#project-deskclub video");
  const toggle = page.locator("#project-deskclub .project-video-toggle");
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Próximo projeto", exact: true }).click();
  await expect(page.locator("#project-nitefy")).toHaveClass(/is-active/);
  await expect(page.locator("#project-nitefy .project-video-toggle")).toBeEnabled();
  await expect.poll(() => page.locator("#project-nitefy video").evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
  await page.getByRole("button", { name: "Projeto anterior", exact: true }).click();
  await expect(page.locator("#project-deskclub")).toHaveClass(/is-active/);
  await expect.poll(() => firstVideo.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true", { timeout: 10_000 });
  await expect.poll(() => firstVideo.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(false);
});
