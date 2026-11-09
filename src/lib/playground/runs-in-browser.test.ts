import { describe, expect, it } from "vitest";
import { importedModules, runsInBrowser } from "./runs-in-browser";

describe("runsInBrowser (PG-6)", () => {
  it("reads plain, aliased, dotted and from-imports", () => {
    expect(importedModules("import numpy as np\nimport os, sys\nfrom sklearn.metrics import f1_score\nfrom . import x").sort()).toEqual(
      ["numpy", "os", "sklearn", "sys"],
    );
  });

  it("allows the standard library and Pyodide's packages", () => {
    expect(runsInBrowser("import re\nfrom collections import Counter\nprint(1)")).toBe(true);
    expect(runsInBrowser("import pandas as pd\nfrom sklearn.linear_model import LogisticRegression")).toBe(true);
    expect(runsInBrowser("print('no imports')")).toBe(true);
  });

  it("refuses model SDKs, servers and PyTorch, which cannot run in the browser", () => {
    expect(runsInBrowser("import anthropic")).toBe(false);
    expect(runsInBrowser("from fastapi import FastAPI")).toBe(false);
    expect(runsInBrowser("import torch\nfrom torch import nn")).toBe(false);
    expect(runsInBrowser("import numpy as np\nimport faiss")).toBe(false);
  });
});
