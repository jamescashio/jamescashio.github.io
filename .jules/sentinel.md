## 2026-05-03 - [DOM XSS via innerHTML Anti-pattern]
**Vulnerability:** Found uses of `element.innerHTML += ...` and `element.innerHTML = ''` where dynamic or user-controlled content could potentially lead to Cross-Site Scripting (XSS) if not sanitized.
**Learning:** Using `innerHTML` destroys event listeners attached to existing elements within the element, and when used to append user-controlled data, represents a significant XSS risk by interpreting data as HTML.
**Prevention:** Always use safe DOM manipulation methods such as `document.createElement()`, `document.createTextNode()`, `element.appendChild()`, and `element.textContent = ''` for clearing or setting plain text content.
