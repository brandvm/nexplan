import * as esbuild from "esbuild";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";

const dev = process.argv.includes("--dev");
const pkg = JSON.parse(await readFile("package.json", "utf8"));

async function writeSnippets() {
  await mkdir("dist/licenses", { recursive: true });
  await copyFile("node_modules/lenis/LICENSE", "dist/licenses/lenis-MIT.txt");
  await copyFile("node_modules/swiper/LICENSE", "dist/licenses/swiper-MIT.txt");
  await mkdir("webflow", { recursive: true });
  await writeFile("webflow/global-embed.html",
    '<!-- Nexplan: shared Global Styles Embed; include once on every page. -->\n' +
    '<link id="nexplan-global-styles" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/brandvm/nexplan@v' + pkg.version + '/dist/nexplan.min.css">\n');
  await writeFile("webflow/footer.html",
    '<!-- Nexplan: Footer code. Lenis is included; remove the separate Lenis script. -->\n' +
    '<script defer src="https://cdn.jsdelivr.net/gh/brandvm/nexplan@v' + pkg.version + '/dist/nexplan.min.js"></script>\n');
}

const config = {
  entryPoints: [
    { in: "src/index.js", out: "nexplan.min" },
    { in: "src/vendor/swiper.js", out: "swiper.min" },
    { in: "src/styles.css", out: "nexplan.min" },
  ],
  outdir: "dist",
  bundle: true,
  format: "iife",
  minify: !dev,
  sourcemap: dev,
  target: "es2020",
  legalComments: "linked",
  banner: { js: "/*! Nexplan: includes MIT-licensed libraries; see the sibling licenses/ directory. */" },
  logLevel: "info",
  plugins: [{
    name: "webflow-snippets",
    setup(build) {
      build.onEnd(async (result) => {
        if (!result.errors.length) await writeSnippets();
      });
    },
  }],
};

if (dev) {
  const context = await esbuild.context(config);
  await context.watch();
  await context.serve({ servedir: "dist", host: "127.0.0.1", port: 3001, cors: { origin: "*" } });
  console.log("Nexplan development assets: http://127.0.0.1:3001/nexplan.min.js");
} else {
  await esbuild.build(config);
}
