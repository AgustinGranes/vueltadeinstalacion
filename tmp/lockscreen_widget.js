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
    
    // Fila 2: Ubicación (Normal) | Sesión (Negrita)
    let row2 = widget.addStack();
    row2.centerAlignContent();
    
    let locName = ev.event || ""; 
    let loc = row2.addText(locName);
    loc.font = Font.systemFont(13);
    loc.textColor = Color.dynamic(Color.black(), Color.white());
    
    row2.addSpacer();
    
    let sess = row2.addText(ev.name);
    sess.font = Font.boldSystemFont(13);
    sess.textColor = Color.dynamic(Color.black(), Color.white());
    
    widget.addSpacer(2);
    
    // Fila 3: Fecha (Normal) | Hora (Normal)
    let row3 = widget.addStack();
    row3.centerAlignContent();
    
    const d = new Date(ev.startAt);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
    
    let dateText = row3.addText(dateStr);
    dateText.font = Font.systemFont(13);
    dateText.textColor = Color.dynamic(Color.black(), Color.white());
    
    row3.addSpacer();
    
    let timeStr = ev.time || "--:--";
    let timeText = row3.addText(timeStr);
    timeText.font = Font.systemFont(13);
    timeText.textColor = Color.dynamic(Color.black(), Color.white());
  }
} catch(e) {
  let err = widget.addText("Error / Sin red");
  err.font = Font.systemFont(12);
}

Script.setWidget(widget);
Script.complete();
