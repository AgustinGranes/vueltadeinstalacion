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
    // Fila 1: Categoría
    let row1 = widget.addStack();
    let cat = row1.addText(ev.category);
    cat.font = Font.boldSystemFont(13);
    cat.textColor = Color.dynamic(Color.black(), Color.white());
    cat.lineLimit = 1;
    row1.addSpacer();
    
    // Fila 2: Ubicación | Sesión
    let row2 = widget.addStack();
    row2.centerAlignContent();
    
    if (ev.event && ev.event.toUpperCase() !== ev.category.toUpperCase()) {
      let loc = row2.addText(ev.event);
      loc.font = Font.systemFont(13);
      loc.textColor = Color.dynamic(Color.black(), Color.white());
      loc.lineLimit = 1;
    }
    
    row2.addSpacer();
    
    let sess = row2.addText(ev.name);
    sess.font = Font.systemFont(13);
    sess.textColor = Color.dynamic(Color.black(), Color.white());
    sess.lineLimit = 1;
    
    // Fila 3: Fecha | Horario
    let row3 = widget.addStack();
    row3.centerAlignContent();
    
    const d = new Date(ev.startAt);
    const days = ["dom.", "lun.", "mar.", "mié.", "jue.", "vie.", "sáb."];
    const months = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
    let dateStr = `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
    let dateText = row3.addText(dateStr);
    dateText.font = Font.systemFont(13);
    dateText.textColor = Color.dynamic(Color.black(), Color.white());
    dateText.lineLimit = 1;
    
    row3.addSpacer();
    
    let timeStr = ev.time || "--:--";
    let timeText = row3.addText(timeStr);
    timeText.font = Font.systemFont(13);
    timeText.textColor = Color.dynamic(Color.black(), Color.white());
    timeText.lineLimit = 1;
  }
} catch(e) {
  let err = widget.addText("Error / Sin red");
  err.font = Font.systemFont(12);
}

Script.setWidget(widget);
Script.complete();
