/**
 * Form-Data-Parser für Oak v12.6.1
 * Verarbeitet Multipart-Formulardaten mit Datei-Uploads
 */
export class FormDataParser {
  static async parseFormData(ctx) {
    try {
      const contentType = ctx.request.headers.get("content-type");

      if (!contentType || !contentType.includes("multipart/form-data")) {
        // Fallback für URL-encoded forms
        const body = ctx.request.body({ type: "form" });
        const formData = await body.value;
        return this.parseUrlEncodedData(formData);
      }

      const body = ctx.request.body({ type: "bytes" });
      const bytes = await body.value;

      const boundary = this.extractBoundary(contentType);
      if (!boundary) {
        throw new Error("Boundary nicht gefunden im Content-Type");
      }

      return this.parseMultipartBytes(bytes, boundary);
    } catch (error) {
      throw new Error(`Form-Data-Parsing fehlgeschlagen: ${error.message}`);
    }
  }

  static extractBoundary(contentType) {
    const match = contentType.match(/boundary=([^;]+)/);
    return match ? match[1].replace(/"/g, "") : null;
  }

  static parseMultipartBytes(bytes, boundary) {
    const formFields = {};
    const showsData = [];
    let posterFile = null;

    const boundaryBytes = new TextEncoder().encode(`--${boundary}`);
    const parts = this.splitBytesByBoundary(bytes, boundaryBytes);

    for (let i = 0; i < parts.length; i++) {
      const partBytes = parts[i];
      if (!partBytes || partBytes.length === 0) continue;

      try {
        const headerEndIndex = this.findHeaderEnd(partBytes);
        if (headerEndIndex === -1) continue;

        const headerBytes = partBytes.slice(0, headerEndIndex);
        const headerText = new TextDecoder().decode(headerBytes);
        const bodyBytes = partBytes.slice(headerEndIndex + 4);

        const nameMatch = headerText.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const name = nameMatch[1];
        const isFile = headerText.includes("filename=");

        if (isFile && name === "poster_file") {
          const filenameMatch = headerText.match(/filename="([^"]+)"/);
          const contentTypeMatch = headerText.match(
            /Content-Type:\s*([^\r\n]+)/i
          );

          if (filenameMatch && filenameMatch[1] && filenameMatch[1] !== "") {
            const filename = filenameMatch[1];
            const mimeType = contentTypeMatch
              ? contentTypeMatch[1].trim()
              : "application/octet-stream";

            posterFile = {
              name: filename,
              size: bodyBytes.length,
              type: mimeType,
              arrayBuffer() {
                return Promise.resolve(bodyBytes.buffer);
              },
            };
          }
        } else {
          const value = new TextDecoder().decode(bodyBytes).trim();
          this.processField(name, value, formFields, showsData);
        }
      } catch (_partError) {
        // Ignoriere fehlerhafte Parts
        continue;
      }
    }

    return {
      formFields,
      posterFile,
      showsData: showsData.filter((show) => show && (show.date || show.time)),
    };
  }

  static splitBytesByBoundary(bytes, boundaryBytes) {
    const parts = [];
    let start = 0;

    while (start < bytes.length) {
      const boundaryIndex = this.findBytesInBytes(bytes, boundaryBytes, start);
      if (boundaryIndex === -1) {
        if (start < bytes.length) {
          parts.push(bytes.slice(start));
        }
        break;
      }

      if (boundaryIndex > start) {
        parts.push(bytes.slice(start, boundaryIndex));
      }

      start = boundaryIndex + boundaryBytes.length;

      // Überspringe \r\n nach Boundary
      if (
        start < bytes.length - 1 &&
        bytes[start] === 0x0d &&
        bytes[start + 1] === 0x0a
      ) {
        start += 2;
      }
    }

    return parts;
  }

  static findBytesInBytes(haystack, needle, startIndex = 0) {
    for (let i = startIndex; i <= haystack.length - needle.length; i++) {
      let found = true;
      for (let j = 0; j < needle.length; j++) {
        if (haystack[i + j] !== needle[j]) {
          found = false;
          break;
        }
      }
      if (found) return i;
    }
    return -1;
  }

  static findHeaderEnd(bytes) {
    const pattern = [0x0d, 0x0a, 0x0d, 0x0a]; // \r\n\r\n
    return this.findBytesInBytes(bytes, new Uint8Array(pattern));
  }

  static parseUrlEncodedData(formData) {
    const formFields = {};
    const showsData = [];

    for (const [name, value] of formData.entries()) {
      this.processField(name, value, formFields, showsData);
    }

    return {
      formFields,
      posterFile: null,
      showsData: showsData.filter((show) => show && (show.date || show.time)),
    };
  }

  static processField(name, field, formFields, showsData) {
    if (name.startsWith("shows[")) {
      const match = name.match(/^shows\[(\d+)\]\[(date|time)\]$/);
      if (match) {
        const index = parseInt(match[1]);
        const fieldName = match[2];
        if (!showsData[index]) showsData[index] = {};
        showsData[index][fieldName] = field || "";
      }
    } else {
      formFields[name] = field || "";
    }
  }
}
