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
    
    let mainStack = widget.addStack();
    mainStack.centerAlignContent();
    
    let leftStack = mainStack.addStack();
    leftStack.layoutVertically();
    
    // Categoría (Negrita)
    let cat = leftStack.addText(ev.category);
    cat.font = Font.boldSystemFont(13);
    cat.textColor = Color.dynamic(Color.black(), Color.white());
    cat.lineLimit = 1;
    
    // Ubicación (evita duplicar el nombre de la categoría)
    if (ev.event && ev.event.toUpperCase() !== ev.category.toUpperCase()) {
      let loc = leftStack.addText(ev.event);
      loc.font = Font.systemFont(11);
      loc.textColor = Color.dynamic(Color.black(), Color.white());
      loc.textOpacity = 0.8;
      loc.lineLimit = 1;
    }
    
    // Fecha
    const d = new Date(ev.startAt);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let dateStr = `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
    let dateText = leftStack.addText(dateStr);
    dateText.font = Font.systemFont(11);
    dateText.textColor = Color.dynamic(Color.black(), Color.white());
    dateText.lineLimit = 1;
    
    mainStack.addSpacer();
    
    let rightStack = mainStack.addStack();
    rightStack.layoutVertically();
    
    // Sesión
    let sess = rightStack.addText(ev.name);
    sess.font = Font.systemFont(11);
    sess.textColor = Color.dynamic(Color.black(), Color.white());
    sess.rightAlignText();
    sess.lineLimit = 1;
    sess.minimumScaleFactor = 0.8;
    
    // Horario
    let timeStr = ev.time || "--:--";
    let timeText = rightStack.addText(timeStr);
    timeText.font = Font.systemFont(11);
    timeText.textColor = Color.dynamic(Color.black(), Color.white());
    timeText.rightAlignText();
  }
} catch(e) {
  let err = widget.addText("Error / Sin red");
  err.font = Font.systemFont(12);
}

Script.setWidget(widget);
Script.complete();
