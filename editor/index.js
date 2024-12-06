var editor = monaco.editor.create(document.getElementById("editor"), {
  value: ["function x() {", '\tconsole.log("Hello world!");', "}"].join("\n"),
  language: "lua",
});

editor.getModel().updateOptions({ tabSize: 2, insertSpaces: true });

// monaco.editor.defineTheme("vs-dark", {
//   base: "vs-dark",
//   inherit: true,
//   rules: [{ background: "000000" }],
//   colors: {
//     "editor.background": "#000000",
//   },
// });

monaco.editor.setTheme("vs-dark");

window.addEventListener("resize", () => {
  editor.layout();
});

document.getElementById("runButton").addEventListener("click", () => {
  var code = editor.getValue();
  var script = document.createElement("script");
  script.innerHTML = code;
  document.body.appendChild(script);
});