const widget = new ListWidget();
widget.backgroundColor = Color.dynamic(new Color("#ffffff"), new Color("#151515"));
widget.setPadding(12, 14, 12, 14);
widget.url = "https://vueltadeinstalacion.vercel.app/";

// Forzar actualización agresiva cada 5 minutos
widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 5);

try {
  let url = "https://vueltadeinstalacion.vercel.app/api/widget";
  if (args.widgetParameter) url += "?hidden=" + encodeURIComponent(args.widgetParameter);
  
  const events = await new Request(url).loadJSON();
  
  const liveEvents = events.filter(e => e.isLive);
  const upcomingEvents = events.filter(e => !e.isLive);
  let isSplit = liveEvents.length > 0;
  
  if (config.widgetFamily === "small") {
    isSplit = false;
  }

  function renderEvents(container, evList) {
    if (evList.length === 0) {
      let msg = container.addText("Ninguno por ahora.");
      msg.font = Font.systemFont(11);
      msg.textColor = Color.gray();
      return;
    }
    for (let i = 0; i < evList.length; i++) {
      let ev = evList[i];
      let row = container.addStack();
      row.layoutVertically();
      
      // Fila 1: Categoría (Izq) | Sesión (Der)
      let top = row.addStack();
      top.centerAlignContent();
      
      let cat = top.addText(ev.category);
      cat.font = Font.boldSystemFont(11);
      cat.lineLimit = 1;
      
      if (ev.isLive) {
        cat.textColor = new Color(ev.color ? ev.color.replace('#','') : "ff3b30");
      } else {
        cat.textColor = Color.gray();
      }
      
      top.addSpacer();
      
      let sessName = top.addText(ev.name);
      sessName.font = Fo
<truncated 1237 bytes>
 (i < evList.length - 1) container.addSpacer(10);
    }
  }

  if (isSplit) {
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    
    // Columna Izquierda
    const leftCol = mainStack.addStack();
    leftCol.layoutVertically();
    const leftTitle = leftCol.addText("🔴 EN VIVO");
    leftTitle.font = Font.boldSystemFont(13);
    leftTitle.textColor = Color.red();
    leftCol.addSpacer(8);
    renderEvents(leftCol, liveEvents.slice(0, 4));
    
    mainStack.addSpacer(10); 
    
    // === LÍNEA SEPARADORA (150px de alto para forzar que toque bordes) ===
    const centerDividerStack = mainStack.addStack();
    centerDividerStack.layoutVertically();
    centerDividerStack.centerAlignContent();
    
    let divider = centerDividerStack.addStack();
    divider.backgroundColor = Color.dynamic(new Color("#d1d1d6"), new Color("#3a3a3c"));
    divider.size = new Size(1, 150); 
    
    mainStack.addSpacer(10); 
    
    // Columna Derecha
    const rightCol = mainStack.addStack();
    rightCol.layoutVertically();
    const rightTitle = rightCol.addText("🔜 Próximos");
    rightTitle.font = Font.boldSystemFont(13);
    rightTitle.textColor = Color.dynamic(Color.black(), Color.white());
    rightCol.addSpacer(8);
    renderEvents(rightCol, upcomingEvents.slice(0, 4));
    
  } else {
    const titleText = (liveEvents.length > 0) ? "🏎️ Próximos y En Vivo" : "🏎️ Próximos Eventos";
    const title = widget.addText(titleText);
    title.font = Font.boldSystemFont(14);
    title.textColor = Color.dynamic(Color.black(), Color.white());
    widget.addSpacer(10);
    
    if (events.length === 0) {
      let msg = widget.addText("No hay eventos esta semana.");
      msg.font = Font.systemFont(12);
      msg.textColor = Color.gray();
    } else {
      renderEvents(widget, events.slice(0, 4));
    }
  }
} catch(e) {
  let err = widget.addText("Sin conexión o error.");
  err.font = Font.systemFont(12);
  err.textColor = Color.red();
}

Script.setWidget(widget);
Script.complete();