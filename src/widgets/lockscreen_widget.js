const widget = new ListWidget();
widget.url = "https://vueltadeinstalacion.vercel.app/";
widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 5);

try {
  let url = "https://vueltadeinstalacion.vercel.app/api/widget";
  if (args.widgetParameter) url += "?hidden=" + encodeURIComponent(args.widgetParameter);
  
  const events = await new Request(url).loadJSON();
  const upcomingEvents = events.filter(e => !e.isLive);
  
  if (upcomingEvents.length === 0) {
    let msg = widget.addText("Sin eventos");
    msg.font = Font.systemFont(12);
  } else {
    let ev = upcomingEvents[0];
    
    // Fila 1: Categoría (Negrita)
    let cat = widget.addText(ev.category);
    cat.font = Font.boldSystemFont(14);
    cat.textColor = Color.dynamic(Color.black(), Color.white());
    
    widget.addSpacer(2);
    
    // Fila 2: Ubicación
    let loc = widget.addText(ev.event || "");
    loc.font = Font.systemFont(12);
    loc.textColor = Color.dynamic(Color.black(), Color.white());
    loc.textOpacity = 0.8;
    
    widget.addSpacer(2);
    
    // Fila 3: Sesión (Izquierda) | Día Hora (Derecha)
    let row3 = widget.addStack();
    row3.centerAlignContent();
    
    let sess = row3.addText(ev.name);
    sess.font = Font.systemFont(12);
    sess.textColor = Color.dynamic(Color.black(), Color.white());
    
    row3.addSpacer();
    
    const d = new Date(ev.startAt);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let timeStr = ev.time || "--:--";
    let dateText = row3.addText(`${days[d.getDay()]} ${timeStr}`);
    dateText.font = Font.systemFont(12);
    dateText.textColor = Color.dynamic(Color.black(), Color.white());
  }
} catch(e) {
  let err = widget.addText("Error / Sin red");
  err.font = Font.systemFont(12);
}

Script.setWidget(widget);
Script.complete();
