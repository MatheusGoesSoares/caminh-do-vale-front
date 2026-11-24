import { test, type Page } from "@playwright/test";

/**
 * In the "demo" project (recorded for the presentation) each step shows a caption at the bottom
 * of the screen and holds a moment, so whoever watches the video can follow the flow.
 * In the normal project it only names the step in the report.
 */
export async function step(page: Page, text: string, action: () => Promise<void>): Promise<void> {
  await test.step(text, async () => {
    if (test.info().project.name === "demo") {
      await page.evaluate((caption) => {
        let el = document.getElementById("e2e-caption");
        if (!el) {
          el = document.createElement("div");
          el.id = "e2e-caption";
          el.setAttribute(
            "style",
            [
              // Left side: the login card sits in the middle and the buttons stay visible.
              "position:fixed", "left:28px", "top:50%", "transform:translateY(-50%)", "z-index:2147483647",
              "width:340px", "padding:16px 20px 16px 18px", "border-radius:16px", "border-left:6px solid #F2C94C",
              "background:rgba(18,58,36,.94)", "color:#fff", "font:600 20px/1.4 Inter,system-ui,sans-serif",
              "box-shadow:0 10px 30px rgba(0,0,0,.35)", "pointer-events:none",
            ].join(";")
          );
          document.body.appendChild(el);
        }
        el.textContent = caption;
      }, text);
      await page.waitForTimeout(900);
    }
    await action();
    if (test.info().project.name === "demo") await page.waitForTimeout(1200);
  });
}
