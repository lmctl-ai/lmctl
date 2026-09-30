#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse, parseFragment } from "parse5";
import { parse as parseCss, walk as walkCss } from "css-tree";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULTS = {
  pagesDir: path.join(ROOT, "pages-v2"),
  outputDir: path.join(ROOT, "build-v2"),
  templatesDir: path.join(ROOT, "generator/templates"),
  bulmaPath: path.join(ROOT, "generator/vendor/bulma.css"),
  extrasPath: path.join(ROOT, "generator/allowed-extra-classes.json"),
};
const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const DOCUMENT_CONTAINER_ELEMENTS = new Set(["html", "head", "body"]);

function optionsFromArgs(args) {
  const options = { ...DEFAULTS };
  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (!match) continue;
    const key = { pages: "pagesDir", output: "outputDir", templates: "templatesDir", bulma: "bulmaPath", extras: "extrasPath" }[match[1]];
    if (key) options[key] = path.resolve(match[2]);
  }
  return options;
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function collectBulmaClasses(css, file) {
  let ast;
  try {
    ast = parseCss(css);
  } catch (error) {
    throw new Error(`invalid CSS in ${file}: ${error.message}`);
  }
  const classes = new Set();
  walkCss(ast, (node) => {
    if (node.type === "ClassSelector") classes.add(node.name);
  });
  return classes;
}

function validateHtml(file, html, isDocument = false) {
  const errors = [];
  const parser = isDocument ? parse : parseFragment;
  const ast = parser(html, { sourceCodeLocationInfo: true, scriptingEnabled: false, onParseError: (error) => errors.push(error.code) });
  const classes = new Set();
  let h1Count = 0;
  function visit(node) {
    if (node.nodeName === "#text" || node.nodeName === "#comment") return;
    if (node.tagName) {
      if (node.tagName === "h1") h1Count += 1;
      const classAttribute = node.attrs?.find((attribute) => attribute.name === "class");
      if (classAttribute) for (const token of classAttribute.value.split(/\s+/).filter(Boolean)) classes.add(token);
      if (!VOID_ELEMENTS.has(node.tagName) && !(isDocument && DOCUMENT_CONTAINER_ELEMENTS.has(node.tagName)) && !node.sourceCodeLocation?.endTag) errors.push(`unclosed <${node.tagName}>`);
    }
    for (const child of node.childNodes ?? []) visit(child);
    for (const child of node.content?.childNodes ?? []) visit(child);
  }
  for (const node of ast.childNodes) visit(node);
  if (errors.length) throw new Error(`${file}: malformed HTML (${errors.join(", ")})`);
  return { classes, h1Count };
}

function readPages(options, knownKinds) {
  const entries = fs.readdirSync(options.pagesDir).filter((name) => name.endsWith(".json")).sort();
  return entries.map((metadataName) => {
    const metadataPath = path.join(options.pagesDir, metadataName);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const fragmentPath = path.join(options.pagesDir, metadataName.replace(/\.json$/, ".html"));
    if (!fs.existsSync(fragmentPath)) throw new Error(`${metadataPath}: missing paired fragment ${path.basename(fragmentPath)}`);
    for (const field of ["kind", "title", "description", "path"]) if (typeof metadata[field] !== "string" || !metadata[field]) throw new Error(`${metadataPath}: missing non-empty ${field}`);
    if (!knownKinds.has(metadata.kind)) throw new Error(`${metadataPath}: unknown kind ${metadata.kind}; expected ${[...knownKinds].join(", ")}`);
    if (!metadata.path.startsWith("/")) throw new Error(`${metadataPath}: path must start with /`);
    const content = fs.readFileSync(fragmentPath, "utf8");
    const validation = validateHtml(fragmentPath, content);
    if (metadata.kind === "manual" && validation.h1Count !== 1) throw new Error(`${fragmentPath}: manual pages must contain exactly one <h1> (found ${validation.h1Count})`);
    return { metadata, fragmentPath, content, validation };
  });
}

function build(options) {
  const templateNames = fs.readdirSync(options.templatesDir).filter((name) => name.endsWith(".html")).sort();
  const knownKinds = new Set(templateNames.map((name) => name.replace(/\.html$/, "")));
  if (!knownKinds.size) throw new Error(`no templates found in ${options.templatesDir}`);
  const allowedClasses = collectBulmaClasses(fs.readFileSync(options.bulmaPath, "utf8"), options.bulmaPath);
  for (const extra of JSON.parse(fs.readFileSync(options.extrasPath, "utf8"))) allowedClasses.add(extra);
  const templates = new Map();
  for (const name of templateNames) {
    const file = path.join(options.templatesDir, name);
    const content = fs.readFileSync(file, "utf8");
    templates.set(name.replace(/\.html$/, ""), { file, content, validation: validateHtml(file, content, true) });
  }
  const pages = readPages(options, knownKinds);
  const classErrors = [];
  for (const { file, validation } of [...templates.values()]) for (const token of validation.classes) if (!allowedClasses.has(token)) classErrors.push(`${file}: ${token}`);
  for (const page of pages) for (const token of page.validation.classes) if (!allowedClasses.has(token)) classErrors.push(`${page.fragmentPath}: ${token}`);
  if (classErrors.length) throw new Error(`unknown CSS class name(s):\n${classErrors.join("\n")}`);

  const outputs = pages.map(({ metadata, content }) => {
    const template = templates.get(metadata.kind).content;
    const rendered = template.replaceAll("{{TITLE}}", escapeHtml(metadata.title)).replaceAll("{{DESCRIPTION}}", escapeHtml(metadata.description)).replaceAll("{{CONTENT}}", content).replaceAll("{{GA_SLOT}}", "<!-- analytics slot intentionally empty -->").replaceAll("{{COPYRIGHT}}", `Copyright © ${new Date().getFullYear()} lmctl.`);
    const relative = metadata.path.replace(/^\/+/, "") || "index";
    const outputPath = path.join(options.outputDir, `${relative}.html`);
    const finalValidation = validateHtml(outputPath, rendered, true);
    for (const token of finalValidation.classes) if (!allowedClasses.has(token)) throw new Error(`unknown CSS class name(s):\n${outputPath}: ${token}`);
    return { outputPath, rendered };
  });
  for (const output of outputs) {
    fs.mkdirSync(path.dirname(output.outputPath), { recursive: true });
    fs.writeFileSync(output.outputPath, output.rendered);
  }
  const vendorOutput = path.join(options.outputDir, "vendor");
  fs.mkdirSync(vendorOutput, { recursive: true });
  fs.copyFileSync(options.bulmaPath, path.join(vendorOutput, "bulma.css"));
  fs.copyFileSync(path.join(path.dirname(options.bulmaPath), "htmx.js"), path.join(vendorOutput, "htmx.js"));
  console.log(`Built ${outputs.length} page(s) in ${options.outputDir}`);
}

try {
  build(optionsFromArgs(process.argv.slice(2)));
} catch (error) {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
}
