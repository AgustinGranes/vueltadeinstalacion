const widget = new ListWidget();
widget.backgroundColor = Color.dynamic(new Color("#ffffff"), new Color("#151515"));

const fm = FileManager.local();
const pagePath = fm.joinPath(fm.documentsDirectory(), "vueltadeinstalacion_page.txt");
let currentPage = 0;

if (args.queryParameters && args.queryParameters.action) {
  if (fm.fileExists(pagePath)) {
    currentPage = parseInt(fm.readString(pagePath), 10) || 0;
  }
  if (args.queryParameters.action === "next") currentPage++;
  if (args.queryParameters.action === "prev") currentPage--;
  if (currentPage < 0) currentPage = 0;
  fm.writeString(pagePath, currentPage.toString());
} else if (config.runsInWidget) {
  if (fm.fileExists(pagePath)) {
    currentPage = parseInt(fm.readString(pagePath), 10) || 0;
  }
} else {
  currentPage = 0;
}

widget.url = "https://vueltadeinstalacion.vercel.app/";

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
  
  if (config.widgetFamily === "large" || config.widgetFamily === "extraLarge") {
    widget.setPadding(20, 20, 20, 20);
  } else {
    if (isSplit) {
      widget.setPadding(14, 14, 14, 14);
    } else {
      widget.setPadding(20, 18, 20, 18);
    }
  }
  
  const isLarge = config.widgetFamily === "large" || config.widgetFamily === "extraLarge";
  // One row is reserved for pagination in the upcoming section
  const maxEventsLive = isLarge ? 8 : 4;
  const maxEventsUpcoming = isLarge ? 7 : 3; 
  
  const titleSize = isLarge ? 14 : 12;
  const catSize = isLarge ? 12 : 10;
  const eventSize = isLarge ? 12 : 10;
  const dateSize = isLarge ? 11 : 9;
  
  const spacerTitle = isLarge ? 10 : 6;
  const spacerEvent = isLarge ? 8 : 4;
  const spacerRow = isLarge ? 2 : 1;

  function renderEvents(container, evList, isUpcoming = false) {
    if (evList.length === 0) {
      let msg = container.addText("Ninguno por ahora.");
      msg.font = Font.systemFont(11);
      msg.textColor = Color.gray();
      return;
    }
    
    let maxCount = isUpcoming ? maxEventsUpcoming : maxEventsLive;
    let totalPages = Math.ceil(evList.length / maxCount);
    if (isUpcoming && currentPage >= totalPages) currentPage = Math.max(0, totalPages - 1);
    
    let startIndex = isUpcoming ? currentPage * maxCount : 0;
    let displayList = evList.slice(startIndex, startIndex + maxCount);
    
    for (let i = 0; i < displayList.length; i++) {
      let ev = displayList[i];
      let row = container.addStack();
      row.layoutVertically();
      
      const d = new Date(ev.startAt);
      const days = ["dom.", "lun.", "mar.", "mié.", "jue.", "vie.", "sáb."];
      const dateStr = `${days[d.getDay()]} ${d.getDate()}`;
      const timeStr = ev.time || "--:--";
      
      let top = row.addStack();
      top.centerAlignContent();
      
      let titleRow = top.addStack();
      titleRow.layoutHorizontally();
      titleRow.centerAlignContent();
      
      let cat = titleRow.addText(ev.category);
      cat.font = Font.boldSystemFont(catSize);
      cat.lineLimit = 1;
      cat.textColor = ev.isLive ? new Color(ev.color ? ev.color.replace('#','') : "ff3b30") : Color.dynamic(Color.black(), Color.white());
      
      let sep = titleRow.addText(" - ");
      sep.font = Font.boldSystemFont(catSize);
      sep.textColor = Color.gray();
      
      let sessName = titleRow.addText(ev.name);
      sessName.font = Font.boldSystemFont(eventSize);
      sessName.textColor = Color.gray();
      sessName.lineLimit = 1;
      
      top.addSpacer();
      
      let timeText = top.addText(timeStr);
      timeText.font = Font.systemFont(dateSize);
      timeText.textColor = Color.dynamic(Color.black(), Color.white());
      
      row.addSpacer(spacerRow);
      let bottom = row.addStack();
      bottom.centerAlignContent();
      
      let locTextStr = ev.event || ev.circuit || "";
      if (ev.weather) locTextStr += `  ${ev.weather}`;
      let locText = bottom.addText(locTextStr);
      locText.font = Font.systemFont(dateSize);
      locText.textColor = Color.gray();
      locText.lineLimit = 1;
      
      bottom.addSpacer();
      
      let dateText = bottom.addText(dateStr);
      dateText.font = Font.systemFont(dateSize);
      dateText.textColor = Color.gray();
      
      if (i < displayList.length - 1) container.addSpacer(spacerEvent);
    }
    
    if (isUpcoming && evList.length > maxCount) {
      container.addSpacer(spacerEvent);
      let pagRow = container.addStack();
      pagRow.layoutHorizontally();
      pagRow.centerAlignContent();
      
      let leftArr = pagRow.addText("◀");
      leftArr.font = Font.boldSystemFont(14);
      leftArr.textColor = Color.dynamic(Color.black(), Color.white());
      if (currentPage > 0 && Script.name()) {
        leftArr.url = "scriptable:///run/" + encodeURIComponent(Script.name()) + "?action=prev";
      } else {
        leftArr.textColor = Color.gray();
      }
      
      pagRow.addSpacer();
      
      let pagText = pagRow.addText(`${currentPage + 1} / ${totalPages}`);
      pagText.font = Font.boldSystemFont(12);
      pagText.textColor = Color.dynamic(Color.black(), Color.white());
      
      pagRow.addSpacer();
      
      let rightArr = pagRow.addText("▶");
      rightArr.font = Font.boldSystemFont(14);
      rightArr.textColor = Color.dynamic(Color.black(), Color.white());
      if (currentPage < totalPages - 1 && Script.name()) {
        rightArr.url = "scriptable:///run/" + encodeURIComponent(Script.name()) + "?action=next";
      } else {
        rightArr.textColor = Color.gray();
      }
    }
  }

  if (isSplit) {
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    
    const leftCol = mainStack.addStack();
    leftCol.layoutVertically();
    if (!isLarge) leftCol.addSpacer(2);
    const leftTitle = leftCol.addText("EN VIVO:");
    leftTitle.font = Font.boldSystemFont(titleSize);
    leftTitle.textColor = Color.red();
    leftCol.addSpacer(8);
    renderEvents(leftCol, liveEvents, false);
    
    mainStack.addSpacer(10); 
    
    const centerDividerStack = mainStack.addStack();
    centerDividerStack.layoutVertically();
    centerDividerStack.centerAlignContent();
    
    let divider = centerDividerStack.addStack();
    divider.backgroundColor = Color.dynamic(new Color("#d1d1d6"), new Color("#3a3a3c"));
    
    let divHeight = isLarge ? 320 : 145;
    divider.size = new Size(1, divHeight);
    
    mainStack.addSpacer(10); 
    
    const rightCol = mainStack.addStack();
    rightCol.layoutVertically();
    if (!isLarge) rightCol.addSpacer(2);
    const rightTitle = rightCol.addText("PRÓXIMO:");
    rightTitle.font = Font.boldSystemFont(titleSize);
    rightTitle.textColor = Color.dynamic(Color.black(), Color.white());
    rightCol.addSpacer(8);
    renderEvents(rightCol, upcomingEvents, true);
    
  } else {
    const titleText = (liveEvents.length > 0) ? "PRÓXIMO Y EN VIVO:" : "PRÓXIMO:";
    const title = widget.addText(titleText);
    title.font = Font.boldSystemFont(titleSize + 2);
    title.textColor = Color.dynamic(Color.black(), Color.white());
    widget.addSpacer(spacerTitle);
    
    if (events.length === 0) {
      let msg = widget.addText("No hay eventos registrados por el momento.");
      msg.font = Font.systemFont(12);
      msg.textColor = Color.gray();
    } else {
      renderEvents(widget, upcomingEvents.length > 0 ? upcomingEvents : events, true);
    }
  }
} catch(e) {
  let err = widget.addText("Sin conexión o error.");
  err.font = Font.systemFont(12);
  err.textColor = Color.red();
}

Script.setWidget(widget);
Script.complete();