const widget = new ListWidget();
// Acción al tocar el widget: abre tu app
widget.url = "https://vueltadeinstalacion.vercel.app/";

// Forzar actualización cada 5 minutos
widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 5);

try {
  let url = "https://vueltadeinstalacion.vercel.app/api/widget";
  if (args.widgetParameter) url += "?hidden=" + encodeURIComponent(args.widgetParameter);
  
  const events = await new Request(url).loadJSON();
  
  // Filtrar solo los próximos eventos (ignorar los EN VIVO)
  const upcomingEvents = events.filter(e => !e.isLive);
  
  if (upcomingEvents.length === 0) {
    let msg = widget.addText("Sin eventos hoy");
    msg.font = Font.systemFont(12);
  } else {
    // Tomamos el próximo evento más inmediato
    let ev = upcomingEvents[0];
    
    // 1. Etiqueta de estado
    let status = widget.addText("🔜 PRÓXIMO");
    status.font = Font.boldSystemFont(10);
    
    // 2. Categoría
    let cat = widget.addText(ev.category);
    cat.font = Font.boldSystemFont(13);
    
    // 3. Sesión y Hora
    let timeText = ev.time || "--:--";
    let desc = widget.addText(`${ev.name} • ${timeText}`);
    desc.font = Font.systemFont(11);
    desc.textColor = Color.gray();
  }
} catch(e) {
  let err = widget.addText("Sin conexión");
  err.font = Font.systemFont(12);
}

Script.setWidget(widget);
Script.complete();
