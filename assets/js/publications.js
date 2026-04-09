(function () {
  function decodeLatexAccents(text) {
    var umlaut = { a: "ä", o: "ö", u: "ü", A: "Ä", O: "Ö", U: "Ü", y: "ÿ", Y: "Ÿ" };
    var acute = { a: "á", e: "é", i: "í", o: "ó", u: "ú", y: "ý", A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú", Y: "Ý", c: "ć", C: "Ć", n: "ń", N: "Ń" };
    var grave = { a: "à", e: "è", i: "ì", o: "ò", u: "ù", A: "À", E: "È", I: "Ì", O: "Ò", U: "Ù" };
    var circumflex = { a: "â", e: "ê", i: "î", o: "ô", u: "û", A: "Â", E: "Ê", I: "Î", O: "Ô", U: "Û" };
    var tilde = { a: "ã", n: "ñ", o: "õ", A: "Ã", N: "Ñ", O: "Õ" };

    return text
      .replace(/\\\"\{?([A-Za-z])\}?/g, function (_, c) { return umlaut[c] || c; })
      .replace(/\\'\{?([A-Za-z])\}?/g, function (_, c) { return acute[c] || c; })
      .replace(/\\`\{?([A-Za-z])\}?/g, function (_, c) { return grave[c] || c; })
      .replace(/\\\^\{?([A-Za-z])\}?/g, function (_, c) { return circumflex[c] || c; })
      .replace(/\\~\{?([A-Za-z])\}?/g, function (_, c) { return tilde[c] || c; })
      .replace(/\\c\{c\}/g, "ç")
      .replace(/\\c\{C\}/g, "Ç")
      .replace(/\\ss/g, "ß");
  }

  function unbrace(text) {
    return text
      .replace(/\\url\{([^}]*)\}/g, "$1")
      .replace(/\\textsuperscript/g, "")
      .replace(/[{}]/g, "")
      .trim();
  }

  function cleanBibText(text) {
    return decodeLatexAccents(text)
      .replace(/\\url\{([^}]*)\}/g, "$1")
      .replace(/\\textsuperscript/g, "")
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatAuthors(raw) {
    if (!raw) return "";
    var parts = raw.split(/\s+and\s+/i).map(function (a) {
      var name = unbrace(a).trim();
      if (name.indexOf(",") !== -1) {
        var split = name.split(",");
        if (split.length >= 2) {
          name = split.slice(1).join(",").trim() + " " + split[0].trim();
        }
      }
      return name.replace(/\s+/g, " ");
    });
    return parts.join(", ");
  }

  function readValue(src, i) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] === "{") {
      var depth = 0;
      var start = i + 1;
      for (i = i + 1; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") {
          if (depth === 0) return { value: src.slice(start, i), end: i + 1 };
          depth--;
        }
      }
      return { value: src.slice(start), end: src.length };
    }
    if (src[i] === '"') {
      var s = i + 1;
      for (i = i + 1; i < src.length; i++) {
        if (src[i] === '"' && src[i - 1] !== "\\") return { value: src.slice(s, i), end: i + 1 };
      }
      return { value: src.slice(s), end: src.length };
    }
    var j = i;
    while (j < src.length && src[j] !== "," && src[j] !== "\n") j++;
    return { value: src.slice(i, j), end: j };
  }

  function parseFields(body) {
    var fields = {};
    var i = 0;
    while (i < body.length) {
      while (i < body.length && /[\s,]/.test(body[i])) i++;
      var eq = body.indexOf("=", i);
      if (eq === -1) break;
      var key = body.slice(i, eq).trim().toLowerCase();
      i = eq + 1;
      var read = readValue(body, i);
      fields[key] = cleanBibText(read.value);
      i = read.end;
    }
    return fields;
  }

  function parseBib(bib) {
    var entries = [];
    var i = 0;
    while (i < bib.length) {
      var at = bib.indexOf("@", i);
      if (at === -1) break;
      var open = bib.indexOf("{", at);
      if (open === -1) break;
      var type = bib.slice(at + 1, open).trim().toLowerCase();
      var depth = 0;
      var end = open + 1;
      for (; end < bib.length; end++) {
        if (bib[end] === "{") depth++;
        else if (bib[end] === "}") {
          if (depth === 0) break;
          depth--;
        }
      }
      if (end >= bib.length) break;
      var content = bib.slice(open + 1, end);
      var comma = content.indexOf(",");
      if (comma !== -1) {
        var key = content.slice(0, comma).trim();
        var body = content.slice(comma + 1);
        var fields = parseFields(body);
        entries.push({ type: type, key: key, fields: fields });
      }
      i = end + 1;
    }
    return entries;
  }

  function venueFor(fields) {
    return fields.booktitle || fields.journal || fields.publisher || "";
  }

  function primaryUrl(fields) {
    return fields.url || (fields.eprint ? "https://arxiv.org/abs/" + fields.eprint : "");
  }

  function render(entries, mount) {
    if (!entries.length) {
      mount.innerHTML = "<p class='muted-text'>No publications found.</p>";
      return;
    }
    entries.sort(function (a, b) {
      return (parseInt(b.fields.year || "0", 10) || 0) - (parseInt(a.fields.year || "0", 10) || 0);
    });

    var html = entries
      .map(function (entry) {
        var f = entry.fields;
        var title = f.title || entry.key;
        var authors = formatAuthors(f.author || "");
        var year = f.year ? "<span class='pub-year'>" + f.year + "</span>" : "";
        var venue = venueFor(f);
        var note = f.note ? "<div class='pub-note'>" + f.note + "</div>" : "";
        var link = primaryUrl(f);
        var linkHtml = link ? "<a class='pub-link' href='" + link + "' target='_blank' rel='noopener noreferrer'>Link</a>" : "";

        return (
          "<article class='pub-item'>" +
          "<h3 class='pub-title'>" + title + " " + year + "</h3>" +
          (authors ? "<div class='pub-authors'>" + authors + "</div>" : "") +
          (venue ? "<div class='pub-venue'>" + venue + "</div>" : "") +
          note +
          (linkHtml ? "<div class='pub-actions'>" + linkHtml + "</div>" : "") +
          "</article>"
        );
      })
      .join("");
    mount.innerHTML = html;
  }

  function init() {
    var mount = document.getElementById("publications-list");
    if (!mount) return;
    fetch("/files/citations.bib")
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to fetch citations.bib");
        return res.text();
      })
      .then(function (text) {
        render(parseBib(text), mount);
      })
      .catch(function () {
        mount.innerHTML = "<p class='muted-text'>Could not load publications.</p>";
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
