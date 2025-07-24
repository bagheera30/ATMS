/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  options: {
    includeOnly: "^src/[^/]+/.*\\.(controller|service|repository|index)\\.js$", // Tambahkan index
    doNotFollow: {
      path: "node_modules",
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
        theme: {
          graph: {
            rankdir: "LR",
            splines: "ortho",
          },
          modules: [
            {
              criteria: { source: "index\\.js$" },
              attributes: {
                fillcolor: "#ffeb3b",
                color: "#ff9800",
                shape: "doubleoctagon", // Bentuk khusus untuk entry point
              },
            },
            {
              criteria: { source: "\\.controller\\.js$" },
              attributes: { fillcolor: "#f9c3c3", color: "#ff0000" },
            },
            {
              criteria: { source: "\\.service\\.js$" },
              attributes: { fillcolor: "#c3f9c3", color: "#00aa00" },
            },
            {
              criteria: { source: "\\.repository\\.js$" },
              attributes: { fillcolor: "#c3c3f9", color: "#0000ff" },
            },
          ],
          dependencies: [
            {
              criteria: { resolved: "index\\.js" },
              attributes: { color: "#ff9800" }, // Warna arrow khusus dari index
            },
          ],
        },
      },
    },
  },
};
