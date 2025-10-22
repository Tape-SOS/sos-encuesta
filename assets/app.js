(function(){
  const qs = new URLSearchParams(location.search);
  const token = qs.get("t") || "";
  const eventId = qs.get("e") || "";
  const form = document.getElementById("ratingForm");
  const state = document.getElementById("state");
  const sendBtn = document.getElementById("sendBtn");
  const y = document.getElementById("y");
  y.textContent = new Date().getFullYear();

  // Montar 5 estrellas accesibles por bloque
  document.querySelectorAll(".stars").forEach(stars => {
    for(let i=1;i<=5;i++){
      const span = document.createElement("span");
      span.className = "star";
      span.setAttribute("role", "radio");
      span.setAttribute("aria-checked", "false");
      span.setAttribute("tabindex", "0");
      span.dataset.value = i;
      span.textContent = "★";
      span.addEventListener("click", () => select(stars, i));
      span.addEventListener("keydown", (e) => { if(e.key==="Enter"||e.key===" "){ e.preventDefault(); select(stars, i); } });
      stars.appendChild(span);
    }
  });

  function select(container, val){
    container.querySelectorAll(".star").forEach(s=>{
      const active = Number(s.dataset.value) <= val;
      s.classList.toggle("is-active", active);
      s.setAttribute("aria-checked", active && Number(s.dataset.value)===val ? "true":"false");
    });
    container.dataset.selected = String(val);
  }

  // Cargar hidden
  document.getElementById("token").value = token;
  document.getElementById("eventId").value = eventId;

  // Validación de link
  if(!token || !eventId){
    show("Link inválido. Por favor solicita uno nuevo.", false);
    form.classList.add("hidden");
    return;
  }

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const attention = Number(document.querySelector('.stars[data-field="attention"]').dataset.selected || 0);
    const solution  = Number(document.querySelector('.stars[data-field="solution"]').dataset.selected  || 0);
    const wait      = Number(document.querySelector('.stars[data-field="wait"]').dataset.selected      || 0);
    const comment   = (document.getElementById("comment").value || "").trim();

    if(!attention || !solution || !wait){
      show("Por favor selecciona una calificación en las tres preguntas.", false);
      return;
    }

    sendBtn.disabled = true;

    // Para evitar preflight CORS usamos text/plain (el Flow parseará JSON desde texto)
    const payload = JSON.stringify({
      token,
      eventId: Number(eventId),
      attention,      // 1-5
      solution,       // 1-5
      wait,           // 1-5
      comment,        // opcional
      ua: navigator.userAgent,
      ts: new Date().toISOString()
    });

    try{
      const res = await fetch(FLOW_URL, {
        method: "POST",
        headers: {"Content-Type":"text/plain;charset=UTF-8"},
        body: payload,
        cache: "no-store"
      });
      const data = await res.json().catch(()=> ({}));

      if(res.ok && data?.status === "ok"){
        show("¡Gracias! Tu calificación fue registrada.", true);
        form.reset();
        form.classList.add("hidden");
      }else{
        const msg = data?.message || `No se pudo registrar la calificación (HTTP ${res.status}).`;
        show(msg, false);
        sendBtn.disabled = false;
      }
    }catch(err){
      show("Error de red al enviar la calificación. Intenta de nuevo.", false);
      sendBtn.disabled = false;
    }
  });

  function show(msg, ok){
    state.textContent = msg;
    state.className = ok ? "ok" : "err";
    state.classList.remove("hidden");
  }
})();
