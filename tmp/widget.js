const widget = new ListWidget();
widget.backgroundColor = Color.dynamic(new Color("#ffffff"), new Color("#151515"));

// Acción al tocar el widget:
widget.url = "https://vueltadeinstalacion.vercel.app/";

// Forzar actualización agresiva cada 5 minutos
widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 5);

try {
  let url = "https://vueltadeinstalacion.vercel.app/api/widget";
  if (args.widgetParameter) url += "?hidden=" + encodeURIComponent(args.widgetParameter);
  
  const events = await new Request(url).loadJSON();
  
  // DESHABILITADO TEMPORALMENTE PARA PRUEBAS:
  const liveEvents = []; // events.filter(e => e.isLive);
  const upcomingEvents = events; // events.filter(e => !e.isLive);
  let isSplit = false; // liveEvents.length > 0;
  
  if (config.widgetFamily === "small") {
    isSplit = false;
  }
  
  // Padding dinámico basado en tamaño y estado (dividido o no)
  if (config.widgetFamily === "large" || config.widgetFamily === "extraLarge") {
    widget.setPadding(20, 20, 20, 20);
  } else {
    if (isSplit) {
      widget.setPadding(14, 14, 14, 14); // Menos padding para no asfixiar el contenido dividido
    } else {
      widget.setPadding(30, 18, 30, 18); // Más padding arriba/abajo, menos a los costados
    }
  }
  
  // Dynamic sizing based on widget family
  const isLarge = config.widgetFamily === "large" || config.widgetFamily === "extraLarge";
  const maxEvents = isLarge ? 8 : 4;
  const titleSize = isLarge ? 14 : 12;
  const catSize = isLarge ? 12 : 10;
  const eventSize = isLarge ? 12 : 10;
  const dateSize = isLarge ? 11 : 9;

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
      
      // Procesar la fecha
      const d = new Date(ev.startAt);
      const days = ["dom.", "lun.", "mar.", "mié.", "jue.", "vie.", "sáb."];
      const dateStr = `${days[d.getDay()]} ${d.getDate()}`;
      const timeStr = ev.time || "--:--";
      
      // Fila 1: Categoría (Izq) | Sesión (Der)
      let top = row.addStack();
      top.centerAlignContent();
      
      let cat = top.addText(ev.category);
      cat.font = Font.boldSystemFont(catSize);
      cat.lineLimit = 1;
      
      if (ev.isLive) {
        cat.textColor = new Color(ev.color ? ev.color.replace('#','') : "ff3b30");
      } else {
        cat.textColor = Color.gray();
      }
      
      top.addSpacer();
      
      let sessName = top.addText(ev.name);
      sessName.font = Font.boldSystemFont(eventSize);
      sessName.textColor = Color.dynamic(Color.black(), Color.white());
      sessName.lineLimit = 1;
      
      // Fila 2: Fecha (Izq) | Hora (Der)
      row.addSpacer(1);
      let bottom = row.addStack();
      bottom.centerAlignContent();
      
      let dateText = bottom.addText(dateStr);
      dateText.font = Font.systemFont(dateSize);
      dateText.textColor = Color.gray();
      
      bottom.addSpacer();
      
      let timeText = bottom.addText(timeStr);
      timeText.font = Font.systemFont(dateSize);
      timeText.textColor = Color.gray();
      
      if (i < evList.length - 1) container.addSpacer(4);
    }
  }

  if (isSplit) {
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    
    // Columna Izquierda
    const leftCol = mainStack.addStack();
    leftCol.layoutVertically();
    const leftTitle = leftCol.addText("EN VIVO:");
    leftTitle.font = Font.boldSystemFont(titleSize);
    leftTitle.textColor = Color.red();
    leftCol.addSpacer(8);
    renderEvents(leftCol, liveEvents.slice(0, maxEvents));
    
    mainStack.addSpacer(10); 
    
    // === LÍNEA SEPARADORA COMPLETA ===
    const centerDividerStack = mainStack.addStack();
    centerDividerStack.layoutVertically();
    centerDividerStack.centerAlignContent();
    
    let divider = centerDividerStack.addStack();
    divider.backgroundColor = Color.dynamic(new Color("#d1d1d6"), new Color("#3a3a3c"));
    
    // Altura calculada para el widget grande: un poco más corta que antes y ajustada al nuevo padding
    let divHeight = isLarge ? 320 : 145;
    divider.size = new Size(1, divHeight);
    
    mainStack.addSpacer(10); 
    
    // Columna Derecha
    const rightCol = mainStack.addStack();
    rightCol.layoutVertically();
    const rightTitle = rightCol.addText("Próximos:");
    rightTitle.font = Font.boldSystemFont(titleSize);
    rightTitle.textColor = Color.gray();
    rightCol.addSpacer(8);
    renderEvents(rightCol, upcomingEvents.slice(0, maxEvents));
    
  } else {
    const titleText = (liveEvents.length > 0) ? "Próximos y En Vivo:" : "Próximos:";
    const title = widget.addText(titleText);
    title.font = Font.boldSystemFont(titleSize + 2);
    title.textColor = Color.dynamic(Color.black(), Color.white());
    widget.addSpacer(6);
    
    if (events.length === 0) {
      let msg = widget.addText("No hay eventos registrados por el momento.");
      msg.font = Font.systemFont(12);
      msg.textColor = Color.gray();
    } else {
      renderEvents(widget, events.slice(0, maxEvents));
    }
  }
} catch(e) {
  let err = widget.addText("Sin conexión o error.");
  err.font = Font.systemFont(12);
  err.textColor = Color.red();
}

Script.setWidget(widget);
Script.complete();