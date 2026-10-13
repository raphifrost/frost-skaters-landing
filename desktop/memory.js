(function (root) {
  "use strict";

  var LIMITS = Object.freeze({ fileBytes: 100 * 1024 * 1024, records: 5000, content: 200000 });
  var searchCache = typeof WeakMap === "function" ? new WeakMap() : null;
  var idCounter = 0;
  var own = function (object, key) { return Object.prototype.hasOwnProperty.call(object, key); };
  var isObject = function (value) { return value !== null && typeof value === "object" && !Array.isArray(value); };

  function fail(message) {
    throw new Error(message);
  }

  function validId(value) {
    return typeof value === "string" && value.length > 0 && value.length <= 200 &&
      value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);
  }

  function makeId(prefix) {
    var label = typeof prefix === "string" ? prefix.replace(/[^a-z0-9_-]/gi, "").slice(0, 24) : "memory";
    label = label || "memory";
    var cryptoApi = root.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
      try { return label + "-" + cryptoApi.randomUUID(); } catch (error) { /* Some file browsers restrict crypto. */ }
    }
    idCounter += 1;
    return label + "-" + Date.now().toString(36) + "-" + idCounter.toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function utf8Size(value) {
    var bytes = 0;
    for (var i = 0; i < value.length; i += 1) {
      var code = value.charCodeAt(i);
      if (code < 0x80) bytes += 1;
      else if (code < 0x800) bytes += 2;
      else if (code >= 0xd800 && code <= 0xdbff && i + 1 < value.length &&
               value.charCodeAt(i + 1) >= 0xdc00 && value.charCodeAt(i + 1) <= 0xdfff) {
        bytes += 4;
        i += 1;
      } else bytes += 3;
      if (bytes > LIMITS.fileBytes) return bytes;
    }
    return bytes;
  }

  function timestamp(value, fallback, seconds) {
    var time;
    if (typeof value === "number" && Number.isFinite(value)) {
      time = seconds || Math.abs(value) < 100000000000 ? value * 1000 : value;
    } else if (typeof value === "string" && value.trim()) {
      time = Date.parse(value);
    }
    if (typeof time === "number" && Number.isFinite(time)) {
      var date = new Date(time);
      if (Number.isFinite(date.getTime())) return date.toISOString();
    }
    return fallback;
  }

  function normalizeText(value) {
    return String(value || "").toLocaleLowerCase("de-DE").normalize("NFKD")
      .replace(/\p{M}/gu, "").replace(/ß/g, "ss");
  }

  // Both spellings work for German names: München / Munchen / Muenchen.
  function foldGerman(value) {
    return value.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
  }

  function tagsOf(value, label) {
    if (value === undefined || value === null || value === "") return [];
    var input = typeof value === "string" ? value.split(",") : value;
    if (!Array.isArray(input)) fail(label + ": Tags müssen eine Liste oder ein durch Kommas getrennter Text sein.");
    if (input.length > 50) fail(label + ": Höchstens 50 Tags pro Eintrag sind möglich.");
    var seen = new Set();
    var result = [];
    input.forEach(function (tag) {
      if (typeof tag !== "string") fail(label + ": Jeder Tag muss Text sein.");
      tag = tag.trim();
      if (tag.length > 100) fail(label + ": Ein Tag darf höchstens 100 Zeichen enthalten.");
      var key = normalizeText(tag);
      if (tag && !seen.has(key)) { seen.add(key); result.push(tag); }
    });
    return result;
  }

  function normalizeRecord(record, options) {
    options = options || {};
    var label = options.label || "Eintrag";
    if (!isObject(record)) fail(label + ": Ein Eintrag muss ein Objekt sein.");
    if (typeof record.content !== "string") fail(label + ": Das Feld „content“ muss Text enthalten.");
    if (record.content.length > LIMITS.content) {
      fail(label + ": Der Text enthält mehr als 200.000 Zeichen. Bitte teile diesen Eintrag auf; es wurde nichts gekürzt.");
    }
    if (record.title !== undefined && typeof record.title !== "string") fail(label + ": Der Titel muss Text sein.");
    var title = (record.title || "").trim() || options.defaultTitle || "Importierte Notiz";
    if (title.length > 1000) fail(label + ": Der Titel darf höchstens 1.000 Zeichen enthalten.");
    if (record.source !== undefined && record.source !== null && typeof record.source !== "string") {
      fail(label + ": Die Quelle muss Text sein.");
    }
    var source = (record.source || options.source || "Import").trim() || "Import";
    if (source.length > 500) fail(label + ": Die Quelle darf höchstens 500 Zeichen enthalten.");
    var now = options.now || new Date().toISOString();
    var createdAt = timestamp(record.createdAt, now, false);
    return {
      id: validId(record.id) ? record.id : makeId(options.prefix),
      title: title,
      content: record.content,
      tags: tagsOf(record.tags, label),
      source: source,
      createdAt: createdAt,
      updatedAt: timestamp(record.updatedAt, createdAt, false)
    };
  }

  function validateRecord(record) {
    return normalizeRecord(record);
  }

  function textPart(part) {
    if (typeof part === "string") return part;
    if (!isObject(part)) return "";
    var kind = part.type || part.content_type;
    if (kind && ["text", "input_text", "output_text"].indexOf(kind) === -1) return "";
    if (["asset_pointer", "image", "image_url", "audio", "video", "audio_asset_pointer"].some(function (key) { return own(part, key); })) return "";
    if (typeof part.text === "string") return part.text;
    if (isObject(part.text) && typeof part.text.value === "string") return part.text.value;
    if (kind && typeof part.content === "string") return part.content;
    return "";
  }

  function messageText(message) {
    if (!isObject(message) || !isObject(message.author)) return null;
    var role = message.author.role;
    if (role !== "user" && role !== "assistant") return null;
    var content = message.content;
    var text = "";
    if (typeof content === "string") text = content;
    else if (isObject(content)) {
      if (Array.isArray(content.parts)) text = content.parts.map(textPart).filter(function (part) { return part !== ""; }).join("\n");
      else text = textPart(content);
    }
    if (!text.trim()) return null;
    return (role === "user" ? "Du" : "Leon") + ":\n" + text;
  }

  function conversationText(conversation) {
    var mapping = conversation.mapping;
    if (!isObject(mapping)) fail("Ein ChatGPT-Chat hat keine gültige Nachrichtenstruktur (mapping).");
    var keys = Object.keys(mapping);
    var current = conversation.current_node;
    var path = [];
    var seen = new Set();
    var cycle = false;
    while (typeof current === "string" && own(mapping, current)) {
      if (seen.has(current)) { cycle = true; break; }
      seen.add(current);
      var node = mapping[current];
      if (!isObject(node)) break;
      path.push(node);
      current = node.parent;
    }
    var active = cycle ? [] : path.reverse().map(function (node) { return messageText(node.message); }).filter(Boolean);
    // An attachment-only active branch is still valid; do not import another branch.
    if (!cycle && path.length) return active.join("\n\n");
    // Exports without a usable current_node still have stable chronological text.
    return keys.map(function (key, index) { return { node: mapping[key], index: index }; })
      .filter(function (item) { return isObject(item.node) && messageText(item.node.message) !== null; })
      .sort(function (a, b) {
        var first = a.node.message.create_time;
        var second = b.node.message.create_time;
        first = typeof first === "number" && Number.isFinite(first) ? first : 0;
        second = typeof second === "number" && Number.isFinite(second) ? second : 0;
        return first - second || a.index - b.index;
      }).map(function (item) { return messageText(item.node.message); }).join("\n\n");
  }

  function readConversation(conversation, index, now) {
    if (!isObject(conversation)) fail("Chat " + (index + 1) + ": Ungültiger ChatGPT-Eintrag.");
    var createdAt = timestamp(conversation.create_time, now, true);
    return normalizeRecord({
      id: conversation.id || conversation.conversation_id,
      title: typeof conversation.title === "string" ? conversation.title : undefined,
      content: conversationText(conversation),
      tags: ["ChatGPT"],
      source: "ChatGPT",
      createdAt: createdAt,
      updatedAt: timestamp(conversation.update_time, createdAt, true)
    }, { label: "Chat " + (index + 1), defaultTitle: "Importierter Chat", prefix: "chat", now: now });
  }

  function uniqueIds(records) {
    var reserved = new Set(records.map(function (record) { return record.id; }));
    var used = new Set();
    records.forEach(function (record) {
      if (used.has(record.id)) {
        do { record.id = makeId("memory"); } while (reserved.has(record.id) || used.has(record.id));
        reserved.add(record.id);
      }
      used.add(record.id);
    });
    return records;
  }

  function checkCount(records, allowEmpty) {
    if (records.length > LIMITS.records) fail("Die Datei enthält mehr als 5.000 Einträge. Bitte importiere sie in kleineren Teilen.");
    if (!records.length && !allowEmpty) fail("Die Datei enthält keine Einträge zum Importieren.");
  }

  function parseImport(text, fileName) {
    if (typeof text !== "string") fail("Die Datei konnte nicht als Text gelesen werden.");
    if (text.length > LIMITS.fileBytes || utf8Size(text) > LIMITS.fileBytes) {
      fail("Die entpackte Datei ist größer als 100 MB. Bitte importiere eine kleinere Datei.");
    }
    fileName = typeof fileName === "string" ? fileName : "";
    var now = new Date().toISOString();
    var source = fileName || "Import";
    if (/\.(txt|md)$/i.test(fileName)) {
      if (!text.trim()) fail("Die Textdatei ist leer.");
      return [normalizeRecord({
        title: fileName.replace(/^.*[\\/]/, "").replace(/\.(txt|md)$/i, ""),
        content: text,
        tags: [],
        source: source
      }, { now: now, prefix: "note" })];
    }
    var data;
    try { data = JSON.parse(text.replace(/^\uFEFF/, "")); }
    catch (error) { fail("Die Datei enthält kein gültiges JSON. Unterstützt werden ChatGPT-Exporte, Leon-Backups sowie .txt und .md."); }
    var records;
    var conversations = false;
    var allowEmptyBackup = false;
    if (Array.isArray(data)) {
      records = data;
      conversations = records.some(function (record) { return isObject(record) && own(record, "mapping"); });
    } else if (isObject(data) && own(data, "memories")) {
      if (own(data, "version") && data.version !== 1) fail("Diese Backup-Version wird nicht unterstützt. Bitte verwende ein Leon-Backup mit Version 1.");
      records = data.memories;
      allowEmptyBackup = data.version === 1;
    } else if (isObject(data) && own(data, "conversations")) {
      records = data.conversations;
      conversations = true;
    } else {
      fail("Unbekanntes Dateiformat. Unterstützt werden conversations.json, Leon-Backups und Listen mit Titel und Text sowie .txt und .md.");
    }
    if (!Array.isArray(records)) fail("Das Importformat ist ungültig: Die Einträge müssen in einer Liste stehen.");
    checkCount(records, allowEmptyBackup);
    return uniqueIds(records.map(function (record, index) {
      return conversations ? readConversation(record, index, now) : normalizeRecord(record, {
        label: "Eintrag " + (index + 1), source: source, now: now
      });
    }));
  }

  function searchFields(record) {
    var tags = Array.isArray(record.tags) ? record.tags.join(" ") : typeof record.tags === "string" ? record.tags : "";
    var cached = searchCache && searchCache.get(record);
    if (cached && cached.originalTitle === record.title && cached.originalContent === record.content && cached.originalTags === tags) return cached;
    var title = normalizeText(record.title);
    var content = normalizeText(record.content);
    var tagText = normalizeText(tags);
    cached = {
      originalTitle: record.title, originalContent: record.content, originalTags: tags,
      title: title, content: content, tags: tagText,
      foldedTitle: foldGerman(title), foldedContent: foldGerman(content), foldedTags: foldGerman(tagText)
    };
    if (searchCache) searchCache.set(record, cached);
    return cached;
  }

  function includesToken(primary, folded, token) {
    return primary.indexOf(token.original) !== -1 || folded.indexOf(token.folded) !== -1;
  }

  function recency(record) {
    var updated = Date.parse(record.updatedAt);
    if (Number.isFinite(updated)) return updated;
    var created = Date.parse(record.createdAt);
    return Number.isFinite(created) ? created : 0;
  }

  function search(records, query) {
    if (!Array.isArray(records)) return [];
    var phrase = normalizeText(typeof query === "string" ? query : "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    var tokens = phrase ? Array.from(new Set(phrase.split(/\s+/))).map(function (token) {
      return { original: token, folded: foldGerman(token) };
    }) : [];
    return records.filter(isObject).map(function (record, index) {
      var score = 0;
      if (tokens.length) {
        var fields = searchFields(record);
        for (var i = 0; i < tokens.length; i += 1) {
          var token = tokens[i];
          if (includesToken(fields.title, fields.foldedTitle, token)) score += 60;
          else if (includesToken(fields.tags, fields.foldedTags, token)) score += 35;
          else if (includesToken(fields.content, fields.foldedContent, token)) score += 8;
          else return null;
        }
        if (fields.title === phrase || fields.foldedTitle === foldGerman(phrase)) score += 100;
        else if (includesToken(fields.title, fields.foldedTitle, { original: phrase, folded: foldGerman(phrase) })) score += 20;
      }
      return { record: record, score: score, time: recency(record), index: index };
    }).filter(Boolean).sort(function (a, b) {
      return b.score - a.score || b.time - a.time || a.index - b.index;
    }).map(function (item) { return item.record; });
  }

  root.LeonMemory = Object.freeze({
    parseImport: parseImport,
    search: search,
    validateRecord: validateRecord,
    makeId: makeId,
    limits: LIMITS
  });
})(typeof window !== "undefined" ? window : globalThis);
