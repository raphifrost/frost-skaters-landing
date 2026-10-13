(function () {
  'use strict';

  const DB_NAME = 'mein-desktop-v1';
  const STORE_NAME = 'state';
  const STATE_KEY = 'current';
  const LEGACY_KEY = 'mein-desktop.v1';
  const MAX_BYTES = 100 * 1024 * 1024;
  let mode = 'memory';
  let database = null;
  let local = null;
  let opening = null;
  let writes = Promise.resolve();
  let checkedExisting = false;

  function failure(message, cause, name) {
    const error = new Error(message);
    if (cause) error.cause = cause;
    if (name) error.name = name;
    return error;
  }

  function storageFailure(action, cause) {
    if (cause && cause.name === 'QuotaExceededError') {
      return failure('Der lokale Speicher ist voll. Bitte lade ein Backup herunter; die bisherige Speicherung bleibt erhalten.', cause, 'QuotaExceededError');
    }
    return failure('Die Daten konnten nicht ' + action + ' werden. Bitte lade ein Backup herunter; die bisherige Speicherung bleibt erhalten.', cause, cause && cause.name);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      let request;
      let settled = false;
      let timer;
      const finish = (error, db) => {
        if (settled) {
          if (db) db.close();
          return;
        }
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(db);
      };
      try {
        if (!window.indexedDB) throw new Error('IndexedDB ist nicht verfügbar.');
        request = window.indexedDB.open(DB_NAME, 1);
      } catch (error) {
        finish(error);
        return;
      }
      // Do not wait indefinitely for another browser tab to release an upgrade.
      timer = setTimeout(() => finish(failure('Der lokale Datenspeicher ist blockiert.')), 5000);
      request.onblocked = () => finish(failure('Der lokale Datenspeicher ist durch ein anderes Fenster blockiert.'));
      request.onerror = () => finish(request.error || new Error('IndexedDB konnte nicht geöffnet werden.'));
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.close();
          finish(failure('Der gespeicherte Datenspeicher ist unvollständig. Die vorhandenen Daten wurden nicht verändert.', null, 'DataError'));
          return;
        }
        finish(null, db);
      };
    });
  }

  async function open() {
    if (mode !== 'memory') return mode;
    if (opening) return opening;
    opening = (async () => {
      let databaseError;
      try {
        database = await openDatabase();
        database.onversionchange = () => {
          database.close();
          database = null;
          opening = null;
          checkedExisting = false;
          mode = 'memory';
        };
        mode = 'indexeddb';
        return mode;
      } catch (error) {
        if (error.name === 'DataError') throw error;
        databaseError = error;
      }
      try {
        local = window.localStorage;
        // This is a read-only availability check, never a write over user data.
        local.getItem(LEGACY_KEY);
        mode = 'localstorage';
        return mode;
      } catch (error) {
        local = null;
        throw failure('Dieser Browser erlaubt hier keine dauerhafte Speicherung. Bitte lade vor dem Schließen ein Backup herunter.', { indexedDB: databaseError, localStorage: error }, 'SecurityError');
      }
    })();
    try {
      return await opening;
    } catch (error) {
      opening = null;
      throw error;
    }
  }

  function readLocal(storage) {
    let raw;
    try {
      raw = storage.getItem(LEGACY_KEY);
    } catch (error) {
      throw storageFailure('geladen', error);
    }
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw failure('Die gespeicherten Daten sind beschädigt und können nicht gelesen werden. Sie wurden nicht überschrieben.', error, 'DataError');
    }
  }

  function databaseOperation(write, value) {
    return new Promise((resolve, reject) => {
      let transaction;
      let request;
      let result;
      try {
        transaction = database.transaction(STORE_NAME, write ? 'readwrite' : 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        request = write ? store.put(value, STATE_KEY) : store.get(STATE_KEY);
        request.onsuccess = () => { result = request.result; };
        // A successful put request is not yet a committed transaction.
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = () => reject(storageFailure(write ? 'gespeichert' : 'geladen', transaction.error || request.error));
        transaction.onerror = () => { /* onabort reports the final transaction error */ };
      } catch (error) {
        if (transaction) {
          try { transaction.abort(); } catch (_) { /* already inactive */ }
        }
        reject(storageFailure(write ? 'gespeichert' : 'geladen', error));
      }
    });
  }

  async function readExisting() {
    await open();
    let state;
    if (mode === 'localstorage') {
      state = readLocal(local);
    } else {
      state = await databaseOperation(false);
      if (state === undefined) {
        // Older versions used localStorage. Read it without deleting or migrating
        // anything until the application has validated it and explicitly saves.
        let legacy;
        try { legacy = window.localStorage; legacy.getItem(LEGACY_KEY); } catch (_) { legacy = null; }
        state = legacy ? readLocal(legacy) : null;
      }
    }
    checkedExisting = true;
    return state === undefined ? null : state;
  }

  async function load() {
    await writes.catch(() => {});
    return readExisting();
  }

  function snapshot(state) {
    try {
      if (typeof window.structuredClone === 'function') return window.structuredClone(state);
      const json = JSON.stringify(state);
      if (json === undefined) throw new Error('Die Daten lassen sich nicht kopieren.');
      return JSON.parse(json);
    } catch (error) {
      throw failure('Die Daten konnten für die Speicherung nicht kopiert werden. Die bisherige Speicherung bleibt erhalten.', error, 'DataCloneError');
    }
  }

  async function save(state) {
    // Clone before joining the queue: later UI mutations cannot change this save.
    const value = snapshot(state);
    const commit = async () => {
      await open();
      if (!checkedExisting) await readExisting();
      if (mode === 'indexeddb') {
        await databaseOperation(true, value);
      } else if (mode === 'localstorage') {
        // Refuse to overwrite a corrupt prior JSON value, even after a failed read.
        readLocal(local);
        try {
          const json = JSON.stringify(value);
          if (json === undefined) throw new Error('Ungültige JSON-Daten.');
          local.setItem(LEGACY_KEY, json);
        } catch (error) {
          throw storageFailure('gespeichert', error);
        }
      } else {
        throw failure('Dauerhafte Speicherung ist hier nicht verfügbar. Bitte lade ein Backup herunter.', null, 'SecurityError');
      }
    };
    const pending = writes.then(commit, commit);
    // A failed write must not permanently stop the following queued writes.
    writes = pending;
    return pending;
  }

  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
    crcTable[i] = value >>> 0;
  }

  function crcUpdate(crc, bytes) {
    for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    return crc >>> 0;
  }

  async function readZip(file) {
    let buffer;
    try { buffer = await file.arrayBuffer(); } catch (error) {
      throw failure('Die ZIP-Datei konnte nicht gelesen werden. Bitte wähle sie erneut aus.', error);
    }
    if (buffer.byteLength > MAX_BYTES) throw failure('Die ZIP-Datei ist größer als 100 MB.');
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const badZip = () => failure('Die ZIP-Datei ist beschädigt oder unvollständig. Bitte exportiere deine ChatGPT-Daten erneut.');
    const has = (offset, length, limit = bytes.length) => Number.isSafeInteger(offset) && Number.isSafeInteger(length) && offset >= 0 && length >= 0 && offset <= limit && length <= limit - offset;
    if (bytes.length < 22) throw badZip();
    let end = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
      if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) {
        end = i;
        break;
      }
    }
    if (end < 0) throw badZip();
    const count = view.getUint16(end + 10, true);
    const directorySize = view.getUint32(end + 12, true);
    const directoryStart = view.getUint32(end + 16, true);
    if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || view.getUint16(end + 8, true) !== count) {
      throw failure('Mehrteilige ZIP-Archive werden nicht unterstützt. Bitte importiere conversations.json direkt.');
    }
    if (count === 0xffff || directorySize === 0xffffffff || directoryStart === 0xffffffff) {
      throw failure('ZIP64-Archive werden nicht unterstützt. Bitte entpacke und importiere conversations.json direkt.');
    }
    if (!has(directoryStart, directorySize, end)) throw badZip();
    const directoryEnd = directoryStart + directorySize;
    let cursor = directoryStart;
    let target = null;
    const names = new TextDecoder('utf-8');
    for (let i = 0; i < count; i++) {
      if (!has(cursor, 46, directoryEnd) || view.getUint32(cursor, true) !== 0x02014b50) throw badZip();
      const flags = view.getUint16(cursor + 8, true);
      const nameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const entryLength = 46 + nameLength + extraLength + commentLength;
      if (!has(cursor, entryLength, directoryEnd)) throw badZip();
      if (flags & 0x2041) throw failure('Verschlüsselte ZIP-Dateien können nicht importiert werden. Bitte entpacke conversations.json zuerst.');
      if (view.getUint16(cursor + 34, true)) throw failure('Mehrteilige ZIP-Archive werden nicht unterstützt.');
      const name = names.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
      if (/(^|\/)conversations\.json$/i.test(name.replace(/\\/g, '/'))) {
        if (target) throw failure('Diese ZIP-Datei enthält mehrere conversations.json-Dateien. Bitte importiere die gewünschte JSON-Datei direkt.');
        target = {
          name,
          flags,
          method: view.getUint16(cursor + 10, true),
          crc: view.getUint32(cursor + 16, true),
          compressed: view.getUint32(cursor + 20, true),
          size: view.getUint32(cursor + 24, true),
          offset: view.getUint32(cursor + 42, true)
        };
      }
      cursor += entryLength;
    }
    if (cursor !== directoryEnd) throw badZip();
    if (!target) throw failure('In dieser ZIP-Datei fehlt conversations.json. Bitte nutze den ChatGPT-Datenexport oder importiere TXT, Markdown oder JSON direkt.');
    if (target.size === 0xffffffff || target.compressed === 0xffffffff || target.offset === 0xffffffff) {
      throw failure('ZIP64-Archive werden nicht unterstützt. Bitte importiere conversations.json direkt.');
    }
    if (target.size > MAX_BYTES) throw failure('Die entpackte conversations.json ist größer als 100 MB. Bitte teile den Export in kleinere JSON-Dateien.');
    if (target.method !== 0 && target.method !== 8) throw failure('Diese ZIP-Komprimierung wird nicht unterstützt. Bitte entpacke conversations.json und importiere sie direkt.');
    if (!has(target.offset, 30, directoryStart) || view.getUint32(target.offset, true) !== 0x04034b50) throw badZip();
    const localFlags = view.getUint16(target.offset + 6, true);
    const localMethod = view.getUint16(target.offset + 8, true);
    const localNameLength = view.getUint16(target.offset + 26, true);
    const localExtraLength = view.getUint16(target.offset + 28, true);
    const headerLength = 30 + localNameLength + localExtraLength;
    if (!has(target.offset, headerLength, directoryStart) || localFlags !== target.flags || localMethod !== target.method) throw badZip();
    const localName = names.decode(bytes.subarray(target.offset + 30, target.offset + 30 + localNameLength));
    if (localName !== target.name) throw badZip();
    if (!(target.flags & 8) && (view.getUint32(target.offset + 14, true) !== target.crc || view.getUint32(target.offset + 18, true) !== target.compressed || view.getUint32(target.offset + 22, true) !== target.size)) throw badZip();
    const dataStart = target.offset + headerLength;
    if (!has(dataStart, target.compressed, directoryStart)) throw badZip();
    const compressed = bytes.subarray(dataStart, dataStart + target.compressed);
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const parts = [];
    let length = 0;
    let crc = 0xffffffff;
    const consume = chunk => {
      length += chunk.length;
      if (length > MAX_BYTES || length > target.size) throw failure('Die entpackte ZIP-Datei ist zu groß oder enthält falsche Größenangaben. Es wurde nichts importiert.');
      crc = crcUpdate(crc, chunk);
      parts.push(decoder.decode(chunk, { stream: true }));
    };
    if (target.method === 0) {
      if (target.compressed !== target.size) throw badZip();
      try { consume(compressed); } catch (error) {
        if (error instanceof TypeError) throw failure('conversations.json enthält keinen gültigen UTF-8-Text.', error);
        throw error;
      }
    } else {
      let decompressor;
      try { decompressor = new DecompressionStream('deflate-raw'); } catch (error) {
        throw failure('Dieser Browser kann den ZIP-Export nicht entpacken. Bitte nutze eine aktuelle Version von Chrome oder Edge oder importiere conversations.json direkt.', error);
      }
      const reader = new Blob([compressed]).stream().pipeThrough(decompressor).getReader();
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          consume(chunk.value);
        }
      } catch (error) {
        await reader.cancel().catch(() => {});
        if (error.message && error.message.startsWith('Die entpackte ZIP-Datei')) throw error;
        throw failure('conversations.json konnte nicht entpackt werden. Die ZIP-Datei ist beschädigt oder enthält ungültigen UTF-8-Text.', error);
      } finally {
        reader.releaseLock();
      }
    }
    if (length !== target.size || ((crc ^ 0xffffffff) >>> 0) !== target.crc) throw badZip();
    try { parts.push(decoder.decode()); } catch (error) {
      throw failure('conversations.json enthält keinen gültigen UTF-8-Text.', error);
    }
    return { text: parts.join(''), fileName: 'conversations.json' };
  }

  async function readImportFile(file) {
    if (!file || typeof file.name !== 'string' || typeof file.text !== 'function' || !Number.isFinite(file.size) || file.size < 0) {
      throw failure('Bitte wähle eine gültige Datei zum Importieren.');
    }
    if (file.size > MAX_BYTES) throw failure('Die Datei ist größer als 100 MB. Bitte importiere eine kleinere Datei.');
    if (/\.zip$/i.test(file.name)) return readZip(file);
    if (!/\.(txt|md|json)$/i.test(file.name)) throw failure('Bitte wähle eine TXT-, Markdown-, JSON-Datei oder einen ChatGPT-ZIP-Export.');
    try {
      return { text: await file.text(), fileName: file.name };
    } catch (error) {
      throw failure('Die Datei konnte nicht gelesen werden. Bitte wähle sie erneut aus.', error);
    }
  }

  window.LeonStorage = Object.freeze({ open, load, save, getMode: () => mode, readImportFile });
})();
