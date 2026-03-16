import { useState, useEffect, useCallback } from 'react';
import { Calendar, Home, Newspaper, RefreshCw, ArrowLeft, ExternalLink, Trophy, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService, getCategoryColor } from './data/dataService';
import type { Race, CalendarRace, NewsItem, F1StandingsRow, F1ConstructorRow, WRCStandings, WRCCalendarEvent, TCStandingRow, NascarStandings } from './data/dataService';
import './App.css';

type CategoryType = 'F1' | 'WRC' | 'NASCAR' | 'IndyCar' | 'TC' | 'TCP' | 'TCM' | 'TCPM' | 'TCPK' | 'TCPPK' | 'TC2000';
type MainTab = 'home' | 'calendario' | 'noticias';
type CalendarViewMode = 'semanal' | 'categoria';
type CategorySubTab = 'calendar' | 'standings' | 'news';

const WRC_LOGO = '/WRC.png';
const F1_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg';
const TC_LOGO = '/TC.png';
const TCP_LOGO = '/TCP.png';
const TCPK_LOGO = '/TCPK.png';
const INDYCAR_LOGO = '/INDYCAR.png';



const App = () => {
  // Navigation
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [view, setView] = useState<'main' | 'category'>('main');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('F1');
  const [categorySubTab, setCategorySubTab] = useState<CategorySubTab>('calendar');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('semanal');

  // Data
  const [weeklyRaces, setWeeklyRaces] = useState<Race[]>([]);
  const [f1Calendar, setF1Calendar] = useState<CalendarRace[]>([]);
  const [wrcCalendar, setWrcCalendar] = useState<WRCCalendarEvent[]>([]);
  const [tcpCalendar, setTcpCalendar] = useState<CalendarRace[]>([]);
  const [tcmCalendar, setTcmCalendar] = useState<CalendarRace[]>([]);
  const [tcpmCalendar, setTcpmCalendar] = useState<CalendarRace[]>([]);
  const [tcpkCalendar, setTcpkCalendar] = useState<CalendarRace[]>([]);
  const [tcppkCalendar, setTcppkCalendar] = useState<CalendarRace[]>([]);
  const [tc2000Calendar, setTc2000Calendar] = useState<CalendarRace[]>([]);
  const [indyCalendar, setIndyCalendar] = useState<CalendarRace[]>([]);
  
  const [f1Drivers, setF1Drivers] = useState<F1StandingsRow[]>([]);
  const [f1Constructors, setF1Constructor] = useState<F1ConstructorRow[]>([]);
  const [wrcStandingsTab, setWrcStandingsTab] = useState<'drivers' | 'manufacturers'>('drivers');
  const [wrcStandings, setWrcStandings] = useState<WRCStandings>({ drivers: [], codrivers: [], manufacturers: [], teams: [] });
  const [tcDrivers, setTcDrivers] = useState<TCStandingRow[]>([]);
  const [tcpDrivers, setTcpDrivers] = useState<TCStandingRow[]>([]);
  const [tcmDrivers, setTcmDrivers] = useState<TCStandingRow[]>([]);
  const [tcpmDrivers, setTcpmDrivers] = useState<TCStandingRow[]>([]);
  const [tcpkDrivers, setTcpkDrivers] = useState<TCStandingRow[]>([]);
  const [tcppkDrivers, setTcppkDrivers] = useState<TCStandingRow[]>([]);
  const [tc2000Drivers, setTc2000Drivers] = useState<TCStandingRow[]>([]);
  const [tc2000Teams, setTc2000Teams] = useState<TCStandingRow[]>([]);
  const [tc2000Brands, setTc2000Brands] = useState<TCStandingRow[]>([]);
  const [indyDrivers, setIndyDrivers] = useState<TCStandingRow[]>([]);

  const [f1StandingsTab, setF1StandingsTab] = useState<'drivers' | 'constructors'>('drivers');
  const [f1News, setF1News] = useState<NewsItem[]>([]);
  const [wrcNews, setWrcNews] = useState<NewsItem[]>([]);
  const [tcNews, setTcNews] = useState<NewsItem[]>([]);
  const [tcpNews, setTcpNews] = useState<NewsItem[]>([]);
  const [tcmNews, setTcmNews] = useState<NewsItem[]>([]);
  const [tcpmNews, setTcpmNews] = useState<NewsItem[]>([]);
  const [tcpkNews, setTcpkNews] = useState<NewsItem[]>([]);
  const [tcppkNews, setTcppkNews] = useState<NewsItem[]>([]);
  const [tc2000News, setTc2000News] = useState<NewsItem[]>([]);
  const [tc2000StandingsTab, setTc2000StandingsTab] = useState<'drivers' | 'teams' | 'brands'>('drivers');
  const [nascarCalendar, setNascarCalendar] = useState<CalendarRace[]>([]);
  const [nascarStandings, setNascarStandings] = useState<NascarStandings>({ drivers: [], owners: [], manufacturers: [] });
  const [nascarStandingsTab, setNascarStandingsTab] = useState<'drivers' | 'manufacturers'>('drivers');
  const [nascarNews, setNascarNews] = useState<NewsItem[]>([]);
  const [indyNews, setIndyNews] = useState<NewsItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isHomeLoading, setIsHomeLoading] = useState(false);
  const [isGlobalNewsLoading, setIsGlobalNewsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [expandedWeeklySection, setExpandedWeeklySection] = useState<'upcoming' | 'finished' | null>(null);

  const [loadedData, setLoadedData] = useState<Set<string>>(new Set());

  const fetchCategoryData = useCallback(async (cat: CategoryType) => {
    if (loadedData.has(cat)) return;
    setIsCategoryLoading(true);
    try {
      if (cat === 'F1') {
        const [cal, news, stand] = await Promise.all([
          dataService.getF1Calendar(),
          dataService.getF1News(),
          dataService.getF1StandingsFull()
        ]);
        setF1Calendar(cal);
        setF1News(news);
        setF1Drivers(stand.drivers);
        setF1Constructor(stand.constructors);
      } else if (cat === 'WRC') {
        const [news, stand, cal] = await Promise.all([
          dataService.getWRCNews(),
          dataService.getWRCStandings(),
          dataService.getWRCCalendar()
        ]);
        setWrcNews(news);
        setWrcStandings(stand);
        setWrcCalendar(cal);
      } else if (cat === 'TC') {
        const [news, stand] = await Promise.all([
          dataService.getTCNews(),
          dataService.getTCStandings()
        ]);
        setTcNews(news);
        setTcDrivers(stand);
      } else if (cat === 'TCP') {
        const [news, stand, cal] = await Promise.all([
          dataService.getTCPNews(),
          dataService.getTCPStandings(),
          dataService.getTCPCalendar()
        ]);
        setTcpNews(news);
        setTcpDrivers(stand);
        setTcpCalendar(cal);
      } else if (cat === 'TCM') {
        const [news, stand, cal] = await Promise.all([
          dataService.getTCMNews(),
          dataService.getTCMStandings(),
          dataService.getTCMCalendar()
        ]);
        setTcmNews(news);
        setTcmDrivers(stand);
        setTcmCalendar(cal);
      } else if (cat === 'TCPM') {
        const [news, stand, cal] = await Promise.all([
          dataService.getTCPMNews(),
          dataService.getTCPMStandings(),
          dataService.getTCPMCalendar()
        ]);
        setTcpmNews(news);
        setTcpmDrivers(stand);
        setTcpmCalendar(cal);
      } else if (cat === 'TCPK') {
        const [news, stand, cal] = await Promise.all([
          dataService.getTCPKNews(),
          dataService.getTCPKStandings(),
          dataService.getTCPKCalendar()
        ]);
        setTcpkNews(news);
        setTcpkDrivers(stand);
        setTcpkCalendar(cal);
      } else if (cat === 'TCPPK') {
        const [news, stand, cal] = await Promise.all([
          dataService.getTCPPKNews(),
          dataService.getTCPPKStandings(),
          dataService.getTCPPKCalendar()
        ]);
        setTcppkNews(news);
        setTcppkDrivers(stand);
        setTcppkCalendar(cal);
      } else if (cat === 'IndyCar') {
        const [cal, stand, news] = await Promise.all([
          dataService.getIndyCarCalendar(),
          dataService.getIndyCarStandings(),
          dataService.getIndyCarNews()
        ]);
        setIndyCalendar(cal);
        setIndyDrivers(stand);
        setIndyNews(news);
      } else if (cat === 'NASCAR') {
        const [news, stand, cal] = await Promise.all([
          dataService.getNascarNews(),
          dataService.getNascarStandings(),
          dataService.getNascarCalendar()
        ]);
        setNascarNews(news);
        setNascarStandings(stand);
        setNascarCalendar(cal);
      } else if (cat === 'TC2000') {
        const [news, stand, cal] = await Promise.all([
          dataService.getTC2000News(),
          dataService.getTC2000Standings(),
          dataService.getTC2000Calendar()
        ]);
        setTc2000News(news);
        setTc2000Drivers(stand.drivers);
        setTc2000Teams(stand.teams);
        setTc2000Brands(stand.brands);
        setTc2000Calendar(cal);
      }
      setLoadedData(prev => new Set(prev).add(cat));
    } catch (e) {
      console.error(`Fetch error for ${cat}:`, e);
    } finally {
      setIsCategoryLoading(false);
    }
  }, [loadedData]);

  const fetchGlobalNews = useCallback(async () => {
    if (loadedData.has('globalNews')) return;
    setIsGlobalNewsLoading(true);
    try {
      const results = await Promise.allSettled([
        dataService.getF1News(),
        dataService.getWRCNews(),
        dataService.getTCNews(),
        dataService.getIndyCarNews(),
        dataService.getNascarNews(),
        dataService.getTC2000News(),
      ]);
      if (results[0].status === 'fulfilled') setF1News(results[0].value);
      if (results[1].status === 'fulfilled') setWrcNews(results[1].value);
      if (results[2].status === 'fulfilled') setTcNews(results[2].value);
      if (results[3].status === 'fulfilled') setIndyNews(results[3].value);
      if (results[4].status === 'fulfilled') setNascarNews(results[4].value);
      if (results[5].status === 'fulfilled') setTc2000News(results[5].value);
      setLoadedData(prev => new Set(prev).add('globalNews'));
    } catch (e) {
      console.error('Global news fetch error:', e);
    } finally {
      setIsGlobalNewsLoading(false);
    }
  }, [loadedData]);

  const fetchHomeData = useCallback(async () => {
    setIsHomeLoading(true);
    try {
      const weekly = await dataService.getWeeklyCalendar();
      setWeeklyRaces(weekly);
      setLoadedData(prev => new Set(prev).add('home'));
    } catch (e) {
      console.error('Home fetch error:', e);
    } finally {
      setIsHomeLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    setLoadedData(new Set()); // Reset to force refetch
    
    if (view === 'category') {
      await fetchCategoryData(selectedCategory);
    } else if (mainTab === 'home') {
      await fetchHomeData();
    } else if (mainTab === 'noticias') {
      await fetchGlobalNews();
    } else if (mainTab === 'calendario') {
      // Home data is essentially the weekly calendar
      await fetchHomeData();
    }
    
    setIsRefreshing(false);
  }, [view, mainTab, selectedCategory, fetchCategoryData, fetchHomeData, fetchGlobalNews]);

  useEffect(() => {
    // Mandatory initial splash screen delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { 
    if (mainTab === 'calendario' || mainTab === 'home') {
      fetchHomeData(); 
    }
  }, [mainTab, fetchHomeData]);

  useEffect(() => {
    if (view === 'category') {
      fetchCategoryData(selectedCategory);
    }
  }, [view, selectedCategory, fetchCategoryData]);

  useEffect(() => {
    if (mainTab === 'noticias') {
      fetchGlobalNews();
    }
  }, [mainTab, fetchGlobalNews]);

  const handleCategoryClick = (cat: CategoryType) => {
    setSelectedCategory(cat);
    setCategorySubTab('calendar');
    setView('category');
  };

  // ==================== RENDER: HOME ====================
  const renderHome = () => (
    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="home-view">
      <div className="categories-grid">
        <button className="cat-card f1-card" onClick={() => handleCategoryClick('F1')}>
          <div className="cat-card-glow" />
          <img src={F1_LOGO} alt="F1" className="cat-logo" />
          <span className="cat-label">Formula 1</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card wrc-card" onClick={() => handleCategoryClick('WRC')}>
          <div className="cat-card-glow" />
          <img src={WRC_LOGO} alt="WRC" className="cat-logo wrc-logo" />
          <span className="cat-label">WRC</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card nascar-card" onClick={() => handleCategoryClick('NASCAR')}>
          <div className="cat-card-glow" />
          <img src="/NASCAR.png" alt="NASCAR" className="cat-logo nascar-logo" />
          <span className="cat-label">NASCAR Cup</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card indycar-card" onClick={() => handleCategoryClick('IndyCar')}>
          <div className="cat-card-glow" />
          <img src={INDYCAR_LOGO} alt="IndyCar" className="cat-logo indycar-logo" />
          <span className="cat-label">IndyCar</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tc-card" onClick={() => handleCategoryClick('TC')}>
          <div className="cat-card-glow" />
          <img src={TC_LOGO} alt="TC" className="cat-logo tc-logo" />
          <span className="cat-label">TC</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcp-card" onClick={() => handleCategoryClick('TCP')}>
          <div className="cat-card-glow" />
          <img src={TCP_LOGO} alt="TCP" className="cat-logo tcp-logo" />
          <span className="cat-label">TC Pista</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcm-card" onClick={() => handleCategoryClick('TCM')}>
          <div className="cat-card-glow" />
          <img src="/TCM.png" alt="TCM" className="cat-logo tcm-logo" />
          <span className="cat-label">TC Mouras</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcpm-card" onClick={() => handleCategoryClick('TCPM')}>
          <div className="cat-card-glow" />
          <img src="/TCPM.png" alt="TCPM" className="cat-logo tcpm-logo" />
          <span className="cat-label">TC Pista Mouras</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcpk-card" onClick={() => handleCategoryClick('TCPK')}>
          <div className="cat-card-glow" />
          <img src={TCPK_LOGO} alt="TCPK" className="cat-logo tcpk-logo" />
          <span className="cat-label">TC Pick Up</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcppk-card" onClick={() => handleCategoryClick('TCPPK')}>
          <div className="cat-card-glow" />
          <img src="/TCPPK.png" alt="TCPPK" className="cat-logo tcppk-logo" />
          <span className="cat-label">TC Pista Pick Up</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tc2000-card" onClick={() => handleCategoryClick('TC2000')}>
          <div className="cat-card-glow" />
          <img src="/TC2000.png" alt="TC2000" className="cat-logo tc2000-logo" />
          <span className="cat-label">TC2000</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
      </div>
    </motion.div>
  );

  // ==================== RENDER: CALENDARIO ====================
  const renderCalendario = () => {
    const flatSchedules = weeklyRaces.flatMap(race =>
      race.schedules.map(s => ({
        ...s,
        category: race.category,
        categoryImage: race.categoryImage,
        categoryColor: getCategoryColor(race.category),
        event: race.event,
        circuit: race.circuit,
        circuitImage: race.circuitImage,
        watchLinks: race.watchLinks,
        ticketLink: race.ticketLink,
        raceId: race.id,
      }))
    ).sort((a, b) => a.startAt - b.startAt);

    return (
      <motion.div key="calendario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="calendario-view">
        <div className="view-toggle">
          <button className={`toggle-btn ${calendarViewMode === 'semanal' ? 'active' : ''}`} onClick={() => setCalendarViewMode('semanal')}>
            Vista Semanal
          </button>
          <button className={`toggle-btn ${calendarViewMode === 'categoria' ? 'active' : ''}`} onClick={() => setCalendarViewMode('categoria')}>
            Vista por Categoría
          </button>
        </div>

        {isHomeLoading ? (
          <div className="tab-loading-wrap">
            {renderLoadingCircle()}
          </div>
        ) : calendarViewMode === 'semanal' ? (
          <div className="weekly-list">
            {flatSchedules.length === 0 && !isHomeLoading && <p className="empty-msg">No hay eventos esta semana.</p>}
            
            {/* PRÓXIMOS SECTION */}
            {flatSchedules.some(s => s.startAt >= Date.now()) && (
              <div className="weekly-section">
                <button 
                  className={`section-header-btn ${expandedWeeklySection === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setExpandedWeeklySection(expandedWeeklySection === 'upcoming' ? null : 'upcoming')}
                >
                  <div className="section-title-group">
                    <Calendar size={18} />
                    <span>Próximos</span>
                  </div>
                  <ChevronRight size={18} className={`section-chevron ${expandedWeeklySection === 'upcoming' ? 'open' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {expandedWeeklySection === 'upcoming' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="section-content-overflow"
                    >
                      {flatSchedules.filter(s => s.startAt >= Date.now()).map((item, idx) => (
                        <div key={idx} className="weekly-card">
                          <div className="weekly-color-bar" style={{ background: item.categoryColor }} />
                          <div className="weekly-body">
                            <div className="weekly-top">
                              {item.categoryImage && <img src={item.categoryImage} alt="" className="weekly-cat-img" />}
                              <span className="weekly-cat-badge" style={{ color: item.categoryColor }}>{item.category}</span>
                              <span className="weekly-sched-time-right">{item.time}</span>
                            </div>
                            <h3 className="weekly-event-name">{item.name}</h3>
                            <p className="weekly-circuit">{item.event} — {item.circuit}</p>
                            
                            {item.circuitImage && (
                              <div className="weekly-circuit-img-wrap">
                                <img src={item.circuitImage} alt="Circuito" className="weekly-circuit-img-v2" />
                              </div>
                            )}

                            <div className="weekly-details-footer">
                              {item.watchLinks && item.watchLinks.length > 0 && (
                                <div className="weekly-links">
                                  {item.watchLinks.map((wl, wi) => (
                                    <a key={wi} href={wl.url} target="_blank" rel="noopener noreferrer" className="watch-chip">
                                      {wl.platform} <ExternalLink size={12} />
                                    </a>
                                  ))}
                                </div>
                              )}
                              {item.ticketLink && (
                                <a href={item.ticketLink} target="_blank" rel="noopener noreferrer" className="ticket-chip">
                                  🎟️ Entradas <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* FINALIZADOS SECTION */}
            {flatSchedules.some(s => s.startAt < Date.now()) && (
              <div className="weekly-section finished-section">
                <button 
                  className={`section-header-btn ${expandedWeeklySection === 'finished' ? 'active' : ''}`}
                  onClick={() => setExpandedWeeklySection(expandedWeeklySection === 'finished' ? null : 'finished')}
                >
                  <div className="section-title-group">
                    <Trophy size={18} />
                    <span>Finalizados</span>
                  </div>
                  <ChevronRight size={18} className={`section-chevron ${expandedWeeklySection === 'finished' ? 'open' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {expandedWeeklySection === 'finished' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="section-content-overflow"
                    >
                      {flatSchedules.filter(s => s.startAt < Date.now()).map((item, idx) => (
                        <div key={idx} className="weekly-card finished">
                          <div className="weekly-color-bar" style={{ background: item.categoryColor }} />
                          <div className="weekly-body">
                            <div className="weekly-top">
                              {item.categoryImage && <img src={item.categoryImage} alt="" className="weekly-cat-img" />}
                              <span className="weekly-cat-badge" style={{ color: item.categoryColor }}>{item.category}</span>
                              <span className="weekly-sched-time-right">{item.time}</span>
                            </div>
                            <h3 className="weekly-event-name">{item.name}</h3>
                            <p className="weekly-circuit">{item.event} — {item.circuit}</p>
                            
                            {item.circuitImage && (
                              <div className="weekly-circuit-img-wrap">
                                <img src={item.circuitImage} alt="Circuito" className="weekly-circuit-img-v2" />
                              </div>
                            )}

                            <div className="weekly-details-footer">
                              {item.watchLinks && item.watchLinks.length > 0 && (
                                <div className="weekly-links">
                                  {item.watchLinks.map((wl, wi) => (
                                    <a key={wi} href={wl.url} target="_blank" rel="noopener noreferrer" className="watch-chip">
                                      {wl.platform} <ExternalLink size={12} />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <div className="category-calendar-list">
            {weeklyRaces.length === 0 && !isHomeLoading && <p className="empty-msg">No hay eventos esta semana.</p>}
            {Object.entries(
              weeklyRaces.reduce<Record<string, Race[]>>((acc, race) => {
                const key = race.category || 'Otros';
                if (!acc[key]) acc[key] = [];
                acc[key].push(race);
                return acc;
              }, {})
            ).map(([category, races]) => (
              <div key={category} className="cat-event-card">
                <div className="cat-event-header" style={{ borderColor: getCategoryColor(category) }}>
                  {races[0]?.categoryImage && <img src={races[0].categoryImage} alt="" className="cat-event-logo" />}
                  <div className="cat-event-title-block" onClick={() => setExpandedEvent(expandedEvent === category ? null : category)}>
                    <div className="cat-event-category-row">
                      <h3 className="cat-event-category">{category}</h3>
                      <ChevronRight size={16} className={`expand-chevron ${expandedEvent === category ? 'open' : ''}`} />
                    </div>
                    <p className="cat-event-circuit">{races[0]?.circuit}</p>
                  </div>
                </div>
                {expandedEvent === category && (
                  <div className="cat-event-expanded-details">
                    {races[0]?.circuitImage && <img src={races[0].circuitImage} alt="Circuito" className="circuit-image" />}
                    {((races[0]?.watchLinks ?? []).length > 0 || races[0]?.ticketLink) && (
                      <div className="weekly-links">
                        {races[0]?.watchLinks?.map((wl: any, wi: number) => (
                          <a key={wi} href={wl.url} target="_blank" rel="noopener noreferrer" className="watch-chip">
                            {wl.platform} <ExternalLink size={12} />
                          </a>
                        ))}
                        {races[0]?.ticketLink && (
                          <a href={races[0].ticketLink} target="_blank" rel="noopener noreferrer" className="ticket-chip">
                            🎟️ Entradas <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {races.map((race, ri) => (
                  <div key={ri} className="cat-event-body">
                    <h4 className="cat-event-name">{race.event}</h4>
                    {race.schedules.map((s, si) => (
                      <div key={si} className="schedule-row-mini">
                        <span className="sched-name">{s.name}</span>
                        <span className="sched-time">{s.time}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderNoticias = () => {
    const allNewsList = [
      ...f1News, ...wrcNews, ...tcNews, ...tcpNews, ...tcmNews, 
      ...tcpmNews, ...tcpkNews, ...tcppkNews, ...tc2000News, ...indyNews, ...nascarNews
    ].sort(() => Math.random() - 0.5);
    return (
      <motion.div key="noticias" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="noticias-view">
        {isGlobalNewsLoading ? (
          <div className="tab-loading-wrap">
            {renderLoadingCircle()}
          </div>
        ) : (
          <div className="news-feed">
          {allNewsList.map((item, idx) => (
            <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="news-card-item">
              <div className="news-card-body">
                <span className="news-badge">{item.category} | {item.source}</span>
                <h3 className="news-headline">{item.title}</h3>
              </div>
              <ExternalLink size={16} className="news-ext-icon" />
            </a>
          ))}
          {allNewsList.length === 0 && !isGlobalNewsLoading && <p className="empty-msg">No hay noticias disponibles.</p>}
          </div>
        )}
      </motion.div>
    );
  };

  // ==================== RENDER: CATEGORY VIEW ====================
  const renderLoadingCircle = () => (
    <div className="loading-circle-container">
      <div className="loading-circle"></div>
      <p className="loading-circle-text">Cargando datos...</p>
    </div>
  );

  const renderCategoryView = () => {
    const isF1 = selectedCategory === 'F1';
    const isWRC = selectedCategory === 'WRC';
    const isTC = selectedCategory === 'TC';
    const isTCP = selectedCategory === 'TCP';
    const isTCM = selectedCategory === 'TCM';
    const isTCPM = selectedCategory === 'TCPM';
    const isTCPK = selectedCategory === 'TCPK';
    const isTCPPK = selectedCategory === 'TCPPK';
    const isIndy = selectedCategory === 'IndyCar';
    const isNascar = selectedCategory === 'NASCAR';
    const isTC2000 = selectedCategory === 'TC2000';
    
    let logo = F1_LOGO;
    if (isWRC) logo = WRC_LOGO;
    if (isTC) logo = TC_LOGO;
    if (isTCP) logo = TCP_LOGO;
    if (isTCM) logo = '/TCM.png';
    if (isTCPM) logo = '/TCPM.png';
    if (isTCPK) logo = TCPK_LOGO;
    if (isTCPPK) logo = '/TCPPK.png';
    if (isTC2000) logo = '/TC2000.png';
    if (isIndy) logo = INDYCAR_LOGO;
    if (isNascar) logo = '/NASCAR.png';

    let catTitle = 'Formula 1';
    if (isWRC) catTitle = 'WRC';
    if (isTC) catTitle = 'Turismo Carretera';
    if (isTCP) catTitle = 'TC Pista';
    if (isTCM) catTitle = 'TC Mouras';
    if (isTCPM) catTitle = 'TC Pista Mouras';
    if (isTCPK) catTitle = 'TC Pick Up';
    if (isTCPPK) catTitle = 'TC Pista Pick Up';
    if (isIndy) catTitle = 'IndyCar';
    if (isNascar) catTitle = 'NASCAR Cup Series';
    if (isTC2000) catTitle = 'TC2000';

    let news = f1News;
    if (isWRC) news = wrcNews;
    if (isTC) news = tcNews;
    if (isTCP) news = tcpNews;
    if (isTCM) news = tcmNews;
    if (isTCPM) news = tcpmNews;
    if (isTCPK) news = tcpkNews;
    if (isTCPPK) news = tcppkNews;
    if (isIndy) news = indyNews;
    if (isNascar) news = nascarNews;
    if (isTC2000) news = tc2000News;

    return (
      <motion.div key="category" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="category-view">
        <header className="cat-header">
          <button className="back-btn" onClick={() => setView('main')}>
            <ArrowLeft size={22} />
          </button>
          <img src={logo} alt={selectedCategory} className={`cat-header-logo ${isWRC ? 'wrc-logo' : ''} ${isTC ? 'tc-logo' : ''} ${isTCP ? 'tcp-logo' : ''} ${isTCM ? 'tcm-logo' : ''} ${isTCPM ? 'tcpm-logo' : ''} ${isTCPK ? 'tcpk-logo' : ''} ${isTCPPK ? 'tcppk-logo' : ''} ${isTC2000 ? 'tc2000-logo' : ''} ${isIndy ? 'indycar-logo' : ''}`} />
          <h2 className="cat-header-title">{catTitle}</h2>
        </header>

        <div className="cat-tabs">
          <button className={`cat-tab ${categorySubTab === 'calendar' ? 'active' : ''}`} onClick={() => setCategorySubTab('calendar')}>
            <Calendar size={16} /> Calendario
          </button>
          <button className={`cat-tab ${categorySubTab === 'standings' ? 'active' : ''}`} onClick={() => setCategorySubTab('standings')}>
            <Trophy size={16} /> Posiciones
          </button>
          <button className={`cat-tab ${categorySubTab === 'news' ? 'active' : ''}`} onClick={() => setCategorySubTab('news')}>
            <Newspaper size={16} /> Noticias
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isCategoryLoading ? (
            <motion.div 
              key="cat-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="cat-content"
            >
              {renderLoadingCircle()}
            </motion.div>
          ) : (
            <div key="cat-data-container">
          {categorySubTab === 'calendar' && (
            <motion.div key="cat-cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cat-content">
              {isF1 ? (
                <div className="f1-calendar-list">
                  {f1Calendar.map((race, idx) => (
                    <div key={idx} className={`race-row ${race.status === 'Live' ? 'live' : ''}`}>
                      <div className={`race-round-num ${race.status.toLowerCase()}`}>{race.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{race.race}</span>
                        <span className="race-date-label">{race.dates}</span>
                      </div>
                      <div className={`race-status-badge ${race.status.toLowerCase()}`}>
                        {race.status === 'Live' ? '🔴 En curso' :
                          race.status === 'Finished' ? (race.winner || '✅ Finalizado') :
                            (race.status === 'Next' || race.status === 'Upcoming') ? '➡️ Próximo' : '—'}
                      </div>
                    </div>
                  ))}
                  {f1Calendar.length === 0 && !isLoading && <p className="empty-msg">Cargando calendario...</p>}
                </div>
              ) : isWRC ? (
                <div className="wrc-calendar-list">
                  {wrcCalendar.length > 0 ? wrcCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status === 'Live' ? 'live' : ''}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.rallyName}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Live' ? '🔴 En curso' :
                          ev.status === 'Finished' ? '✅ Finalizado' :
                            (ev.status === 'Next' || ev.status === 'Upcoming') ? '➡️ Próximo' : '—'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">{isLoading ? 'Cargando calendario WRC...' : 'No se encontró calendario WRC.'}</p>
                  )}
                </div>
      ) : isTC ? (
        <div className="tc-calendar-link-view">
          <p className="tc-calendar-msg">El calendario oficial se encuentra en constante actualización.</p>
          <a 
            href="https://actc.org.ar/tc/index.html" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="tc-calendar-btn"
          >
            Consultar calendario oficial <ExternalLink size={16} />
          </a>
        </div>
      ) : isTCP ? (
        <div className="tcp-calendar-list">
          {tcpCalendar.length > 0 ? tcpCalendar.map((ev, idx) => (
            <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
              <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
              <div className="race-info-block">
                <span className="race-name-label">{ev.race}</span>
                <span className="race-date-label">{ev.dates}</span>
              </div>
              <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                {ev.status === 'Finished' ? (ev.winner || '✅ Finalizado') : 
                 ev.status === 'Live' ? '🔴 En curso' : '➡️ Próximo'}
              </div>
            </div>
          )) : (
            <p className="empty-msg">{isLoading ? 'Cargando calendario TCP...' : 'No se encontró calendario TCP.'}</p>
          )}
        </div>
      ) : isTCM ? (
        <div className="tcm-calendar-list">
          {tcmCalendar.length > 0 ? tcmCalendar.map((ev, idx) => (
            <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
              <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
              <div className="race-info-block">
                <span className="race-name-label">{ev.race}</span>
                <span className="race-date-label">{ev.dates}</span>
              </div>
              <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                {ev.status === 'Finished' ? (ev.winner || '✅ Finalizado') : 
                 ev.status === 'Live' ? '🔴 En curso' : '➡️ Próximo'}
              </div>
            </div>
          )) : (
            <p className="empty-msg">{isLoading ? 'Cargando calendario TCM...' : 'No se encontró calendario TCM.'}</p>
          )}
        </div>
      ) : isTCPM ? (
        <div className="tcpm-calendar-list">
          {tcpmCalendar.length > 0 ? tcpmCalendar.map((ev, idx) => (
            <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
              <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
              <div className="race-info-block">
                <span className="race-name-label">{ev.race}</span>
                <span className="race-date-label">{ev.dates}</span>
              </div>
              <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                {ev.status === 'Finished' ? (ev.winner || '✅ Finalizado') : 
                 ev.status === 'Live' ? '🔴 En curso' : '➡️ Próximo'}
              </div>
            </div>
          )) : (
            <p className="empty-msg">{isLoading ? 'Cargando calendario TCPM...' : 'No se encontró calendario TCPM.'}</p>
          )}
        </div>
      ) : isTCPK ? (
                <div className="tcpk-calendar-list">
                  {tcpkCalendar.length > 0 ? tcpkCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? (ev.winner || '✅ Finalizado') : 
                         ev.status === 'Live' ? '🔴 En curso' : '➡️ Próximo'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">{isLoading ? 'Cargando calendario TCPK...' : 'No se encontró calendario TCPK.'}</p>
                  )}
                </div>
              ) : isTCPPK ? (
                <div className="tcppk-calendar-list">
                  {tcppkCalendar.length > 0 ? tcppkCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? (ev.winner || '✅ Finalizado') : 
                         ev.status === 'Live' ? '🔴 En curso' : '➡️ Próximo'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">{isLoading ? 'Cargando calendario TCPPK...' : 'No se encontró calendario TCPPK.'}</p>
                  )}
                </div>
              ) : isIndy ? (
                <div className="indy-calendar-list">
                  {indyCalendar.length > 0 ? indyCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? (ev.winner || '✅ Finalizado') : 
                         ev.status === 'Live' ? '🔴 En curso' : '➡️ Próximo'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">{isLoading ? 'Cargando calendario IndyCar...' : 'No se encontró calendario IndyCar.'}</p>
                  )}
                </div>
              ) : isNascar ? (
                <div className="nascar-calendar-list">
                  {nascarCalendar.length > 0 ? nascarCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? (ev.winner || '✅ Finalizado') : 
                         ev.status === 'Live' ? '🔴 En curso' : '➡️ Próximo'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">{isLoading ? 'Cargando calendario NASCAR...' : 'No se encontró calendario NASCAR.'}</p>
                  )}
                </div>
              ) : isTC2000 ? (
                <div className="tc2000-calendar-list">
                  {tc2000Calendar.length > 0 ? tc2000Calendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status === 'Live' ? 'live' : ''}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? (ev.winner || '✅ Finalizado') : 
                         ev.status === 'Live' ? '🔴 En curso' : '➡️ Próximo'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">{isLoading ? 'Cargando calendario TC2000...' : 'No se encontró calendario TC2000.'}</p>
                  )}
                </div>
              ) : null}
            </motion.div>
          )}

          {categorySubTab === 'standings' && (
            <motion.div key="cat-stand" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cat-content">
              {isF1 ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${f1StandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setF1StandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${f1StandingsTab === 'constructors' ? 'active' : ''}`} onClick={() => setF1StandingsTab('constructors')}>Constructores</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {f1StandingsTab === 'drivers' ? (
                      f1Drivers.map((d, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                            {d.team && <span className="stand-sub">{d.team}</span>}
                          </div>
                          <span className="stand-pts">{d.totalPts} pts</span>
                        </div>
                      ))
                    ) : (
                      f1Constructors.map((c, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.team}</span>
                          </div>
                          <span className="stand-pts">{c.totalPts} pts</span>
                        </div>
                      ))
                    )}
                    {((f1StandingsTab === 'drivers' && f1Drivers.length === 0) || (f1StandingsTab === 'constructors' && f1Constructors.length === 0)) && <p className="empty-msg">Cargando posiciones...</p>}
                  </div>
                </>
              ) : isWRC ? (
                <>
                  <div className="nascar-tabs wrc-tabs">
                    <button 
                      className={`nascar-tab-btn ${wrcStandingsTab === 'drivers' ? 'active' : ''}`}
                      onClick={() => setWrcStandingsTab('drivers')}
                    >
                      Pilotos
                    </button>
                    <button 
                      className={`nascar-tab-btn ${wrcStandingsTab === 'manufacturers' ? 'active' : ''}`}
                      onClick={() => setWrcStandingsTab('manufacturers')}
                    >
                      Fabricantes
                    </button>
                  </div>
                  <div className="standings-list wrc-standings">
                    {(wrcStandings[wrcStandingsTab] || []).map((d: any, idx: number) => (
                      <div key={idx} className={`stand-row wrc-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                          {d.codriverOrTeam && <span className="stand-sub">{d.codriverOrTeam}</span>}
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {wrcStandings[wrcStandingsTab].length === 0 && <p className="empty-msg">Cargando posiciones WRC...</p>}
                  </div>
                </>
              ) : isTC ? (
                <>
                  <div className="standings-list tc-standings">
                    {tcDrivers.map((d, idx) => (
                      <div key={idx} className={`stand-row tc-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {tcDrivers.length === 0 && <p className="empty-msg">Cargando posiciones TC...</p>}
                  </div>
                </>
              ) : isTCP ? (
                <>
                  <div className="standings-list tcp-standings">
                    {tcpDrivers.map((d, idx) => (
                      <div key={idx} className={`stand-row tcp-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {tcpDrivers.length === 0 && <p className="empty-msg">Cargando posiciones TCP...</p>}
                  </div>
                </>
              ) : isTCM ? (
                <>
                  <div className="standings-list tcm-standings">
                    {tcmDrivers.map((d, idx) => (
                      <div key={idx} className={`stand-row tcm-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {tcmDrivers.length === 0 && <p className="empty-msg">Cargando posiciones TCM...</p>}
                  </div>
                </>
              ) : isTCPM ? (
                <>
                  <div className="standings-list tcpm-standings">
                    {tcpmDrivers.map((d, idx) => (
                      <div key={idx} className={`stand-row tcpm-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {tcpmDrivers.length === 0 && <p className="empty-msg">Cargando posiciones TCPM...</p>}
                  </div>
                </>
              ) : isTCPK ? (
                 <>
                   <div className="standings-list tcpk-standings">
                     {tcpkDrivers.map((d, idx) => (
                       <div key={idx} className={`stand-row tcpk-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                         <span className="stand-pos">{d.pos}</span>
                         <div className="stand-info">
                           <span className="stand-name">{d.driver}</span>
                         </div>
                         <span className="stand-pts">{d.points} pts</span>
                       </div>
                     ))}
                     {tcpkDrivers.length === 0 && <p className="empty-msg">Cargando posiciones TCPK...</p>}
                   </div>
                 </>
                ) : isTCPPK ? (
                  <>
                    <div className="standings-list tcppk-standings">
                      {tcppkDrivers.map((d, idx) => (
                        <div key={idx} className={`stand-row tcppk-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))}
                      {tcppkDrivers.length === 0 && <p className="empty-msg">Cargando posiciones TCPPK...</p>}
                    </div>
                  </>
                ) : isTC2000 ? (
                  <>
                    <div className="nascar-tabs tc2000-tabs">
                      <button className={`nascar-tab-btn ${tc2000StandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setTc2000StandingsTab('drivers')}>Pilotos</button>
                      <button className={`nascar-tab-btn ${tc2000StandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setTc2000StandingsTab('teams')}>Equipos</button>
                      <button className={`nascar-tab-btn ${tc2000StandingsTab === 'brands' ? 'active' : ''}`} onClick={() => setTc2000StandingsTab('brands')}>Marcas</button>
                    </div>
                    <div className="standings-list tc2000-standings">
                      {tc2000StandingsTab === 'drivers' ? (
                        tc2000Drivers.map((d, idx) => (
                          <div key={idx} className={`stand-row tc2000-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                            <span className="stand-pos">{d.pos}</span>
                            <div className="stand-info">
                              <span className="stand-name">{d.driver}</span>
                              {d.team && <span className="stand-sub">{d.team}</span>}
                            </div>
                            <span className="stand-pts">{d.points} pts</span>
                          </div>
                        ))
                      ) : tc2000StandingsTab === 'teams' ? (
                        tc2000Teams.map((t, idx) => (
                          <div key={idx} className={`stand-row tc2000-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                            <span className="stand-pos">{t.pos}</span>
                            <div className="stand-info">
                              <span className="stand-name">{t.driver}</span>
                            </div>
                            <span className="stand-pts">{t.points} pts</span>
                          </div>
                        ))
                      ) : (
                        tc2000Brands.map((b, idx) => (
                          <div key={idx} className={`stand-row tc2000-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                            <span className="stand-pos">{b.pos}</span>
                            <div className="stand-info">
                              <span className="stand-name">{b.driver}</span>
                            </div>
                            <span className="stand-pts">{b.points} pts</span>
                          </div>
                        ))
                      )}
                      {((tc2000StandingsTab === 'drivers' && tc2000Drivers.length === 0) ||
                        (tc2000StandingsTab === 'teams' && tc2000Teams.length === 0) ||
                        (tc2000StandingsTab === 'brands' && tc2000Brands.length === 0)) && !isLoading && 
                        <p className="empty-msg">No hay posiciones disponibles.</p>}
                    </div>
                  </>
              ) : isIndy ? (
                <>
                  <div className="standings-list indy-standings">
                    {indyDrivers.map((d, idx) => (
                      <div key={idx} className={`stand-row indy-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {indyDrivers.length === 0 && <p className="empty-msg">{isLoading ? 'Cargando posiciones...' : 'No se encontraron posiciones IndyCar.'}</p>}
                  </div>
                </>
                ) : isNascar ? (
                  <>
                    <div className="nascar-tabs">
                      <button className={`nascar-tab-btn ${nascarStandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setNascarStandingsTab('drivers')}>Pilotos</button>
                      <button className={`nascar-tab-btn ${nascarStandingsTab === 'manufacturers' ? 'active' : ''}`} onClick={() => setNascarStandingsTab('manufacturers')}>Constructores</button>
                    </div>
                    <div className="standings-list nascar-standings">
                      {nascarStandings[nascarStandingsTab].map((d, idx) => (
                        <div key={idx} className={`stand-row nascar-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))}
                      {nascarStandings[nascarStandingsTab].length === 0 && <p className="empty-msg">No se encontraron posiciones.</p>}
                    </div>
                  </>
                ) : null}
            </motion.div>
          )}

          {categorySubTab === 'news' && (
            <motion.div key="cat-news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cat-content">
              <div className="news-feed">
                {news.map((item, idx) => (
                  <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="news-card-item">
                    <div className="news-card-body">
                      <span className="news-badge">{selectedCategory} | {item.source}</span>
                      <h3 className="news-headline">{item.title}</h3>
                    </div>
                    <ExternalLink size={16} className="news-ext-icon" />
                  </a>
                ))}
                {news.length === 0 && !isCategoryLoading && <p className="empty-msg">No hay noticias disponibles para {catTitle}.</p>}
              </div>
            </motion.div>
          )}
          </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ==================== RENDER: LOADING ====================
  const renderLoadingScreen = () => (
    <motion.div 
      key="loading"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="loading-screen"
    >
      <div className="loading-content">
        <div className="loading-logo-wrap single-logo">
          <motion.img 
            src="/CARGA.png" 
            alt="Cargando..." 
            className="loading-logo-exclusive white-logo"
            animate={{ 
              scale: [0.95, 1.05, 0.95], 
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <div className="loading-progress-container">
          <motion.div 
            className="loading-progress-bar"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
        </div>

        <motion.p 
          className="loading-text"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Sincronizando motores...
        </motion.p>
      </div>
      <div className="loading-bg-glow" />
    </motion.div>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {isLoading ? (
          renderLoadingScreen()
        ) : (
          <motion.div 
            key="app-main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-main-layout"
          >
            <header className="main-header">
              <div className="header-centered-logo">
                <img src="/logo.png" alt="Vuelta de Instalación" className="app-header-logo-centered white-logo" />
              </div>
            </header>

            <main className="content-area">
              <div className="pull-to-refresh-container">
                 <AnimatePresence>
                   {isRefreshing && (
                     <motion.div 
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 50, opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="pull-to-refresh-indicator"
                     >
                       <RefreshCw size={20} className="spinning" />
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              <div
                onTouchStart={(e) => {
                  if (window.scrollY === 0) {
                    (window as any).pullStart = e.touches[0].pageY;
                  }
                }}
                onTouchMove={(e) => {
                  if ((window as any).pullStart !== undefined && window.scrollY === 0) {
                    const pullDist = e.touches[0].pageY - (window as any).pullStart;
                    if (pullDist > 100 && !isRefreshing) {
                      refreshAll();
                      (window as any).pullStart = undefined;
                    }
                  }
                }}
                onTouchEnd={() => {
                  (window as any).pullStart = undefined;
                }}
              >
                <AnimatePresence mode="wait">
                  {view === 'category' ? renderCategoryView() : (
                    <>
                      {mainTab === 'home' && renderHome()}
                      {mainTab === 'calendario' && renderCalendario()}
                      {mainTab === 'noticias' && renderNoticias()}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </main>

            {view === 'main' && (
              <nav className="tab-bar">
                <button className={`tab-btn ${mainTab === 'home' ? 'active' : ''}`} onClick={() => setMainTab('home')}>
                  <Home size={22} />
                  <span>Inicio</span>
                </button>
                <button className={`tab-btn ${mainTab === 'calendario' ? 'active' : ''}`} onClick={() => setMainTab('calendario')}>
                  <Calendar size={22} />
                  <span>Calendario</span>
                </button>
                <button className={`tab-btn ${mainTab === 'noticias' ? 'active' : ''}`} onClick={() => setMainTab('noticias')}>
                  <Newspaper size={22} />
                  <span>Noticias</span>
                </button>
              </nav>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
