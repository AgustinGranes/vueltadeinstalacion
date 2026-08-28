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
  
  const cachePath = fm.joinPath(fm.documentsDirectory(), "vdi_widget_cache.json");
  let events = [];
  try {
    const req = new Request(url);
    req.timeoutInterval = 10;
    events = await req.loadJSON();
    fm.writeString(cachePath, JSON.stringify(events));
  } catch (err) {
    if (fm.fileExists(cachePath)) {
      events = JSON.parse(fm.readString(cachePath));
    } else {
      throw err;
    }
  }
  
  const liveEvents = events.filter(e => e.isLive);
  const upcomingEvents = events.filter(e => !e.isLive);
  let isSplit = liveEvents.length > 0;
  
  if (config.widgetFamily === "small") {
    isSplit = false;
  }
  
  if (config.widgetFamily === "large" || config.widgetFamily === "extraLarge") {
    widget.setPadding(16, 18, 16, 18);
  } else {
    if (isSplit) {
      widget.setPadding(12, 12, 12, 12);
    } else {
      widget.setPadding(18, 16, 18, 16);
    }
  }
  
  const isLarge = config.widgetFamily === "large" || config.widgetFamily === "extraLarge";
  // Cap events per column to prevent overflow
  const maxEventsLive = isLarge ? 8 : 4;
  const maxEventsUpcoming = isLarge ? 8 : 4; 
  
  const titleSize = isLarge ? 13 : 11;
  const catSize = isLarge ? 11 : 9.5;
  const eventSize = isLarge ? 11 : 9.5;
  const dateSize = isLarge ? 10 : 8.5;
  
  const spacerTitle = isLarge ? 8 : 5;
  const spacerEvent = isLarge ? 6 : 3;
  const spacerRow = isLarge ? 2 : 1;

  // Renders events into a column; returns { effectivePage, totalPages } for pagination info
  function renderEvents(container, evList, maxCount) {
    if (evList.length === 0) {
      let msg = container.addText("Ninguno por ahora.");
      msg.font = Font.systemFont(10);
      msg.textColor = Color.gray();
      return { effectivePage: 0, totalPages: 1 };
    }
    let totalPages = Math.ceil(evList.length / maxCount);
    let effectivePage = Math.min(currentPage, Math.max(0, totalPages - 1));
    let startIndex = effectivePage * maxCount;
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
      sep.lineLimit = 1;
      
      let sessName = titleRow.addText(ev.name);
      sessName.font = Font.boldSystemFont(eventSize);
      sessName.textColor = Color.gray();
      sessName.lineLimit = 1;
      
      top.addSpacer();
      
      let timeText = top.addText(timeStr);
      timeText.font = Font.systemFont(dateSize);
      timeText.textColor = Color.dynamic(Color.black(), Color.white());
      timeText.lineLimit = 1;
      
      row.addSpacer(spacerRow);
      let bottom = row.addStack();
      bottom.centerAlignContent();
      
      let locTextStr = ev.event || ev.circuit || "";
      let locText = bottom.addText(locTextStr);
      locText.font = Font.systemFont(dateSize);
      locText.textColor = Color.gray();
      locText.lineLimit = 1;

      if (!isSplit && ev.weatherData) {
        bottom.addSpacer(8);
        try {
          let sym = SFSymbol.named(ev.weatherData.sfSymbol);
          if (sym) {
            let wImg = bottom.addImage(sym.image);
            wImg.imageSize = new Size(dateSize, dateSize);
            wImg.tintColor = Color.white();
            bottom.addSpacer(4);
          }
        } catch(e) {}
        
        let tempText = bottom.addText(`${ev.weatherData.temp}°C`);
        tempText.font = Font.boldSystemFont(dateSize);
        tempText.textColor = Color.white();
        
        if (ev.weatherData.rain > 0) {
          bottom.addSpacer(4);
          let rainText = bottom.addText(`${ev.weatherData.rain}%`);
          rainText.font = Font.boldSystemFont(dateSize);
          rainText.textColor = new Color("60a5fa");
        }
      } else if (!isSplit && ev.weather) {
        let wText = bottom.addText(`  ${ev.weather}`);
        wText.font = Font.systemFont(dateSize);
        wText.textColor = Color.white();
      }
      
      bottom.addSpacer();
      
      let dateText = bottom.addText(dateStr);
      dateText.font = Font.systemFont(dateSize);
      dateText.textColor = Color.gray();
      dateText.lineLimit = 1;
      
      if (i < displayList.length - 1) container.addSpacer(spacerEvent);
    }
    
    return { effectivePage, totalPages };
  }

  // Renders a pagination bar at the bottom of a column
  function renderPagination(container, effectivePage, totalPages) {
    let pagRow = container.addStack();
    pagRow.layoutHorizontally();
    pagRow.centerAlignContent();
    
    let leftSym = null;
    try { leftSym = SFSymbol.named("chevron.left"); } catch(e) {}
    let leftArr = leftSym ? pagRow.addImage(leftSym.image) : pagRow.addText("◀");
    if (leftSym) {
      leftArr.imageSize = new Size(10, 10);
      leftArr.tintColor = Color.dynamic(Color.black(), Color.white());
    } else {
      leftArr.font = Font.boldSystemFont(12);
      leftArr.textColor = Color.dynamic(Color.black(), Color.white());
    }
    if (effectivePage > 0 && Script.name()) {
      leftArr.url = "scriptable:///run/" + encodeURIComponent(Script.name()) + "?action=prev";
    } else {
      if (leftSym) leftArr.tintColor = Color.gray();
      else leftArr.textColor = Color.gray();
    }
    
    pagRow.addSpacer();
    
    let pagText = pagRow.addText(`${effectivePage + 1} / ${totalPages}`);
    pagText.font = Font.boldSystemFont(10);
    pagText.textColor = Color.dynamic(Color.black(), Color.white());
    
    pagRow.addSpacer();
    
    let rightSym = null;
    try { rightSym = SFSymbol.named("chevron.right"); } catch(e) {}
    let rightArr = rightSym ? pagRow.addImage(rightSym.image) : pagRow.addText("▶");
    if (rightSym) {
      rightArr.imageSize = new Size(10, 10);
      rightArr.tintColor = Color.dynamic(Color.black(), Color.white());
    } else {
      rightArr.font = Font.boldSystemFont(12);
      rightArr.textColor = Color.dynamic(Color.black(), Color.white());
    }
    if (effectivePage < totalPages - 1 && Script.name()) {
      rightArr.url = "scriptable:///run/" + encodeURIComponent(Script.name()) + "?action=next";
    } else {
      if (rightSym) rightArr.tintColor = Color.gray();
      else rightArr.textColor = Color.gray();
    }
  }

  if (isSplit) {
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    
    // ── Left column: EN VIVO ──
    const leftCol = mainStack.addStack();
    leftCol.layoutVertically();
    const leftTitle = leftCol.addText("EN VIVO:");
    leftTitle.font = Font.boldSystemFont(titleSize);
    leftTitle.textColor = Color.red();
    leftCol.addSpacer(spacerTitle);
    
    const liveInfo = renderEvents(leftCol, liveEvents, maxEventsLive);
    
    // Push pagination to the bottom
    leftCol.addSpacer();
    
    const liveNeedsPag = liveEvents.length > maxEventsLive;
    if (liveNeedsPag) {
      renderPagination(leftCol, liveInfo.effectivePage, liveInfo.totalPages);
    }
    
    mainStack.addSpacer(8); 
    
    // ── Center divider ──
    const centerDividerStack = mainStack.addStack();
    centerDividerStack.layoutVertically();
    centerDividerStack.centerAlignContent();
    
    let divider = centerDividerStack.addStack();
    divider.backgroundColor = Color.dynamic(new Color("#d1d1d6"), new Color("#3a3a3c"));
    
    let divHeight = isLarge ? 300 : 135;
    divider.size = new Size(1, divHeight);
    
    mainStack.addSpacer(8); 
    
    // ── Right column: PRÓXIMO ──
    const rightCol = mainStack.addStack();
    rightCol.layoutVertically();
    const rightTitle = rightCol.addText("PRÓXIMO:");
    rightTitle.font = Font.boldSystemFont(titleSize);
    rightTitle.textColor = Color.dynamic(Color.black(), Color.white());
    rightCol.addSpacer(spacerTitle);
    
    const upInfo = renderEvents(rightCol, upcomingEvents, maxEventsUpcoming);
    
    // Push pagination to the bottom (same level as left column)
    rightCol.addSpacer();
    
    const upNeedsPag = upcomingEvents.length > maxEventsUpcoming;
    if (upNeedsPag) {
      renderPagination(rightCol, upInfo.effectivePage, upInfo.totalPages);
    }
    
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
      const allEvents = upcomingEvents.length > 0 ? upcomingEvents : events;
      const maxSingle = isLarge ? 8 : 3;
      const info = renderEvents(widget, allEvents, maxSingle);
      
      if (allEvents.length > maxSingle) {
        widget.addSpacer();
        renderPagination(widget, info.effectivePage, info.totalPages);
      }
    }
  }
} catch(e) {
  let err = widget.addText("Sin conexión o error.");
  err.font = Font.systemFont(12);
  err.textColor = Color.red();
}

Script.setWidget(widget);
Script.complete();