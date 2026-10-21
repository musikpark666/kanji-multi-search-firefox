(function submitJitenonSearch() {
  "use strict";

  const character = new URLSearchParams(location.search).get("char") || "";
  if (!character) {
    location.replace("https://kanji.jitenon.jp/");
    return;
  }

  const form = document.createElement("form");
  form.method = "post";
  form.action = "https://kanji.jitenon.jp/";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "value";
  input.value = character;

  form.append(input);
  document.body.append(form);
  form.submit();
})();
