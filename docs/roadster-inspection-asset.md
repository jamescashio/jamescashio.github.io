# Roadster inspection asset

This homepage inspection uses the original independent Roadster CAD reconstruction already published in Roadster Studio. It is an illustrative design study, not a validated vehicle or flight capability.

Source: Roadster Studio revision 42 presentation, native geometry revision 35, published Studio version 38. Original asset name: `roadster-a1266057d40b.glb`.

Original SHA256: `a1266057d40b348d69eab67cd5233191bd4876a2afaad6cb0b759fadbed380e5`.

The delivery file `public/models/roadster-inspection.glb.gz` is a deterministic, lossless gzip of that 17,575,480 byte GLB. It is 6,920,047 bytes. Decompressing it reproduces the exact original hash, 699 named meshes and native vertices. No geometry simplification, coordinate quantization or texture generation is involved. Native gzip decompression avoids adding a decoder, external host or broader content policy. The full Studio remains the destination for its richer materials, animations and design notes.

The homepage renderer uses the original named part families to assign lightweight pearl, bronze, rubber and metal materials. Static parts sharing a material are merged in memory to reduce draw calls. Three explicit views and direct controls replace the full Studio's larger control surface. Rendering is requested only for input, resize or a finite camera transition; hidden and offscreen views suspend that work. Loading is explicitly requested by the visitor. Failure or unsupported decompression leaves the poster and Studio link available.

Attribution retained in the source GLB: "Independent reconstruction. Tesla references acknowledged in RESEARCH.md." Source generator: "House Cashio Roadster Studio. Native build123d CAD tessellation." This is Doug's independent study, not an official Tesla product visualization.
