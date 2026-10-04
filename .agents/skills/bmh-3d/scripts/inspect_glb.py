#!/usr/bin/env python3
"""Inspect GLB 2.0 structure and declared scene complexity; no licence inference."""
import argparse, json, struct
from pathlib import Path

def inspect(path):
    data = Path(path).read_bytes()
    if len(data) < 20:
        raise ValueError("GLB is truncated")
    magic, version, length = struct.unpack_from("<4sII", data)
    if magic != b"glTF" or version != 2 or length != len(data):
        raise ValueError("Expected a complete GLB 2.0 file")
    offset, document, binary_bytes = 12, None, 0
    while offset < length:
        if offset + 8 > length:
            raise ValueError("Truncated chunk header")
        size, kind = struct.unpack_from("<II", data, offset)
        offset += 8
        if size % 4 or offset + size > length:
            raise ValueError("Invalid chunk length")
        chunk = data[offset:offset + size]
        if kind == 0x4E4F534A:
            if document is not None:
                raise ValueError("Duplicate JSON chunk")
            document = json.loads(chunk.decode("utf-8").rstrip(" \x00"))
        elif kind == 0x004E4942:
            binary_bytes += size
        offset += size
    if not isinstance(document, dict) or document.get("asset", {}).get("version") != "2.0":
        raise ValueError("Missing glTF 2.0 JSON")
    accessors = document.get("accessors", [])
    primitives, triangles, bounds = 0, 0, []
    for mesh in document.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            primitives += 1
            position = primitive.get("attributes", {}).get("POSITION")
            if position is not None:
                if not isinstance(position, int) or not 0 <= position < len(accessors):
                    raise ValueError("Invalid POSITION accessor")
                accessor = accessors[position]
                bounds.append({"mesh": mesh.get("name", ""), "min": accessor.get("min"), "max": accessor.get("max")})
            else:
                accessor = {}
            index = primitive.get("indices")
            if index is not None and (not isinstance(index, int) or not 0 <= index < len(accessors)):
                raise ValueError("Invalid index accessor")
            count = accessors[index].get("count", 0) if index is not None else accessor.get("count", 0)
            mode = primitive.get("mode", 4)
            if mode == 4:
                triangles += count // 3
            elif mode in (5, 6):
                triangles += max(0, count - 2)
    return {"file": str(path), "bytes": length, "binary_bytes": binary_bytes,
            "nodes": len(document.get("nodes", [])), "meshes": len(document.get("meshes", [])),
            "primitives": primitives, "declared_triangles": triangles,
            "materials": len(document.get("materials", [])), "images": len(document.get("images", [])),
            "extensions_required": document.get("extensionsRequired", []), "local_accessor_bounds": bounds,
            "asset_metadata": document.get("asset", {}),
            "note": "Bounds are local accessor declarations, not world bounds. Compressed geometry needs its decoder. Verify redistribution rights with the original publisher."}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file")
    args = parser.parse_args()
    try:
        print(json.dumps(inspect(args.file), ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, TypeError, struct.error) as error:
        parser.exit(1, "Invalid GLB: " + str(error) + "\n")
