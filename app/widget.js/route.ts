import { NextRequest, NextResponse } from "next/server";

// /widget.js?shop=acme  ->  iframes <BASE>/embed/acme/book on host site.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("shop") || "";
  const origin = req.nextUrl.origin;

  const script = `
(function () {
  var BASE = ${JSON.stringify(origin)};
  var SHOP = ${JSON.stringify(slug)};
  if (!SHOP) {
    console.warn("[ShearSaaS] Missing ?shop=YOURSHOP on widget.js URL.");
    return;
  }
  var URL_BOOK = BASE + "/embed/" + encodeURIComponent(SHOP) + "/book";

  function mount(el) {
    if (el.dataset.salonMounted === "1") return;
    el.dataset.salonMounted = "1";
    var height = el.getAttribute("data-height") || "720";
    var iframe = document.createElement("iframe");
    iframe.src = URL_BOOK;
    iframe.title = "Book an appointment";
    iframe.loading = "lazy";
    iframe.style.cssText = "width:100%;border:0;display:block;border-radius:12px;background:transparent;";
    iframe.style.height = height + "px";
    iframe.setAttribute("allowtransparency", "true");
    el.appendChild(iframe);
    window.addEventListener("message", function (e) {
      if (e.source !== iframe.contentWindow) return;
      if (e.data && e.data.type === "salon-booking:resize" && typeof e.data.height === "number") {
        var next = Math.max(400, e.data.height);
        var cur = parseInt(iframe.style.height, 10) || 0;
        if (Math.abs(next - cur) > 2) iframe.style.height = next + "px";
      }
    });
  }

  function init() {
    var nodes = document.querySelectorAll("[data-salon-booking]");
    nodes.forEach(mount);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.SalonBooking = {
    mount: function (sel) { var el = typeof sel === "string" ? document.querySelector(sel) : sel; if (el) mount(el); },
    open: function () {
      var overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;";
      var panel = document.createElement("div");
      panel.style.cssText = "position:relative;width:100%;max-width:780px;height:90vh;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);";
      var close = document.createElement("button");
      close.innerHTML = "&times;";
      close.setAttribute("aria-label", "Close");
      close.style.cssText = "position:absolute;top:8px;right:12px;z-index:1;background:transparent;border:0;font-size:28px;cursor:pointer;line-height:1;color:#333;";
      close.addEventListener("click", function () { document.body.removeChild(overlay); });
      overlay.addEventListener("click", function (e) { if (e.target === overlay) document.body.removeChild(overlay); });
      var iframe = document.createElement("iframe");
      iframe.src = URL_BOOK;
      iframe.title = "Book an appointment";
      iframe.style.cssText = "width:100%;height:100%;border:0;display:block;";
      panel.appendChild(close);
      panel.appendChild(iframe);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
    }
  };
})();
`.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
