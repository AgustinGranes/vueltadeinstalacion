import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Home, Newspaper, RefreshCw, ArrowLeft, ExternalLink, Trophy, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService, getCategoryColor } from './data/dataService';
import type { Race, CalendarRace, NewsItem, F1StandingsRow, F1ConstructorRow, WRCStandings, WRCCalendarEvent, TCStandingRow, NascarStandings, MotoGPStandings, DTMStandings } from './data/dataService';
import './App.css';

type CategoryType = 'F1' | 'WRC' | 'WRC2' | 'NASCAR' | 'IndyCar' | 'TC' | 'TCP' | 'TCM' | 'TCPM' | 'TCPK' | 'TCPPK' | 'TC2000' | 'TNC3' | 'TNC2' | 'WEC' | 'IMSA' | 'NASCARO' | 'NASCART' | 'F2' | 'F3' | 'FE' | 'F1A' | 'MotoGP' | 'SUPERCARS' | 'GTWC' | 'BTCC' | 'DTM' | 'SF' | 'ELMS' | 'PROCAR4000' | 'WORLD SBK' | 'WTCR';
type MainTab = 'home' | 'calendario' | 'noticias';
type CalendarViewMode = 'semanal' | 'categoria';
type CategorySubTab = 'standings' | 'results' | 'calendar' | 'news';

const WRC_LOGO = '/WRC.png';
const WRC2_LOGO = '/WRC2.png';
const F1_LOGO = '/F1.svg';
const F2_LOGO = '/F2.png';
const MotoGP_LOGO = '/MOTOGP.png';
const F3_LOGO = '/F3.png';
const TC_LOGO = '/TC.png';
const TCP_LOGO = '/TCP.png';
const TCPK_LOGO = '/TCPK.png';
const INDYCAR_LOGO = '/INDY.png';
const WEC_LOGO = '/WEC.png';
const IMSA_LOGO = '/IMSA.png';
const FE_LOGO = '/FE.png';
const TNC3_LOGO = '/TNC3.jpg';
const TNC2_LOGO = '/TNC2.png';
const NASCAR_LOGO = '/NASCAR.png';
const NASCARO_LOGO = '/NASCARO.png';
const NASCART_LOGO = '/NASCART.png';
const F1A_LOGO = '/F1A.png';
const SUPERCARS_LOGO = '/SUPERCARS.png';
const GTWC_LOGO = '/GT.png';
const BTCC_LOGO = '/BTCC.png';
const DTM_LOGO = '/DTM.png';
const SF_LOGO = '/SF.png';
const ELMS_LOGO = '/ELMS.png';
const PROCAR_LOGO = '/PROCAR.png';
const WORLDSBK_LOGO = '/WORLDSBK.png';
const WTCR_LOGO = 'https://www.fiatcrworldtour.com/images/FIA_TCR-WT_Logotype_Pack_N.png';

const NEWS_CATEGORIES = ['F1', 'F2', 'F3', 'FE', 'F1 Academy', 'BTCC', 'DTM', 'Super Formula', 'ELMS', 'PROCAR4000', 'WORLD SBK', 'WTCR', 'Supercars', 'GT World Challenge', 'WRC', 'WRC2', 'TC', 'TNC3', 'TNC2', 'TCP', 'TCM', 'TCPM', 'TCPK', 'TCPPK', 'TC2000', 'IndyCar', 'NASCAR', 'NASCAR TRUCK', 'NASCAR O REILLY', 'WEC', 'IMSA', 'MotoGP'];



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
  const [wrc2Calendar, setWrc2Calendar] = useState<WRCCalendarEvent[]>([]);
  const [tcpCalendar, setTcpCalendar] = useState<CalendarRace[]>([]);
  const [tcmCalendar, setTcmCalendar] = useState<CalendarRace[]>([]);
  const [tcpmCalendar, setTcpmCalendar] = useState<CalendarRace[]>([]);
  const [tcpkCalendar, setTcpkCalendar] = useState<CalendarRace[]>([]);
  const [tcppkCalendar, setTcppkCalendar] = useState<CalendarRace[]>([]);
  const [tc2000Calendar, setTc2000Calendar] = useState<CalendarRace[]>([]);
  const [indyCalendar, setIndyCalendar] = useState<CalendarRace[]>([]);
  const [tcCalendar, setTcCalendar] = useState<CalendarRace[]>([]);
  const [f2Calendar, setF2Calendar] = useState<CalendarRace[]>([]);
  const [f3Calendar, setF3Calendar] = useState<CalendarRace[]>([]);
  const [feCalendar, setFECalendar] = useState<CalendarRace[]>([]);
  const [f1aCalendar, setF1aCalendar] = useState<CalendarRace[]>([]);
  const [btccNews, setBtccNews] = useState<NewsItem[]>([]);
  const [btccCalendar, setBtccCalendar] = useState<CalendarRace[]>([]);
  const [btccStandingsType, setBtccStandingsType] = useState<string>('drivers');
  const [btccStandings, setBtccStandings] = useState<Record<string, TCStandingRow[]>>({
    'drivers': [],
    'manufacturers': [],
    'teams': [],
    'independent-drivers': [],
    'independent-teams': [],
    'jack-sears-trophy': [],
    'goodyear-wingfoot-award': []
  });
  const [supercarsCalendar, setSupercarsCalendar] = useState<CalendarRace[]>([]);
  const [gtwcCalendar, setGtwcCalendar] = useState<CalendarRace[]>([]);
  const [dtmCalendar, setDtmCalendar] = useState<CalendarRace[]>([]);
  
  const [f1Drivers, setF1Drivers] = useState<F1StandingsRow[]>([]);
  const [f1Constructors, setF1Constructor] = useState<F1ConstructorRow[]>([]);
  const [wrcStandingsTab, setWrcStandingsTab] = useState<'drivers' | 'manufacturers'>('drivers');
  const [wrcStandings, setWrcStandings] = useState<WRCStandings>({ drivers: [], codrivers: [], manufacturers: [], teams: [] });
  const [wrc2Standings, setWrc2Standings] = useState<WRCStandings>({ drivers: [], codrivers: [], manufacturers: [], teams: [] });
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
  const [f2Drivers, setF2Drivers] = useState<TCStandingRow[]>([]);
  const [f2Teams, setF2Teams] = useState<TCStandingRow[]>([]);
  const [f3Drivers, setF3Drivers] = useState<TCStandingRow[]>([]);
  const [f3Teams, setF3Teams] = useState<TCStandingRow[]>([]);
  const [feDrivers, setFEDrivers] = useState<TCStandingRow[]>([]);
  const [feTeams, setFETeams] = useState<TCStandingRow[]>([]);
  const [f1aDrivers, setF1aDrivers] = useState<TCStandingRow[]>([]);
  const [f1aTeams, setF1aTeams] = useState<TCStandingRow[]>([]);
  const [supercarsDrivers, setSupercarsDrivers] = useState<TCStandingRow[]>([]);
  const [supercarsTeams, setSupercarsTeams] = useState<TCStandingRow[]>([]);
  const [gtwcStandings, setGtwcStandings] = useState<TCStandingRow[]>([]);
  const [dtmStandings, setDtmStandings] = useState<DTMStandings>({ drivers: [], teams: [], constructors: [] });
  const [dtmStandingsTab, setDtmStandingsTab] = useState<'drivers' | 'teams' | 'constructors'>('drivers');
  const [supercarsStandingsTab, setSupercarsStandingsTab] = useState<'drivers' | 'teams'>('drivers');
  const [f1aStandingsTab, setF1aStandingsTab] = useState<'drivers' | 'teams'>('drivers');
  const [f2StandingsTab, setF2StandingsTab] = useState<'drivers' | 'teams'>('drivers');
  const [f3StandingsTab, setF3StandingsTab] = useState<'drivers' | 'teams'>('drivers');
  const [feStandingsTab, setFEStandingsTab] = useState<'drivers' | 'teams'>('drivers');

  const [f1StandingsTab, setF1StandingsTab] = useState<'drivers' | 'constructors'>('drivers');
  const [f1News, setF1News] = useState<NewsItem[]>([]);
  const [wrcNews, setWrcNews] = useState<NewsItem[]>([]);
  const [wrc2News, setWrc2News] = useState<NewsItem[]>([]);
  const [tcNews, setTcNews] = useState<NewsItem[]>([]);
  const [tcpNews, setTcpNews] = useState<NewsItem[]>([]);
  const [tcmNews, setTcmNews] = useState<NewsItem[]>([]);
  const [tcpmNews, setTcpmNews] = useState<NewsItem[]>([]);
  const [tcpkNews, setTcpkNews] = useState<NewsItem[]>([]);
  const [tcppkNews, setTcppkNews] = useState<NewsItem[]>([]);
  const [tc2000News, setTc2000News] = useState<NewsItem[]>([]);
  const [f2News, setF2News] = useState<NewsItem[]>([]);
  const [f3News, setF3News] = useState<NewsItem[]>([]);
  const [feNews, setFENews] = useState<NewsItem[]>([]);
  const [f1aNews, setF1aNews] = useState<NewsItem[]>([]);
  const [supercarsNews, setSupercarsNews] = useState<NewsItem[]>([]);
  const [gtwcNews, setGtwcNews] = useState<NewsItem[]>([]);
  const [dtmNews, setDtmNews] = useState<NewsItem[]>([]);
  const [tc2000StandingsTab, setTc2000StandingsTab] = useState<'drivers' | 'teams' | 'brands'>('drivers');
  const [nascarCalendar, setNascarCalendar] = useState<CalendarRace[]>([]);
  const [nascarStandings, setNascarStandings] = useState<NascarStandings>({ drivers: [], owners: [], manufacturers: [] });
  const [nascarStandingsTab, setNascarStandingsTab] = useState<'drivers' | 'manufacturers'>('drivers');
  const [nascarNews, setNascarNews] = useState<NewsItem[]>([]);
  const [indyNews, setIndyNews] = useState<NewsItem[]>([]);
  const [wecNews, setWecNews] = useState<NewsItem[]>([]);
  const [wecCalendar, setWecCalendar] = useState<WRCCalendarEvent[]>([]);
  const [wecStandings, setWecStandings] = useState<any>({ hypercarMfr: [], hypercarTeams: [], hypercarDrivers: [], lmgt3Drivers: [] });
  const [wecStandingsTab, setWecStandingsTab] = useState<'h-mfr' | 'h-teams' | 'h-drivers' | 'gt3-drivers'>('h-mfr');
  
  const [imsaCalendar, setImsaCalendar] = useState<CalendarRace[]>([]);
  const [imsaNews, setImsaNews] = useState<NewsItem[]>([]);
  const [nascarOCalendar, setNascarOCalendar] = useState<CalendarRace[]>([]);
  const [nascarONews, setNascarONews] = useState<NewsItem[]>([]);
  const [nascarOStandings, setNascarOStandings] = useState<TCStandingRow[]>([]);
  const [nascarTCalendar, setNascarTCalendar] = useState<CalendarRace[]>([]);
  const [nascarTNews, setNascarTNews] = useState<NewsItem[]>([]);
  const [nascarTStandings, setNascarTStandings] = useState<TCStandingRow[]>([]);
  const [tnc3Calendar, setTnc3Calendar] = useState<CalendarRace[]>([]);
  const [tnc3Drivers, setTnc3Drivers] = useState<TCStandingRow[]>([]);
  const [tnc2Drivers, setTnc2Drivers] = useState<TCStandingRow[]>([]);
  const [tnc3News, setTnc3News] = useState<NewsItem[]>([]);
  const [motoGPCalendar, setMotoGPCalendar] = useState<CalendarRace[]>([]);
  const [motoGPStandings, setMotoGPStandings] = useState<MotoGPStandings>({ drivers: [], teams: [], constructors: [] });
  const [motoGPNews, setMotoGPNews] = useState<NewsItem[]>([]);
  const [motoGPStandingsTab, setMotoGPStandingsTab] = useState<'drivers' | 'teams' | 'constructors'>('drivers');
  const [sfCalendar, setSfCalendar] = useState<CalendarRace[]>([]);
  const [sfDrivers, setSfDrivers] = useState<TCStandingRow[]>([]);
  const [sfTeams, setSfTeams] = useState<TCStandingRow[]>([]);
  const [sfNews, setSfNews] = useState<NewsItem[]>([]);
  const [sfStandingsTab, setSfStandingsTab] = useState<'drivers' | 'teams'>('drivers');
  const [elmsCalendar, setElmsCalendar] = useState<CalendarRace[]>([]);
  const [elmsStandings, setElmsStandings] = useState<Record<string, TCStandingRow[]>>({});
  const [elmsStandingsTab, setElmsStandingsTab] = useState<string>('LMP2 Drivers');
  const [elmsNews, setElmsNews] = useState<NewsItem[]>([]);
  const [procarCalendar, setProcarCalendar] = useState<CalendarRace[]>([]);
  const [procarStandings, setProcarStandings] = useState<Record<string, TCStandingRow[]>>({ 'Clase A': [], 'Clase B': [] });
  const [procarStandingsTab, setProcarStandingsTab] = useState<string>('Clase A');
  const [procarNews, setProcarNews] = useState<NewsItem[]>([]);
  const [worldSBKCalendar, setWorldSBKCalendar] = useState<CalendarRace[]>([]);
  const [worldSBKStandings, setWorldSBKStandings] = useState<{ drivers: TCStandingRow[], manufacturers: TCStandingRow[] }>({ drivers: [], manufacturers: [] });
  const [worldSBKNews, setWorldSBKNews] = useState<NewsItem[]>([]);
  const [worldSBKStandingsTab, setWorldSBKStandingsTab] = useState<'drivers' | 'manufacturers'>('drivers');
  const [wtcrCalendar, setWtcrCalendar] = useState<CalendarRace[]>([]);
  const [wtcrStandings, setWtcrStandings] = useState<TCStandingRow[]>([]);
  const [wtcrNews, setWtcrNews] = useState<NewsItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCatCalLoading, setIsCatCalLoading] = useState(false);
  const [isCatStandLoading, setIsCatStandLoading] = useState(false);
  const [isCatNewsLoading, setIsCatNewsLoading] = useState(false);
  const [isHomeLoading, setIsHomeLoading] = useState(false);
  const [isGlobalNewsLoading, setIsGlobalNewsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [expandedWeeklySection, setExpandedWeeklySection] = useState<'upcoming' | 'finished' | null>('upcoming');
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);

  const loadedDataRef = useRef<Set<string>>(new Set());

  // Filter states
  const [selectedNewsCategories, setSelectedNewsCategories] = useState<string[]>(NEWS_CATEGORIES);
  const [tempNewsCategories, setTempNewsCategories] = useState<string[]>(NEWS_CATEGORIES);
  const [isNewsFilterOpen, setIsNewsFilterOpen] = useState(false);


  const fetchCategoryCalendar = useCallback(async (cat: CategoryType) => {
    const key = `${cat}-calendar`;
    if (loadedDataRef.current.has(key)) return;
    setIsCatCalLoading(true);
    try {
      if (cat === 'F1') setF1Calendar(await dataService.getF1Calendar());
      else if (cat === 'WRC') setWrcCalendar(await dataService.getWRCCalendar());
      else if (cat === 'WRC2') setWrc2Calendar(await dataService.getWRC2Calendar());
      else if (cat === 'TC' || cat === 'TCP') {
         if (cat === 'TC') setTcCalendar(await dataService.getTCCalendar());
         else setTcpCalendar(await dataService.getTCCalendar());
      }
      else if (cat === 'TCM') setTcmCalendar(await dataService.getTCMCalendar());
      else if (cat === 'TCPM') setTcpmCalendar(await dataService.getTCPMCalendar());
      else if (cat === 'TCPK') setTcpkCalendar(await dataService.getTCPKCalendar());
      else if (cat === 'TCPPK') setTcppkCalendar(await dataService.getTCPPKCalendar());
      else if (cat === 'IndyCar') setIndyCalendar(await dataService.getIndyCarCalendar());
      else if (cat === 'NASCAR') setNascarCalendar(await dataService.getNascarCalendar());
      else if (cat === 'TC2000') setTc2000Calendar(await dataService.getTC2000Calendar());
      else if (cat === 'TNC3' || cat === 'TNC2') setTnc3Calendar(await dataService.getTNC3Calendar());
      else if (cat === 'WEC') setWecCalendar(await dataService.getWECCalendar());
      else if (cat === 'IMSA') setImsaCalendar(await dataService.getIMSACalendar());
      else if (cat === 'NASCARO') setNascarOCalendar(await dataService.getNASCAROCalendar());
      else if (cat === 'NASCART') setNascarTCalendar(await dataService.getNascarTruckCalendar());
      else if (cat === 'F2') setF2Calendar(await dataService.getF2Calendar());
      else if (cat === 'F3') setF3Calendar(await dataService.getF3Calendar());
      else if (cat === 'FE') setFECalendar(await dataService.getFECalendar());
      else if (cat === 'F1A') setF1aCalendar(await dataService.getF1AcademyCalendar());
      else if (cat === 'SUPERCARS') setSupercarsCalendar(await dataService.getSUPERCARSCalendar());
      else if (cat === 'GTWC') setGtwcCalendar(await dataService.getGTWCCalendar());
      else if (cat === 'BTCC') setBtccCalendar(await dataService.getBTCCCalendar());
      else if (cat === 'DTM') setDtmCalendar(await dataService.getDTMCalendar());
      else if (cat === 'MotoGP') setMotoGPCalendar(await dataService.getMotoGPCalendar());
      else if (cat === 'SF') setSfCalendar(await dataService.getSFCalendar());
      else if (cat === 'ELMS') setElmsCalendar(await dataService.getELMSCalendar());
      else if (cat === 'PROCAR4000') setProcarCalendar(await dataService.getProcarCalendar());
      else if (cat === 'WORLD SBK') setWorldSBKCalendar(await dataService.getWorldSBKCalendar());
      else if (cat === 'WTCR') setWtcrCalendar(await dataService.getWTCRCalendar());
      loadedDataRef.current.add(key);
    } catch (e) { console.error(`Calendar fetch error for ${cat}:`, e); }
    finally { setIsCatCalLoading(false); }
  }, []);

  const fetchCategoryStandings = useCallback(async (cat: CategoryType) => {
    const key = cat === 'BTCC' ? `${cat}-standings-batch` : `${cat}-standings`;
    if (loadedDataRef.current.has(key)) return;
    setIsCatStandLoading(true);
    try {
      if (cat === 'F1') {
        const res = await dataService.getF1StandingsFull();
        setF1Drivers(res.drivers);
        setF1Constructor(res.constructors);
      } else if (cat === 'WRC') {
        setWrcStandings(await dataService.getWRCStandings());
      } else if (cat === 'WRC2') {
        setWrc2Standings(await dataService.getWRC2Standings());
      } else if (cat === 'TC') setTcDrivers(await dataService.getTCStandings());
      else if (cat === 'TCP') setTcpDrivers(await dataService.getTCPStandings());
      else if (cat === 'TCM') setTcmDrivers(await dataService.getTCMStandings());
      else if (cat === 'TCPM') setTcpmDrivers(await dataService.getTCPMStandings());
      else if (cat === 'TCPK') setTcpkDrivers(await dataService.getTCPKStandings());
      else if (cat === 'TCPPK') setTcppkDrivers(await dataService.getTCPPKStandings());
      else if (cat === 'IndyCar') setIndyDrivers(await dataService.getIndyCarStandings());
      else if (cat === 'NASCAR') setNascarStandings(await dataService.getNascarStandings());
      else if (cat === 'TC2000') {
        const res = await dataService.getTC2000Standings();
        setTc2000Drivers(res.drivers);
        setTc2000Teams(res.teams);
        setTc2000Brands(res.brands);
      }
      else if (cat === 'TNC3') setTnc3Drivers(await dataService.getTNC3Standings());
      else if (cat === 'TNC2') setTnc2Drivers(await dataService.getTNC2Standings());
      else if (cat === 'NASCART') setNascarTStandings(await dataService.getNascarTruckStandings()); 
      else if (cat === 'WEC') setWecStandings(await dataService.getWECStandings());
      else if (cat === 'NASCARO') setNascarOStandings(await dataService.getNASCAROStandings());
      else if (cat === 'F2') {
        const res = await dataService.getF2Standings();
        setF2Drivers(res.drivers);
        setF2Teams(res.teams);
      } else if (cat === 'F3') {
        const res = await dataService.getF3Standings();
        setF3Drivers(res.drivers);
        setF3Teams(res.teams);
      } else if (cat === 'FE') {
        const res = await dataService.getFEStandings();
        setFEDrivers(res.drivers);
        setFETeams(res.teams);
      } else if (cat === 'F1A') {
        const [drivers, teams] = await Promise.all([dataService.getF1AcademyStandings(), dataService.getF1AcademyTeams()]);
        setF1aDrivers(drivers);
        setF1aTeams(teams);
      } else if (cat === 'SUPERCARS') {
        const [drivers, teams] = await Promise.all([dataService.getSUPERCARSStandings(), dataService.getSUPERCARSTeams()]);
        setSupercarsDrivers(drivers);
        setSupercarsTeams(teams);
      } else if (cat === 'GTWC') {
        setGtwcStandings(await dataService.getGTWCStandings());
      } else if (cat === 'BTCC') {
        const types = ['drivers', 'manufacturers', 'teams', 'independent-drivers', 'independent-teams', 'jack-sears-trophy', 'goodyear-wingfoot-award'];
        const results = await Promise.allSettled(types.map(t => dataService.getBTCCStandings(t)));
        
        setBtccStandings(prev => {
          const updated = { ...prev };
          types.forEach((t, i) => {
            if (results[i].status === 'fulfilled') {
              updated[t] = (results[i] as any).value;
            }
          });
          return updated;
        });
      } else if (cat === 'DTM') {
        const [drivers, teams, constructors] = await Promise.all([
          dataService.getDTMStandings('Driver'),
          dataService.getDTMStandings('Team'),
          dataService.getDTMStandings('Constructor')
        ]);
        setDtmStandings({ drivers, teams, constructors });
      } else if (cat === 'MotoGP') {
        const res = await dataService.getMotoGPStandings();
        setMotoGPStandings(res);
      } else if (cat === 'SF') {
        const d = await dataService.getSFStandings('drivers');
        const t = await dataService.getSFStandings('teams');
        setSfDrivers(d);
        setSfTeams(t);
      } else if (cat === 'ELMS') {
        const types = [0, 1, 2, 3, 4, 5, 6, 7];
        const classNames = [
          'LMP2 Drivers', 'LMP2 Teams',
          'LMP2 P/A Drivers', 'LMP2 P/A Teams',
          'LMP3 Drivers', 'LMP3 Teams',
          'LMGT3 Drivers', 'LMGT3 Teams'
        ];
        const results = await Promise.allSettled(types.map(t => dataService.getELMSStandings(t)));
        setElmsStandings(prev => {
          const updated = { ...prev };
          classNames.forEach((name, i) => {
            if (results[i].status === 'fulfilled') {
              updated[name] = (results[i] as any).value;
            }
          });
          return updated;
        });
      } else if (cat === 'PROCAR4000') {
        const [claseA, claseB] = await Promise.all([
          dataService.getProcarStandings('A'),
          dataService.getProcarStandings('B')
        ]);
        setProcarStandings({
          'Clase A': claseA,
          'Clase B': claseB
        });
      } else if (cat === 'WORLD SBK') {
        const res = await dataService.getWorldSBKStandings();
        setWorldSBKStandings(res);
      } else if (cat === 'WTCR') {
        const res = await dataService.getWTCRStandings();
        setWtcrStandings(res);
      }
      loadedDataRef.current.add(key);
    } catch (e) { console.error(`Standings fetch error for ${cat}:`, e); }
    finally { setIsCatStandLoading(false); }
  }, []);

  const fetchCategoryNews = useCallback(async (cat: CategoryType) => {
    const key = `${cat}-news`;
    if (loadedDataRef.current.has(key)) return;
    setIsCatNewsLoading(true);
    try {
      if (cat === 'F1') setF1News(await dataService.getF1News());
      else if (cat === 'WRC') setWrcNews(await dataService.getWRCNews());
      else if (cat === 'WRC2') setWrc2News(await dataService.getWRC2News());
      else if (cat === 'TC') setTcNews(await dataService.getTCNews());
      else if (cat === 'TCP') setTcpNews(await dataService.getTCPNews());
      else if (cat === 'TCM') setTcmNews(await dataService.getTCMNews());
      else if (cat === 'TCPM') setTcpmNews(await dataService.getTCPMNews());
      else if (cat === 'TCPK') setTcpkNews(await dataService.getTCPKNews());
      else if (cat === 'TCPPK') setTcppkNews(await dataService.getTCPPKNews());
      else if (cat === 'IndyCar') setIndyNews(await dataService.getIndyCarNews());
      else if (cat === 'NASCAR') setNascarNews(await dataService.getNascarNews());
      else if (cat === 'TC2000') setTc2000News(await dataService.getTC2000News());
      else if (cat === 'TNC3' || cat === 'TNC2') setTnc3News(await dataService.getTNC3News());
      else if (cat === 'NASCART') setNascarTNews(await dataService.getNascarTruckNews());
      else if (cat === 'WEC') setWecNews(await dataService.getWECNews());
      else if (cat === 'IMSA') setImsaNews(await dataService.getIMSANews());
      else if (cat === 'NASCARO') setNascarONews(await dataService.getNASCARONews());
      else if (cat === 'F2') setF2News(await dataService.getF2News());
      else if (cat === 'F3') setF3News(await dataService.getF3News());
      else if (cat === 'FE') setFENews(await dataService.getFENews());
      else if (cat === 'F1A') setF1aNews(await dataService.getF1AcademyNews());
      else if (cat === 'SUPERCARS') setSupercarsNews(await dataService.getSUPERCARSNews());
      else if (cat === 'GTWC') setGtwcNews(await dataService.getGTWCNews());
      else if (cat === 'BTCC') setBtccNews(await dataService.getBTCCNews());
      else if (cat === 'DTM') setDtmNews(await dataService.getDTMNews());
      else if (cat === 'MotoGP') setMotoGPNews(await dataService.getMotoGPNews());
      else if (cat === 'SF') setSfNews(await dataService.getSFNews());
      else if (cat === 'ELMS') setElmsNews(await dataService.getELMSNews());
      else if (cat === 'PROCAR4000') setProcarNews(await dataService.getProcarNews());
      else if (cat === 'WORLD SBK') setWorldSBKNews(await dataService.getWorldSBKNews());
      else if (cat === 'WTCR') setWtcrNews(await dataService.getWTCRNews());
      loadedDataRef.current.add(key);
    } catch (e) { console.error(`News fetch error for ${cat}:`, e); }
    finally { setIsCatNewsLoading(false); }
  }, []);

  const fetchGlobalNews = useCallback(async () => {
    if (loadedDataRef.current.has('globalNews')) return;
    setIsGlobalNewsLoading(true);
    try {
      const results = await Promise.allSettled([
        dataService.getF1News(),
        dataService.getWRCNews(),
        dataService.getWRC2News(),
        dataService.getTCNews(),
        dataService.getIndyCarNews(),
        dataService.getNascarNews(),
        dataService.getTC2000News(),
        dataService.getTNC3News(),
        dataService.getNascarTruckNews(),
        dataService.getWECNews(),
        dataService.getIMSANews(),
        dataService.getF2News(),
        dataService.getF3News(),
        dataService.getFENews(),
        dataService.getF1AcademyNews(),
        dataService.getBTCCNews(),
        dataService.getSUPERCARSNews(),
        dataService.getMotoGPNews(),
        dataService.getDTMNews(),
        dataService.getSFNews(),
        dataService.getELMSNews(),
        dataService.getWorldSBKNews(),
      ]);
      
      if (results[0].status === 'fulfilled') setF1News(results[0].value);
      if (results[1].status === 'fulfilled') setWrcNews(results[1].value);
      if (results[2].status === 'fulfilled') setWrc2News(results[2].value as NewsItem[]);
      if (results[3].status === 'fulfilled') setTcNews(results[3].value as NewsItem[]);
      if (results[4].status === 'fulfilled') setIndyNews(results[4].value);
      if (results[5].status === 'fulfilled') setNascarNews(results[5].value);
      if (results[6].status === 'fulfilled') setTc2000News(results[6].value);
      if (results[7].status === 'fulfilled') setTnc3News(results[7].value);
      if (results[8].status === 'fulfilled') setNascarTNews(results[8].value);
      if (results[9].status === 'fulfilled') setWecNews(results[9].value);
      if (results[10].status === 'fulfilled') setImsaNews(results[10].value);
      if (results[11].status === 'fulfilled') setF2News(results[11].value);
      if (results[12].status === 'fulfilled') setF3News(results[12].value);
      if (results[13].status === 'fulfilled') setFENews(results[13].value);
      if (results[14].status === 'fulfilled') setF1aNews(results[14].value as NewsItem[]);
      if (results[15].status === 'fulfilled') setBtccNews(results[15].value as NewsItem[]);
      if (results[16].status === 'fulfilled') setSupercarsNews(results[16].value as NewsItem[]);
      if (results[17].status === 'fulfilled') setMotoGPNews(results[17].value as NewsItem[]);
      if (results[18].status === 'fulfilled') setDtmNews(results[18].value as NewsItem[]);
      if (results[19].status === 'fulfilled') setSfNews(results[19].value as NewsItem[]);
      if (results[20].status === 'fulfilled') setElmsNews(results[20].value as NewsItem[]);
      if (results[21]?.status === 'fulfilled') setWorldSBKNews((results[21] as any).value);

      loadedDataRef.current.add('globalNews');
    } catch (e) {
      console.error('Global news fetch error:', e);
    } finally {
      setIsGlobalNewsLoading(false);
    }
  }, []);

  const fetchHomeData = useCallback(async () => {
    setIsHomeLoading(true);
    try {
      const weekly = await dataService.getWeeklyCalendar();
      setWeeklyRaces(weekly);
      loadedDataRef.current.add('home');
    } catch (e) {
      console.error('Home fetch error:', e);
    } finally {
      setIsHomeLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    loadedDataRef.current.clear(); // Reset cache to force refetch
    
    if (view === 'category') {
      const cat = selectedCategory;
      loadedDataRef.current.delete(`${cat}-calendar`);
      loadedDataRef.current.delete(`${cat}-standings`);
      loadedDataRef.current.delete(`${cat}-news`);
      await Promise.allSettled([
        fetchCategoryCalendar(cat),
        fetchCategoryStandings(cat),
        fetchCategoryNews(cat)
      ]);
    } else if (mainTab === 'home') {
      await fetchHomeData();
    } else if (mainTab === 'noticias') {
      await fetchGlobalNews();
    } else if (mainTab === 'calendario') {
      // Home data is essentially the weekly calendar
      await fetchHomeData();
    }
    
    setIsRefreshing(false);
  }, [view, mainTab, selectedCategory, fetchHomeData, fetchGlobalNews]);

  useEffect(() => {
    // Mandatory initial splash screen delay
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // PWA Detection
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      
      if (isMobile && !isStandalone) {
        setShowPwaPrompt(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { 
    // Eagerly preload home calendar events regardless of active tab
    fetchHomeData(); 
  }, [fetchHomeData]);

  useEffect(() => {
    if (view === 'category') {
      fetchCategoryCalendar(selectedCategory);
      fetchCategoryStandings(selectedCategory);
      fetchCategoryNews(selectedCategory);
    }
  }, [view, selectedCategory, fetchCategoryCalendar, fetchCategoryStandings, fetchCategoryNews]);

  useEffect(() => {
    if (weeklyRaces.length > 0) {
      const now = Date.now();
      const hasUpcoming = weeklyRaces.some(race => 
        race.schedules.some(s => s.startAt >= now)
      );
      const hasFinished = weeklyRaces.some(race => 
        race.schedules.some(s => s.startAt < now)
      );

      if (!hasUpcoming && hasFinished) {
        setExpandedWeeklySection('finished');
      } else if (hasUpcoming) {
        setExpandedWeeklySection('upcoming');
      }
    }
  }, [weeklyRaces]);

  useEffect(() => {
    // Eagerly preload global news regardless of active tab
    fetchGlobalNews();
  }, [fetchGlobalNews]);

  const handleCategoryClick = (cat: CategoryType) => {
    setSelectedCategory(cat);
    setCategorySubTab('standings');
    setView('category');
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  };

  // ==================== RENDER: HOME ====================
  const renderHome = () => (
    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="home-view">
      <div className="categories-grid">
        <button className="cat-card f1-card" onClick={() => handleCategoryClick('F1')}>
          <div className="cat-card-glow" />
          <img 
            src={F1_LOGO} 
            alt="F1" 
            className="cat-logo f1-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">Formula 1</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card f2-card" onClick={() => handleCategoryClick('F2')}>
          <div className="cat-card-glow" />
          <img 
            src={F2_LOGO} 
            alt="F2" 
            className="cat-logo f2-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">Formula 2</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card f3-card" onClick={() => handleCategoryClick('F3')}>
          <div className="cat-card-glow" />
          <img 
            src={F3_LOGO} 
            alt="F3" 
            className="cat-logo f3-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">Formula 3</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card fe-card" onClick={() => handleCategoryClick('FE')}>
          <div className="cat-card-glow" />
          <img 
            src={FE_LOGO} 
            alt="FE" 
            className="cat-logo fe-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">Formula E</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card f1a-card" onClick={() => handleCategoryClick('F1A')}>
          <div className="cat-card-glow" />
          <img 
            src={F1A_LOGO} 
            alt="F1A" 
            className="cat-logo f1a-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">F1 Academy</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card indycar-card" onClick={() => handleCategoryClick('IndyCar')}>
          <div className="cat-card-glow" />
          <img 
            src={INDYCAR_LOGO} 
            alt="IndyCar" 
            className="cat-logo indycar-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">IndyCar</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card supercars-card" onClick={() => handleCategoryClick('SUPERCARS')}>
          <div className="cat-card-glow" />
          <img 
            src={SUPERCARS_LOGO} 
            alt="Supercars" 
            className="cat-logo supercars-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">Supercars</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card gtwc-card" onClick={() => handleCategoryClick('GTWC')}>
          <div className="cat-card-glow" />
          <img 
            src={GTWC_LOGO} 
            alt="GTWC" 
            className="cat-logo gtwc-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">GT World Challenge</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card btcc-card" onClick={() => handleCategoryClick('BTCC')}>
          <div className="cat-card-glow" />
          <img 
            src={BTCC_LOGO} 
            alt="BTCC" 
            className="cat-logo btcc-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">BTCC</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card dtm-card" onClick={() => handleCategoryClick('DTM')}>
          <div className="cat-card-glow" />
          <img 
            src={DTM_LOGO} 
            alt="DTM" 
            className="cat-logo dtm-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">DTM</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card sf-card" onClick={() => handleCategoryClick('SF')}>
          <div className="cat-card-glow" />
          <img 
            src={SF_LOGO} 
            alt="Super Formula" 
            className="cat-logo sf-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">Super Formula</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>

        <button className="cat-card wrc-card" onClick={() => handleCategoryClick('WRC')}>
          <div className="cat-card-glow" />
          <img 
            src={WRC_LOGO} 
            alt="WRC" 
            className="cat-logo wrc-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">WRC</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card wrc2-card" onClick={() => handleCategoryClick('WRC2')}>
          <div className="cat-card-glow" />
          <img 
            src={WRC2_LOGO} 
            alt="WRC2" 
            className="cat-logo wrc-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">WRC2</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card wec-card" onClick={() => handleCategoryClick('WEC')}>
          <div className="cat-card-glow" />
          <img src={WEC_LOGO} alt="WEC" className="cat-logo wec-logo" />
          <span className="cat-label">WEC</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card elms-card" onClick={() => handleCategoryClick('ELMS')}>
          <div className="cat-card-glow" />
          <img 
            src={ELMS_LOGO} 
            alt="ELMS" 
            className="cat-logo elms-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">ELMS</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card imsa-card" onClick={() => handleCategoryClick('IMSA')}>
          <div className="cat-card-glow" />
          <img 
            src="/IMSA.png" 
            alt="IMSA" 
            className="cat-logo imsa-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">IMSA</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card nascar-card" onClick={() => handleCategoryClick('NASCAR')}>
          <div className="cat-card-glow" />
          <img 
            src="/NASCAR.png" 
            alt="NASCAR" 
            className="cat-logo nascar-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">NASCAR Cup</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card nascaro-card" onClick={() => handleCategoryClick('NASCARO')}>
          <div className="cat-card-glow" />
          <img 
            src="/NASCARO.png" 
            alt="NASCAR O'Reilly" 
            className="cat-logo nascar-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">NASCAR O'Reilly</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card nascart-card" onClick={() => handleCategoryClick('NASCART')}>
          <div className="cat-card-glow" />
          <img 
            src="/NASCART.png" 
            alt="NASCAR Truck" 
            className="cat-logo nascar-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">NASCAR Truck</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card motogp-card" onClick={() => handleCategoryClick('MotoGP')}>
          <div className="cat-card-glow" />
          <img 
            src={MotoGP_LOGO} 
            alt="MotoGP" 
            className="cat-logo motogp-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">MotoGP</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card worldsbk-card" onClick={() => handleCategoryClick('WORLD SBK')}>
          <div className="cat-card-glow" />
          <img 
            src={WORLDSBK_LOGO} 
            alt="WORLD SBK" 
            className="cat-logo worldsbk-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">WORLD SBK</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tc-card" onClick={() => handleCategoryClick('TC')}>
          <div className="cat-card-glow" />
          <img 
            src={TC_LOGO} 
            alt="TC" 
            className="cat-logo tc-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">TC</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcp-card" onClick={() => handleCategoryClick('TCP')}>
          <div className="cat-card-glow" />
          <img 
            src={TCP_LOGO} 
            alt="TCP" 
            className="cat-logo tcp-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">TC Pista</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcm-card" onClick={() => handleCategoryClick('TCM')}>
          <div className="cat-card-glow" />
          <img 
            src="/TCM.png" 
            alt="TCM" 
            className="cat-logo tcm-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">TC Mouras</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcpm-card" onClick={() => handleCategoryClick('TCPM')}>
          <div className="cat-card-glow" />
          <img 
            src="/TCPM.png" 
            alt="TCPM" 
            className="cat-logo tcpm-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">TC Pista Mouras</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcpk-card" onClick={() => handleCategoryClick('TCPK')}>
          <div className="cat-card-glow" />
          <img 
            src={TCPK_LOGO} 
            alt="TCPK" 
            className="cat-logo tcpk-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">TC Pick Up</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tcppk-card" onClick={() => handleCategoryClick('TCPPK')}>
          <div className="cat-card-glow" />
          <img 
            src="/TCPPK.png" 
            alt="TCPPK" 
            className="cat-logo tcppk-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">TC Pista Pick Up</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tnc3-card" onClick={() => handleCategoryClick('TNC3')}>
          <div className="cat-card-glow" />
          <img 
            src={TNC3_LOGO} 
            alt="TN Clase 3" 
            className="cat-logo tnc3-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">TN Clase 3</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tnc2-card" onClick={() => handleCategoryClick('TNC2')}>
          <div className="cat-card-glow" />
          <img 
            src={TNC2_LOGO} 
            alt="TN Clase 2" 
            className="cat-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">TN Clase 2</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card tc2000-card" onClick={() => handleCategoryClick('TC2000')}>
          <div className="cat-card-glow" />
          <img 
            src="/TC2000.png" 
            alt="TC2000" 
            className="cat-logo tc2000-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">TC2000</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card procar-card" onClick={() => handleCategoryClick('PROCAR4000')}>
          <div className="cat-card-glow" />
          <img 
            src={PROCAR_LOGO} 
            alt="PROCAR4000" 
            className="cat-logo procar-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">PROCAR4000</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
        <button className="cat-card wtcr-card" onClick={() => handleCategoryClick('WTCR')}>
          <div className="cat-card-glow" />
          <img 
            src={WTCR_LOGO} 
            alt="WTCR" 
            className="cat-logo wtcr-logo" 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span className="cat-label">World TCR</span>
          <ChevronRight size={18} className="cat-arrow" />
        </button>
      </div>
    </motion.div>
  );

  const getLocalFallbackImage = (cat: string) => {
    const c = cat?.toUpperCase() || '';
    if (c.includes('F1') || c.includes('FORMULA 1')) return F1_LOGO;
    if (c.includes('F2') || c.includes('FORMULA 2')) return F2_LOGO;
    if (c.includes('F3') || c.includes('FORMULA 3')) return F3_LOGO;
    if (c.includes('FE') || c.includes('FORMULA E')) return FE_LOGO;
    if (c.includes('F1A') || c.includes('F1 ACADEMY')) return F1A_LOGO;
    if (c.includes('MOTOGP')) return MotoGP_LOGO;
    if (c.includes('WRC2')) return WRC2_LOGO;
    if (c.includes('WRC')) return WRC_LOGO;
    if (c.includes('INDYCAR')) return INDYCAR_LOGO;
    if (c.includes('NASCAR TRUCK')) return NASCART_LOGO;
    if (c.includes('WEC')) return WEC_LOGO;
    if (c.includes('NASCAR O REILLY')) return NASCARO_LOGO;
    if (c.includes('NASCAR')) return NASCAR_LOGO;
    if (c.includes('IMSA')) return IMSA_LOGO;
    if (c.includes('TC2000')) return '/TC2000.png';
    if (c.includes('TNC3')) return TNC3_LOGO;
    if (c.includes('TNC2')) return TNC2_LOGO;
    if (c.includes('TCPK') || c.includes('TC PICK UP')) return TCPK_LOGO;
    if (c.includes('TCPM') || c.includes('PISTA MOURAS')) return '/TCPM.png';
    if (c.includes('TCM') || c.includes('MOURAS')) return '/TCM.png';
    if (c.includes('TCP') || c.includes('PISTA')) return TCP_LOGO;
    if (c === 'TC' || c.includes('TURISMO CARRETERA')) return TC_LOGO;
    if (c.includes('SF') || c.includes('SUPER FORMULA')) return SF_LOGO;
    if (c.includes('ELMS') || c.includes('EUROPEAN LE MANS')) return ELMS_LOGO;
    if (c.includes('WTCR') || c.includes('TCR WORLD')) return WTCR_LOGO;
    return null;
  };

  const renderCalendario = () => {
    const flatSchedules = weeklyRaces.flatMap(race =>
      race.schedules.map(s => ({
        ...s,
        category: race.category,
        categoryImage: getLocalFallbackImage(race.category) || race.categoryImage,
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
                              {item.categoryImage && (
                                <img 
                                  src={item.categoryImage} 
                                  alt="" 
                                  className="weekly-cat-img" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                              )}
                              <span className="weekly-cat-badge" style={{ color: item.categoryColor }}>{item.category}</span>
                              <span className="weekly-sched-time-right">{item.time}</span>
                            </div>
                            <h3 className="weekly-event-name">{item.name}</h3>
                            <p className="weekly-circuit">{item.event} {item.circuit}</p>
                            {/* CIRCUIT IMAGES REMOVED FROM WEEKLY VIEW */}

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
                              {item.categoryImage && (
                                <img 
                                  src={item.categoryImage} 
                                  alt="" 
                                  className="weekly-cat-img" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                              )}
                              <span className="weekly-cat-badge" style={{ color: item.categoryColor }}>{item.category}</span>
                              <span className="weekly-sched-time-right">{item.time}</span>
                            </div>
                            <h3 className="weekly-event-name">{item.name}</h3>
                            <p className="weekly-circuit">{item.event} {item.circuit}</p>
                            {/* CIRCUIT IMAGES REMOVED FROM WEEKLY VIEW */}

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
                  {races[0]?.categoryImage && (
                    <img 
                      src={races[0].categoryImage} 
                      alt="" 
                      className="cat-event-logo" 
                      referrerPolicy="no-referrer"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <div className="cat-event-title-block" onClick={() => {
                    const hasDetails = races[0]?.circuitImage || (races[0]?.watchLinks ?? []).length > 0 || races[0]?.ticketLink;
                    if (hasDetails) {
                      setExpandedEvent(expandedEvent === category ? null : category);
                    }
                  }}>
                    <div className="cat-event-category-row">
                      <h3 className="cat-event-category">{category}</h3>
                      { (races[0]?.circuitImage || (races[0]?.watchLinks ?? []).length > 0 || races[0]?.ticketLink) && (
                        <ChevronRight size={16} className={`expand-chevron ${expandedEvent === category ? 'open' : ''}`} />
                      )}
                    </div>
                    <p className="cat-event-circuit">{races[0]?.circuit}</p>
                  </div>
                </div>
                {expandedEvent === category && (
                  <div className="cat-event-expanded-details">
                    {races[0]?.circuitImage && category !== 'ELMS' && (
                      <img 
                        src={races[0].circuitImage} 
                        alt="Circuito" 
                        className="circuit-image" 
                        referrerPolicy="no-referrer"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
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
    // Interleave news based on Home Grid Order: F1, WRC, WEC, IMSA, NASCAR, NASCAR O REILLY, IndyCar, TC, TCP, TCM, TCPM, TCPK, TCPPK, TC2000
    const sourceArrays = [
      f1News, f2News, f3News, f1aNews, btccNews, supercarsNews, gtwcNews, motoGPNews, sfNews,
      wrcNews, wrc2News, wecNews, imsaNews, nascarNews, nascarONews, nascarTNews, indyNews,
      tcNews, tnc3News, tcpNews, tcmNews, tcpmNews, tcpkNews, tcppkNews, tc2000News, feNews,
      worldSBKNews, elmsNews, wtcrNews
    ];

    let allNewsList: NewsItem[] = [];
    const maxLen = Math.max(...sourceArrays.map(arr => arr.length));
    for (let i = 0; i < maxLen; i++) {
      for (const arr of sourceArrays) {
        if (arr[i]) allNewsList.push(arr[i]);
      }
    }

    if (selectedNewsCategories.length < NEWS_CATEGORIES.length) {
      allNewsList = allNewsList.filter(item => item.category ? selectedNewsCategories.includes(item.category) : false);
    }

    const toggleTempCat = (c: string) => {
      if (tempNewsCategories.includes(c)) setTempNewsCategories(tempNewsCategories.filter(x => x !== c));
      else setTempNewsCategories([...tempNewsCategories, c]);
    };

    return (
      <motion.div key="noticias" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="noticias-view">
        <div className="news-filter-container">
          <button className="news-filter-toggle" onClick={() => {
            if (!isNewsFilterOpen) setTempNewsCategories([...selectedNewsCategories]);
            setIsNewsFilterOpen(!isNewsFilterOpen);
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              Filtros {selectedNewsCategories.length > 0 ? <span className="filter-badge-count">{selectedNewsCategories.length}</span> : ''}
            </div>
            <ChevronRight size={18} className={`filter-chevron ${isNewsFilterOpen ? 'open' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isNewsFilterOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="news-filter-dropdown" style={{ overflow: 'hidden' }}>
                <div className="filter-chips-grid">
                  {NEWS_CATEGORIES.map(c => (
                    <button 
                      key={c}
                      className={`filter-chip ${tempNewsCategories.includes(c) ? 'active' : ''}`}
                      onClick={() => toggleTempCat(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="filter-actions">
                  <button className="filter-btn filter-reset-btn" onClick={() => {
                    setSelectedNewsCategories(NEWS_CATEGORIES);
                    setTempNewsCategories(NEWS_CATEGORIES);
                    setIsNewsFilterOpen(false);
                  }}>Restablecer</button>
                  <button className="filter-btn filter-apply-btn" onClick={() => {
                    setSelectedNewsCategories(tempNewsCategories);
                    setIsNewsFilterOpen(false);
                  }}>Aplicar</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
    const isWRC2 = selectedCategory === 'WRC2';
    const isTC = selectedCategory === 'TC';
    const isTCP = selectedCategory === 'TCP';
    const isTCM = selectedCategory === 'TCM';
    const isTCPM = selectedCategory === 'TCPM';
    const isTCPK = selectedCategory === 'TCPK';
    const isTCPPK = selectedCategory === 'TCPPK';
    const isIndy = selectedCategory === 'IndyCar';
    const isNascar = selectedCategory === 'NASCAR';
    const isTC2000 = selectedCategory === 'TC2000';
    const isTNC3 = selectedCategory === 'TNC3';
    const isTNC2 = selectedCategory === 'TNC2';
    const isWEC = selectedCategory === 'WEC';
    const isIMSA = selectedCategory === 'IMSA';
    const isNASCARO = selectedCategory === 'NASCARO';
    const isNASCART = selectedCategory === 'NASCART';
    const isF2 = selectedCategory === 'F2';
    const isF3 = selectedCategory === 'F3';
    const isFE = selectedCategory === 'FE';
    const isF1A = selectedCategory === 'F1A';
    const isSUPERCARS = selectedCategory === 'SUPERCARS';
    const isGTWC = selectedCategory === 'GTWC';
    const isMotoGP = selectedCategory === 'MotoGP';
    const isBTCC = selectedCategory === 'BTCC';
    const isDTM = selectedCategory === 'DTM';
    const isSF = selectedCategory === 'SF';
    const isELMS = selectedCategory === 'ELMS';
    const isPROCAR4000 = selectedCategory === 'PROCAR4000';
    const isWORLDSBK = selectedCategory === 'WORLD SBK';
    const isWTCR = selectedCategory === 'WTCR';
    
    let logo = F1_LOGO;
    if (isWRC) logo = WRC_LOGO;
    if (isWRC2) logo = WRC2_LOGO;
    if (isTC) logo = TC_LOGO;
    if (isTCP) logo = TCP_LOGO;
    if (isTCM) logo = '/TCM.png';
    if (isTCPM) logo = '/TCPM.png';
    if (isTCPK) logo = TCPK_LOGO;
    if (isTCPPK) logo = '/TCPPK.png';
    if (isTC2000) logo = '/TC2000.png';
    if (isTNC3) logo = TNC3_LOGO;
    if (isTNC2) logo = TNC2_LOGO;
    if (isIndy) logo = INDYCAR_LOGO;
    if (isNascar) logo = NASCAR_LOGO;
    if (isWEC) logo = '/WEC.png';
    if (isIMSA) logo = IMSA_LOGO;
    if (isNASCARO) logo = NASCARO_LOGO;
    if (isNASCART) logo = NASCART_LOGO;
    if (isF2) logo = F2_LOGO;
    if (isF3) logo = F3_LOGO;
    if (isFE) logo = FE_LOGO;
    if (isF1A) logo = F1A_LOGO;
    if (isSUPERCARS) logo = SUPERCARS_LOGO;
    if (isGTWC) logo = GTWC_LOGO;
    if (isMotoGP) logo = MotoGP_LOGO;
    if (isBTCC) logo = BTCC_LOGO;
    if (isDTM) logo = DTM_LOGO;
    if (isSF) logo = SF_LOGO;
    if (isELMS) logo = ELMS_LOGO;
    if (isPROCAR4000) logo = PROCAR_LOGO;
    if (isWORLDSBK) logo = WORLDSBK_LOGO;
    if (isWTCR) logo = WTCR_LOGO;

    let catTitle = '';
    if (isF1) catTitle = 'Formula 1';
    if (isWRC) catTitle = 'World Rally Championship';
    if (isWRC2) catTitle = 'WRC2';
    if (isTC) catTitle = 'Turismo Carretera';
    if (isTCP) catTitle = 'TC Pista';
    if (isTCM) catTitle = 'TC Mouras';
    if (isTCPM) catTitle = 'TC Pista Mouras';
    if (isTCPK) catTitle = 'TC Pick Up';
    if (isTCPPK) catTitle = 'TC Pista Pick Up';
    if (isIndy) catTitle = 'IndyCar';
    if (isNascar) catTitle = 'NASCAR Cup Series';
    if (isTC2000) catTitle = 'TC2000';
    if (isTNC3) catTitle = 'TN Clase 3';
    if (isTNC2) catTitle = 'TN Clase 2';
    if (isWEC) catTitle = 'WEC';
    if (isIMSA) catTitle = 'IMSA';
    if (isNASCARO) catTitle = 'NASCAR O\'Reilly';
    if (isNASCART) catTitle = 'NASCAR Truck Series';
    if (isF2) catTitle = 'Formula 2';
    if (isF3) catTitle = 'Formula 3';
    if (isFE) catTitle = 'Formula E';
    if (isF1A) catTitle = 'F1 Academy';
    if (isGTWC) catTitle = 'GT World Challenge';
    if (isBTCC) catTitle = 'BTCC';
    if (isDTM) catTitle = 'DTM';
    if (isMotoGP) catTitle = 'MotoGP';
    if (isSUPERCARS) catTitle = 'Supercars';
    if (isSF) catTitle = 'Super Formula';
    if (isELMS) catTitle = 'European Le Mans Series';
    if (isPROCAR4000) catTitle = 'PROCAR4000';
    if (isWORLDSBK) catTitle = 'WORLD SBK';
    if (isWTCR) catTitle = 'FIA TCR World Tour';

    let news = f1News;
    if (isWRC) news = wrcNews;
    if (isWRC2) news = wrc2News;
    if (isTC) news = tcNews;
    if (isTCP) news = tcpNews;
    if (isTCM) news = tcmNews;
    if (isTCPM) news = tcpmNews;
    if (isTCPK) news = tcpkNews;
    if (isTCPPK) news = tcppkNews;
    if (isIndy) news = indyNews;
    if (isNascar) news = nascarNews;
    if (isTC2000) news = tc2000News;
    if (isTNC3) news = tnc3News;
    if (isTNC2) news = tnc3News;
    if (isWEC) news = wecNews;
    if (isIMSA) news = imsaNews;
    if (isNASCARO) news = nascarONews;
    if (isNASCART) news = nascarTNews;
    if (isF2) news = f2News;
    if (isF3) news = f3News;
    if (isFE) news = feNews;
    if (isF1A) news = f1aNews;
    if (isSUPERCARS) news = supercarsNews;
    if (isGTWC) news = gtwcNews;
    if (isBTCC) news = btccNews;
    if (isMotoGP) news = motoGPNews;
    if (isDTM) news = dtmNews;
    if (isSF) news = sfNews;
    if (isELMS) news = elmsNews;
    if (isPROCAR4000) news = procarNews;
    if (isWORLDSBK) news = worldSBKNews;
    if (isWTCR) news = wtcrNews;


    let resultsUrl = '';
    if (isF1) resultsUrl = 'https://www.formula1.com/en/results.html/2024/races.html';
    if (isF2) resultsUrl = 'https://www.fiaformula2.com/Results';
    if (isF3) resultsUrl = 'https://www.fiaformula3.com/Results';
    if (isFE) resultsUrl = 'https://www.fiaformulae.com/en/results';
    if (isF1A) resultsUrl = 'https://lat.motorsport.com/f1-academy/results/2026/shanghai-664714/';
    if (isSUPERCARS) resultsUrl = 'https://lat.motorsport.com/v8supercars/results/2026/sydney-500/';
    if (isWRC) resultsUrl = 'https://www.wrc.com/c/events/2024';
    if (isTC) resultsUrl = 'https://actc.org.ar/tc/carreras.html';
    if (isTCP) resultsUrl = 'https://actc.org.ar/tcp/carreras.html';
    if (isTCM) resultsUrl = 'https://actc.org.ar/tcm/carreras.html';
    if (isTCPM) resultsUrl = 'https://actc.org.ar/tcpm/carreras.html';
    if (isTCPK) resultsUrl = 'https://actc.org.ar/tcpk/carreras.html';
    if (isTCPPK) resultsUrl = 'https://actc.org.ar/tcppk/carreras.html';
    if (isTC2000) resultsUrl = 'https://tc2000.com.ar/carreras.php';
    if (isTNC3) resultsUrl = 'https://apat.org.ar/carreras/calendario';
    if (isTNC2) resultsUrl = 'https://apat.org.ar/carreras/calendario';
    if (isIndy) resultsUrl = 'https://www.indycar.com/Results';
    if (isNascar || isNASCARO || isNASCART) resultsUrl = 'https://www.nascar.com/results';
    if (isWEC) resultsUrl = 'https://www.fiawec.com/en/results';
    if (isIMSA) resultsUrl = 'https://www.imsa.com/results/';
    if (isGTWC) resultsUrl = 'https://www.gt-world-challenge.com/calendar';
    if (isMotoGP) resultsUrl = 'https://www.motogp.com/es/results-statistics';
    if (isDTM) resultsUrl = 'https://es.motorsport.com/dtm/results/2026';
    if (isSF) resultsUrl = 'https://es.motorsport.com/super-formula/results/2026';
    if (isELMS) resultsUrl = 'https://lat.motorsport.com/elms/results/2026';
    if (isPROCAR4000) resultsUrl = 'https://www.procar4000.com.ar/procar_4000/index.php/2013-01-31-06-54-32/resultados';
    if (isWORLDSBK) resultsUrl = 'https://www.worldsbk.com/en/results%20statistics';
    if (isWTCR) resultsUrl = 'https://www.fiatcrworldtour.com/STANDINGS';


    return (
      <motion.div key="category" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="category-view">
        <header className="cat-header">
          <button className="back-btn" onClick={() => setView('main')}>
            <ArrowLeft size={22} />
          </button>
          <img 
            src={logo} 
            alt={catTitle} 
            className={`cat-header-logo ${isSUPERCARS ? 'supercars-logo' : ''} ${isTNC3 ? 'tnc3-logo' : ''} ${isTC2000 ? 'tc2000-logo' : ''} ${isWEC ? 'wec-logo' : ''} ${isWRC || isWRC2 ? 'wrc-logo' : ''} ${isNascar || isNASCART ? 'nascar-logo' : ''} ${isIndy ? 'indycar-logo' : ''} ${isIMSA ? 'imsa-logo' : ''} ${isF3 ? 'f3-logo' : ''} ${isFE ? 'fe-logo' : ''} ${isF1A ? 'f1a-logo' : ''} ${isGTWC ? 'gtwc-logo' : ''} ${isDTM ? 'dtm-logo' : ''} ${isSF ? 'sf-logo' : ''} ${isWTCR ? 'wtcr-logo' : ''}`} 
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <h2 className="cat-header-title">{catTitle}</h2>
        </header>

        <div className="cat-tabs">
          <button className={`cat-tab ${categorySubTab === 'standings' ? 'active' : ''}`} onClick={() => setCategorySubTab('standings')}>
            <span>Posiciones</span>
          </button>
          <button className={`cat-tab ${categorySubTab === 'results' ? 'active' : ''}`} onClick={() => setCategorySubTab('results')}>
            <span>Resultados</span>
          </button>
          <button className={`cat-tab ${categorySubTab === 'calendar' ? 'active' : ''}`} onClick={() => setCategorySubTab('calendar')}>
            <span>Calendario</span>
          </button>
          <button className={`cat-tab ${categorySubTab === 'news' ? 'active' : ''}`} onClick={() => setCategorySubTab('news')}>
            <span>Noticias</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {categorySubTab === 'calendar' && (
            <motion.div key="cat-cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cat-content">
              {isCatCalLoading ? renderLoadingCircle() : (
                <>
                {(isF1 || isF2 || isF3 || isFE || isF1A || isSUPERCARS || isSF || isELMS) ? (
                  <div className="f1-calendar-list">
                    {(isF1 ? f1Calendar : isF2 ? f2Calendar : isF3 ? f3Calendar : isF1A ? f1aCalendar : isSUPERCARS ? supercarsCalendar : isSF ? sfCalendar : isELMS ? elmsCalendar : isPROCAR4000 ? procarCalendar : isWORLDSBK ? worldSBKCalendar : feCalendar).map((race, idx) => (
                    <div key={idx} className={`race-row ${race.status === 'Live' ? 'live' : ''}`}>
                      <div className={`race-round-num ${race.status.toLowerCase()}`}>{race.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{race.race}</span>
                        <span className="race-date-label">{race.dates}</span>
                      </div>
                      <div className={`race-status-badge ${race.status.toLowerCase()}`}>
                        {race.status === 'Live' ? 'EN CURSO' :
                          race.status === 'Finished' ? 'FINALIZADO' :
                            race.status === 'Cancelled' ? 'CANCELADO' :
                              (race.status === 'Next' || race.status === 'Upcoming') ? 'PRÓXIMO' : '—'}
                      </div>
                    </div>
                  ))}
                  {((isF1 && f1Calendar.length === 0) ||
                      (isF2 && f2Calendar.length === 0) ||
                      (isF3 && f3Calendar.length === 0) ||
                      (isFE && feCalendar.length === 0) ||
                      (isF1A && f1aCalendar.length === 0) ||
                      (isSF && sfCalendar.length === 0) ||
                      (isELMS && elmsCalendar.length === 0) ||
                      (isPROCAR4000 && procarCalendar.length === 0) ||
                      (isWORLDSBK && worldSBKCalendar.length === 0) ||
                      (isSUPERCARS && supercarsCalendar.length === 0)) && !isLoading && !isCatCalLoading && (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : (isWRC || isWRC2) ? (
                <div className="wrc-calendar-list">
                  {(isWRC2 ? wrc2Calendar : wrcCalendar).length > 0 ? (isWRC2 ? wrc2Calendar : wrcCalendar).map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status === 'Live' ? 'live' : ''}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.rallyName}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Live' ? 'EN CURSO' :
                          ev.status === 'Finished' ? 'FINALIZADO' :
                            (ev.status === 'Next' || ev.status === 'Upcoming') ? 'PRÓXIMO' : '—'}
                      </div>
                    </div>
                  )) : (
                                        <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
      ) : (isTC || isTCP) ? (
        <div className="tcp-calendar-list">
          {(isTC ? tcCalendar : tcpCalendar).length > 0 ? (isTC ? tcCalendar : tcpCalendar).map((ev, idx) => (
            <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
              <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
              <div className="race-info-block">
                <span className="race-name-label">{ev.race}</span>
                <span className="race-date-label">{ev.dates}</span>
              </div>
              <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                {ev.status === 'Finished' ? 'FINALIZADO' : 
                 ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
              </div>
            </div>
          )) : (
            <p className="empty-msg">No hay eventos programados.</p>
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
                {ev.status === 'Finished' ? 'FINALIZADO' : 
                 ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
              </div>
            </div>
          )) : (
            <p className="empty-msg">No hay eventos programados.</p>
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
                {ev.status === 'Finished' ? 'FINALIZADO' : 
                 ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
              </div>
            </div>
          )) : (
            <p className="empty-msg">No hay eventos programados.</p>
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
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
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
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isBTCC ? (
                <div className="btcc-calendar-list">
                  {btccCalendar.length > 0 ? btccCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isDTM ? (
                <div className="dtm-calendar-list">
                  {dtmCalendar.length > 0 ? dtmCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
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
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isSUPERCARS ? (
                <div className="supercars-calendar-list">
                  {supercarsCalendar.length > 0 ? supercarsCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isGTWC ? (
                <div className="gtwc-calendar-list">
                  {gtwcCalendar.length > 0 ? gtwcCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isMotoGP ? (
                <div className="motogp-calendar-list">
                  {motoGPCalendar.length > 0 ? motoGPCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isWORLDSBK ? (
                <div className="worldsbk-calendar-list">
                  {worldSBKCalendar.length > 0 ? worldSBKCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : (isNascar || isNASCART) ? (
                <div className="nascar-calendar-list">
                  {(isNASCART ? nascarTCalendar : nascarCalendar).length > 0 ? (isNASCART ? nascarTCalendar : nascarCalendar).map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
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
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No se encontró calendario TC2000.</p>
                  )}
                </div>
              ) : isTNC3 || isTNC2 ? (
                <div className="tnc3-calendar-list">
                  {tnc3Calendar.length > 0 ? tnc3Calendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status === 'Live' ? 'live' : ev.status === 'Next' ? 'next' : ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status === 'Live' ? 'live' : ev.status === 'Next' ? 'next' : ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status === 'Live' ? 'live' : ev.status === 'Next' ? 'next' : ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No se encontró calendario TN Clase 3.</p>
                  )}
                </div>
              ) : isWEC ? (
                <div className="wec-calendar-list">
                  {wecCalendar.length > 0 ? wecCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.rallyName}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No se encontró calendario WEC.</p>
                  )}
                </div>
              ) : isIMSA ? (
                <div className="imsa-calendar-list">
                  {imsaCalendar.length > 0 ? imsaCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isNASCARO ? (
                <div className="nascar-calendar-list">
                  {nascarOCalendar.length > 0 ? nascarOCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isNASCART ? (
                <div className="nascar-calendar-list">
                  {nascarTCalendar.length > 0 ? nascarTCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isPROCAR4000 ? (
                <div className="procar-calendar-list">
                  {procarCalendar.length > 0 ? procarCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : isWTCR ? (
                <div className="wtcr-calendar-list">
                  {wtcrCalendar.length > 0 ? wtcrCalendar.map((ev, idx) => (
                    <div key={idx} className={`race-row ${ev.status.toLowerCase()}`}>
                      <div className={`race-round-num ${ev.status.toLowerCase()}`}>{ev.round}</div>
                      <div className="race-info-block">
                        <span className="race-name-label">{ev.race}</span>
                        <span className="race-date-label">{ev.dates}</span>
                      </div>
                      <div className={`race-status-badge ${ev.status.toLowerCase()}`}>
                        {ev.status === 'Finished' ? 'FINALIZADO' : 
                         ev.status === 'Live' ? 'EN CURSO' : 'PRÓXIMO'}
                      </div>
                    </div>
                  )) : (
                    <p className="empty-msg">No hay eventos programados.</p>
                  )}
                </div>
              ) : null}
              </>
              )}
            </motion.div>
          )}

          {categorySubTab === 'standings' && (
            <motion.div key="cat-stand" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cat-content">
              {isCatStandLoading ? renderLoadingCircle() : (
                <>
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
              ) : isF2 ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${f2StandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setF2StandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${f2StandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setF2StandingsTab('teams')}>Equipos</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {f2StandingsTab === 'drivers' ? (
                      f2Drivers.map((d, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                            {d.team && <span className="stand-sub">{d.team}</span>}
                          </div>
                          <span className="stand-pts">{d.totalPts || d.points} pts</span>
                        </div>
                      ))
                    ) : (
                      f2Teams.map((c, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.team || c.driver}</span>
                          </div>
                          <span className="stand-pts">{c.totalPts || c.points} pts</span>
                        </div>
                      ))
                    )}
                    {((f2StandingsTab === 'drivers' && f2Drivers.length === 0) || (f2StandingsTab === 'teams' && f2Teams.length === 0)) && <p className="empty-msg">Cargando posiciones...</p>}
                  </div>
                </>
              ) : isWTCR ? (
                <div className="standings-list wtcr-standings">
                  {wtcrStandings.map((d, idx) => (
                    <div key={idx} className={`stand-row wtcr-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                      <span className="stand-pos">{d.pos}</span>
                      <div className="stand-info">
                        <span className="stand-name">{d.driver}</span>
                        {d.team && <span className="stand-sub">{d.team}</span>}
                      </div>
                      <span className="stand-pts">{d.totalPts} pts</span>
                    </div>
                  ))}
                  {wtcrStandings.length === 0 && <p className="empty-msg">Cargando posiciones...</p>}
                </div>
              ) : isF3 ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${f3StandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setF3StandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${f3StandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setF3StandingsTab('teams')}>Equipos</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {f3StandingsTab === 'drivers' ? (
                      f3Drivers.map((d, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                            {d.team && <span className="stand-sub">{d.team}</span>}
                          </div>
                          <span className="stand-pts">{d.totalPts || d.points} pts</span>
                        </div>
                      ))
                    ) : (
                      f3Teams.map((c, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.team || c.driver}</span>
                          </div>
                          <span className="stand-pts">{c.totalPts || c.points} pts</span>
                        </div>
                      ))
                    )}
                    {((f3StandingsTab === 'drivers' && f3Drivers.length === 0) || (f3StandingsTab === 'teams' && f3Teams.length === 0)) && <p className="empty-msg">Cargando posiciones...</p>}
                  </div>
                </>
              ) : isDTM ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${dtmStandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setDtmStandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${dtmStandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setDtmStandingsTab('teams')}>Equipos</button>
                    <button className={`nascar-tab-btn ${dtmStandingsTab === 'constructors' ? 'active' : ''}`} onClick={() => setDtmStandingsTab('constructors')}>Constructores</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {dtmStandingsTab === 'drivers' ? (
                      dtmStandings.drivers.map((d: TCStandingRow, idx: number) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                            <span className="stand-sub">{d.team}</span>
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))
                    ) : dtmStandingsTab === 'teams' ? (
                      dtmStandings.teams.map((t: TCStandingRow, idx: number) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{t.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{t.driver}</span>
                          </div>
                          <span className="stand-pts">{t.points} pts</span>
                        </div>
                      ))
                    ) : (
                      dtmStandings.constructors.map((c: TCStandingRow, idx: number) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.driver}</span>
                          </div>
                          <span className="stand-pts">{c.points} pts</span>
                        </div>
                      ))
                    )}
                    {((dtmStandingsTab === 'drivers' && dtmStandings.drivers.length === 0) || 
                      (dtmStandingsTab === 'teams' && dtmStandings.teams.length === 0) ||
                      (dtmStandingsTab === 'constructors' && dtmStandings.constructors.length === 0)) && <p className="empty-msg">Cargando posiciones...</p>}
                  </div>
                </>
              ) : isSUPERCARS ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${supercarsStandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setSupercarsStandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${supercarsStandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setSupercarsStandingsTab('teams')}>Equipos</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {supercarsStandingsTab === 'drivers' ? (
                      supercarsDrivers.map((d, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                            {d.team && <span className="stand-sub">{d.team}</span>}
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))
                    ) : (
                      supercarsTeams.map((c, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.driver}</span>
                          </div>
                          <span className="stand-pts">{c.points} pts</span>
                        </div>
                      ))
                    )}
                    {((supercarsStandingsTab === 'drivers' && supercarsDrivers.length === 0) || (supercarsStandingsTab === 'teams' && supercarsTeams.length === 0)) && <p className="empty-msg">Cargando posiciones...</p>}
                  </div>
                </>
              ) : isSF ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${sfStandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setSfStandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${sfStandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setSfStandingsTab('teams')}>Equipos</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {sfStandingsTab === 'drivers' ? (
                      sfDrivers.map((d, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                            {d.team && <span className="stand-sub">{d.team}</span>}
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))
                    ) : (
                      sfTeams.map((c, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.driver}</span>
                          </div>
                          <span className="stand-pts">{c.points} pts</span>
                        </div>
                      ))
                    )}
                    {((sfStandingsTab === 'drivers' && sfDrivers.length === 0) || (sfStandingsTab === 'teams' && sfTeams.length === 0)) && <p className="empty-msg">Cargando posiciones...</p>}
                  </div>
                </>
              ) : isELMS ? (
                <>
                  <div className="f1-tabs nascar-tabs btcc-tabs elms-tabs">
                    {[
                      'LMP2 Drivers', 'LMP2 P/A Drivers', 'LMP3 Drivers', 'LMGT3 Drivers',
                      'LMP2 Teams', 'LMP2 P/A Teams', 'LMP3 Teams', 'LMGT3 Teams'
                    ].map(tab => (
                      <button 
                        key={tab}
                        className={`nascar-tab-btn ${elmsStandingsTab === tab ? 'active' : ''}`} 
                        onClick={() => setElmsStandingsTab(tab as any)}
                      >
                        {tab.replace(' Drivers', '').replace(' Teams', (tab.includes('P/A') ? ' T' : ' Teams'))}
                        <span className="tab-suffix">{tab.includes('Drivers') ? ' (P)' : ' (E)'}</span>
                      </button>
                    ))}
                  </div>
                  <div className="standings-list elms-standings">
                    {(elmsStandings[elmsStandingsTab] || []).map((row: any, idx: number) => (
                      <div key={idx} className={`stand-row elms-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{row.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{row.driver || row.team}</span>
                          {row.car && <span className="stand-sub">{row.car}</span>}
                        </div>
                        <span className="stand-pts">{row.points} pts</span>
                      </div>
                    ))}
                    {isCatStandLoading ? (
                      <p className="empty-msg">Cargando posiciones...</p>
                    ) : (elmsStandings[elmsStandingsTab] || []).length === 0 && (
                      <p className="empty-msg">No hay posiciones disponibles.</p>
                    )}
                  </div>
                </>
              ) : isFE ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${feStandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setFEStandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${feStandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setFEStandingsTab('teams')}>Equipos</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {feStandingsTab === 'drivers' ? (
                      feDrivers.map((d, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                            {d.team && <span className="stand-sub">{d.team}</span>}
                          </div>
                          <span className="stand-pts">{d.totalPts || d.points} pts</span>
                        </div>
                      ))
                    ) : (
                      feTeams.map((c, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.team || c.driver}</span>
                          </div>
                          <span className="stand-pts">{c.totalPts || c.points} pts</span>
                        </div>
                      ))
                    )}
                    {((feStandingsTab === 'drivers' && feDrivers.length === 0) || (feStandingsTab === 'teams' && feTeams.length === 0)) && <p className="empty-msg">Cargando posiciones...</p>}
                  </div>
                </>
              ) : isF1A ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${f1aStandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setF1aStandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${f1aStandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setF1aStandingsTab('teams')}>Equipos</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {f1aStandingsTab === 'drivers' ? (
                      f1aDrivers.map((d, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                            {d.team && <span className="stand-sub">{d.team}</span>}
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))
                    ) : (
                      f1aTeams.map((c, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.driver}</span>
                          </div>
                          <span className="stand-pts">{c.points} pts</span>
                        </div>
                      ))
                    )}
                    {((f1aStandingsTab === 'drivers' && f1aDrivers.length === 0) || (f1aStandingsTab === 'teams' && f1aTeams.length === 0)) && <p className="empty-msg">Cargando posiciones...</p>}
                  </div>
                </>
              ) : isBTCC ? (
                <>
                  <div className="f1-tabs nascar-tabs btcc-tabs">
                    <button className={`nascar-tab-btn ${btccStandingsType === 'drivers' ? 'active' : ''}`} onClick={() => { setBtccStandingsType('drivers'); }}>Pilotos</button>
                    <button className={`nascar-tab-btn ${btccStandingsType === 'manufacturers' ? 'active' : ''}`} onClick={() => { setBtccStandingsType('manufacturers'); }}>Constructores</button>
                    <button className={`nascar-tab-btn ${btccStandingsType === 'teams' ? 'active' : ''}`} onClick={() => { setBtccStandingsType('teams'); }}>Equipos</button>
                    <button className={`nascar-tab-btn ${btccStandingsType === 'independent-drivers' ? 'active' : ''}`} onClick={() => { setBtccStandingsType('independent-drivers'); }}>Pilotos Indep.</button>
                    <button className={`nascar-tab-btn ${btccStandingsType === 'independent-teams' ? 'active' : ''}`} onClick={() => { setBtccStandingsType('independent-teams'); }}>Equipos Indep.</button>
                    <button className={`nascar-tab-btn ${btccStandingsType === 'jack-sears-trophy' ? 'active' : ''}`} onClick={() => { setBtccStandingsType('jack-sears-trophy'); }}>Jack Sears</button>
                    <button className={`nascar-tab-btn ${btccStandingsType === 'goodyear-wingfoot-award' ? 'active' : ''}`} onClick={() => { setBtccStandingsType('goodyear-wingfoot-award'); }}>Goodyear Wingfoot</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {(btccStandings[btccStandingsType] || []).map((row: any, idx: number) => (
                      <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{row.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{row.driver || row.team || row.constructor}</span>
                          {row.car && <span className="stand-sub">{row.car}</span>}
                        </div>
                        <span className="stand-pts">{row.points} pts</span>
                      </div>
                    ))}
                    {isCatStandLoading ? (
                      <p className="empty-msg">Cargando posiciones...</p>
                    ) : (btccStandings[btccStandingsType] || []).length === 0 && (
                      <p className="empty-msg">No hay posiciones disponibles en este momento.</p>
                    )}
                  </div>
                </>
              ) : isMotoGP ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${motoGPStandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setMotoGPStandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${motoGPStandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setMotoGPStandingsTab('teams')}>Equipos</button>
                    <button className={`nascar-tab-btn ${motoGPStandingsTab === 'constructors' ? 'active' : ''}`} onClick={() => setMotoGPStandingsTab('constructors')}>Constructor</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {motoGPStandingsTab === 'drivers' ? (
                      motoGPStandings.drivers.map((d, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                            {d.team && <span className="stand-sub">{d.team}</span>}
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))
                    ) : motoGPStandingsTab === 'teams' ? (
                      motoGPStandings.teams.map((c, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.driver}</span>
                          </div>
                          <span className="stand-pts">{c.points} pts</span>
                        </div>
                      ))
                    ) : (
                      motoGPStandings.constructors.map((c, idx) => (
                        <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{c.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{c.driver}</span>
                          </div>
                          <span className="stand-pts">{c.points} pts</span>
                        </div>
                      ))
                    )}
                    {((motoGPStandingsTab === 'drivers' && motoGPStandings.drivers.length === 0) || 
                      (motoGPStandingsTab === 'teams' && motoGPStandings.teams.length === 0) ||
                      (motoGPStandingsTab === 'constructors' && motoGPStandings.constructors.length === 0)) && <p className="empty-msg">Cargando posiciones...</p>}
                  </div>
                </>
              ) : isWRC2 ? (
                <>
                  <div className="standings-list wrc-standings">
                    {(wrc2Standings.drivers || []).map((d: any, idx: number) => (
                      <div key={idx} className={`stand-row wrc-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                          {d.codriverOrTeam && <span className="stand-sub">{d.codriverOrTeam}</span>}
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {(wrc2Standings.drivers || []).length === 0 && <p className="empty-msg">Cargando posiciones WRC2...</p>}
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
              ) : isPROCAR4000 ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${procarStandingsTab === 'Clase A' ? 'active' : ''}`} onClick={() => setProcarStandingsTab('Clase A')}>Clase A</button>
                    <button className={`nascar-tab-btn ${procarStandingsTab === 'Clase B' ? 'active' : ''}`} onClick={() => setProcarStandingsTab('Clase B')}>Clase B</button>
                  </div>
                  <div className="standings-list f1-standings">
                    {(procarStandings[procarStandingsTab] || []).map((d, idx) => (
                      <div key={idx} className={`stand-row f1-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                          {d.car && <span className="stand-sub">{d.car}</span>}
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {(procarStandings[procarStandingsTab] || []).length === 0 && <p className="empty-msg">Cargando posiciones PROCAR4000...</p>}
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
                         <div className="stand-info"><span className="stand-name">{d.driver}</span></div>
                         <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {tcpkDrivers.length === 0 && <p className="empty-msg">No hay posiciones disponibles.</p>}
                  </div>
                </>
              ) : isTCPPK ? (
                <>
                  <div className="standings-list tcppk-standings">
                    {tcppkDrivers.map((d, idx) => (
                      <div key={idx} className={`stand-row tcppk-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                         <div className="stand-info"><span className="stand-name">{d.driver}</span></div>
                         <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {tcppkDrivers.length === 0 && <p className="empty-msg">No hay posiciones disponibles.</p>}
                  </div>
                </>
              ) : isTC2000 ? (
                <>
                  <div className="f1-tabs nascar-tabs">
                    <button className={`nascar-tab-btn ${tc2000StandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setTc2000StandingsTab('drivers')}>Pilotos</button>
                    <button className={`nascar-tab-btn ${tc2000StandingsTab === 'teams' ? 'active' : ''}`} onClick={() => setTc2000StandingsTab('teams')}>Equipos</button>
                    <button className={`nascar-tab-btn ${tc2000StandingsTab === 'brands' ? 'active' : ''}`} onClick={() => setTc2000StandingsTab('brands')}>Marcas</button>
                  </div>
                  <div className="standings-list tc2000-standings">
                    {(tc2000StandingsTab === 'drivers' ? tc2000Drivers : 
                      tc2000StandingsTab === 'teams' ? tc2000Teams : 
                      tc2000Brands).length > 0 ? (tc2000StandingsTab === 'drivers' ? tc2000Drivers : 
                                                 tc2000StandingsTab === 'teams' ? tc2000Teams : 
                                                 tc2000Brands).map((d, idx) => (
                      <div key={idx} className={`stand-row tc2000-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                          {d.team && <span className="stand-sub">{d.team}</span>}
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    )) : (
                      <p className="empty-msg">No hay posiciones disponibles.</p>
                    )}
                  </div>
                </>
              ) : isTNC3 ? (
                  <div className="standings-list tnc3-standings">
                    {tnc3Drivers.length > 0 ? tnc3Drivers.map((d, idx) => (
                      <div key={idx} className={`stand-row tnc3-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                          {d.team && <span className="stand-sub">{d.team}</span>}
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    )) : (
                      <p className="empty-msg">No hay posiciones disponibles.</p>
                    )}
                  </div>
              ) : isTNC2 ? (
                  <div className="standings-list tnc3-standings">
                    {tnc2Drivers.length > 0 ? tnc2Drivers.map((d, idx) => (
                      <div key={idx} className={`stand-row wec-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                          {d.team && <span className="stand-sub">{d.team}</span>}
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    )) : (
                      <p className="empty-msg">No hay posiciones disponibles.</p>
                    )}
                  </div>
                ) : isIndy ? (
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
                    {indyDrivers.length === 0 && <p className="empty-msg">No hay posiciones disponibles.</p>}
                  </div>
                ) : isNascar ? (
                  <>
                    <div className="nascar-tabs">
                      <button className={`nascar-tab-btn ${nascarStandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setNascarStandingsTab('drivers')}>Pilotos</button>
                      <button className={`nascar-tab-btn ${nascarStandingsTab === 'manufacturers' ? 'active' : ''}`} onClick={() => setNascarStandingsTab('manufacturers')}>Constructores</button>
                    </div>
                    <div className="standings-list nascar-standings">
                      {nascarStandings[nascarStandingsTab as keyof NascarStandings].map((d, idx) => (
                        <div key={idx} className={`stand-row nascar-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver}</span>
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))}
                      {nascarStandings[nascarStandingsTab as keyof NascarStandings].length === 0 && <p className="empty-msg">No hay posiciones disponibles.</p>}
                    </div>
                  </>
                ) : isNASCART ? (
                  <div className="standings-list nascar-standings">
                    {nascarTStandings.length > 0 ? nascarTStandings.map((d, idx) => (
                      <div key={idx} className={`stand-row nascar-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    )) : (
                      <p className="empty-msg">No hay posiciones disponibles.</p>
                    )}
                  </div>
                ) : isNASCARO ? (
                  <div className="standings-list nascar-standings">
                    {nascarOStandings.map((d, idx) => (
                      <div key={idx} className={`stand-row nascar-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {nascarOStandings.length === 0 && <p className="empty-msg">No se encontraron posiciones NASCAR O'Reilly.</p>}
                  </div>
                ) : (isIMSA && categorySubTab === 'standings') ? (
                  <div className="results-container">
                    <div className="tc-calendar-message results-box">
                      <p className="tc-msg-text">Consulta las posiciones oficiales del campeonato IMSA.</p>
                      <a href="https://www.imsa.com/standings/" target="_blank" rel="noopener noreferrer" className="tc-msg-btn">Ver posiciones</a>
                    </div>
                  </div>
                ) : isWEC ? (
                  <>
                    <div className="f1-tabs nascar-tabs wec-tabs-scroll">
                      <button className={`nascar-tab-btn ${wecStandingsTab === 'h-mfr' ? 'active' : ''}`} onClick={() => setWecStandingsTab('h-mfr')}>Hypercar Mfr</button>
                      <button className={`nascar-tab-btn ${wecStandingsTab === 'h-teams' ? 'active' : ''}`} onClick={() => setWecStandingsTab('h-teams')}>Hypercar Teams</button>
                      <button className={`nascar-tab-btn ${wecStandingsTab === 'h-drivers' ? 'active' : ''}`} onClick={() => setWecStandingsTab('h-drivers')}>Hypercar Drivers</button>
                      <button className={`nascar-tab-btn ${wecStandingsTab === 'gt3-drivers' ? 'active' : ''}`} onClick={() => setWecStandingsTab('gt3-drivers')}>LMGT3 Drivers</button>
                    </div>
                    <div className="standings-list wec-standings">
                      {(wecStandingsTab === 'h-mfr' ? wecStandings.hypercarMfr :
                        wecStandingsTab === 'h-teams' ? wecStandings.hypercarTeams :
                        wecStandingsTab === 'h-drivers' ? wecStandings.hypercarDrivers :
                        wecStandings.lmgt3Drivers).map((d: any, idx: number) => (
                        <div key={idx} className={`stand-row wec-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver || d.team}</span>
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))}
                      {((wecStandingsTab === 'h-mfr' && wecStandings.hypercarMfr.length === 0) ||
                        (wecStandingsTab === 'h-teams' && wecStandings.hypercarTeams.length === 0) ||
                        (wecStandingsTab === 'h-drivers' && wecStandings.hypercarDrivers.length === 0) ||
                        (wecStandingsTab === 'gt3-drivers' && wecStandings.lmgt3Drivers.length === 0)) && !isLoading && 
                        <p className="empty-msg">No se encontraron posiciones WEC.</p>}
                    </div>
                  </>
                ) : isWORLDSBK ? (
                  <>
                    <div className="f1-tabs nascar-tabs">
                      <button className={`nascar-tab-btn ${worldSBKStandingsTab === 'drivers' ? 'active' : ''}`} onClick={() => setWorldSBKStandingsTab('drivers')}>Pilotos</button>
                      <button className={`nascar-tab-btn ${worldSBKStandingsTab === 'manufacturers' ? 'active' : ''}`} onClick={() => setWorldSBKStandingsTab('manufacturers')}>Constructores</button>
                    </div>
                    <div className="standings-list worldsbk-standings">
                      {(worldSBKStandingsTab === 'drivers' ? worldSBKStandings.drivers : worldSBKStandings.manufacturers).map((d: any, idx: number) => (
                        <div key={idx} className={`stand-row worldsbk-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                          <span className="stand-pos">{d.pos}</span>
                          <div className="stand-info">
                            <span className="stand-name">{d.driver || d.team}</span>
                          </div>
                          <span className="stand-pts">{d.points} pts</span>
                        </div>
                      ))}
                      {((worldSBKStandingsTab === 'drivers' && worldSBKStandings.drivers.length === 0) || 
                        (worldSBKStandingsTab === 'manufacturers' && worldSBKStandings.manufacturers.length === 0)) && !isLoading && 
                        <p className="empty-msg">No se encontraron posiciones World SBK.</p>}
                    </div>
                  </>
                ) : isGTWC ? (
                  <div className="standings-list gtwc-standings">
                    {gtwcStandings.map((d, idx) => (
                      <div key={idx} className={`stand-row gtwc-stand-row ${idx < 3 ? `top-${idx + 1}` : ''}`}>
                        <span className="stand-pos">{d.pos}</span>
                        <div className="stand-info">
                          <span className="stand-name">{d.driver}</span>
                        </div>
                        <span className="stand-pts">{d.points} pts</span>
                      </div>
                    ))}
                    {gtwcStandings.length === 0 && !isLoading && <p className="empty-msg">No se encontraron posiciones GT World Challenge.</p>}
                  </div>
                ) : null}
              </>
              )}
            </motion.div>
          )}

          {categorySubTab === 'results' && (
            <motion.div key="cat-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cat-content">
              <div className="results-container">
                {isPROCAR4000 ? (
                  <div className="procar-results-grid">
                    <div className="tc-calendar-message results-box">
                      <p className="tc-msg-text">Consulta los resultados oficiales de la Clase A.</p>
                      <a href="https://www.procar4000.com.ar/procar_4000/index.php/2013-01-31-06-54-32/resultados" target="_blank" rel="noopener noreferrer" className="tc-msg-btn">Clase A</a>
                    </div>
                    <div className="tc-calendar-message results-box">
                      <p className="tc-msg-text">Consulta los resultados oficiales de la Clase B.</p>
                      <a href="https://www.procar4000.com.ar/procar_4000/index.php/2013-01-31-07-00-49/resultados" target="_blank" rel="noopener noreferrer" className="tc-msg-btn">Clase B</a>
                    </div>
                  </div>
                ) : (
                  <div className="tc-calendar-message results-box">
                    <p className="tc-msg-text">Consulta los resultados oficiales del campeonato {catTitle}.</p>
                    <a href={resultsUrl || '#'} target="_blank" rel="noopener noreferrer" className="tc-msg-btn">Ver resultados</a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {categorySubTab === 'news' && (
            <motion.div key="cat-news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cat-content">
              {isCatNewsLoading ? renderLoadingCircle() : (
                <div className="news-feed">
                  {news.map((item, idx) => (
                    <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="news-card-item">
                      <div className="news-card-body">
                        <span className="news-badge">{item.category} | {item.source}</span>
                        <h3 className="news-headline">{item.title}</h3>
                      </div>
                      <ExternalLink size={16} className="news-ext-icon" />
                    </a>
                  ))}
                  {news.length === 0 && <p className="empty-msg">No hay noticias disponibles para {catTitle}.</p>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

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
                <img 
                  src="/logo.png" 
                  alt="Vuelta de Instalación" 
                  className="app-header-logo-centered white-logo" 
                  referrerPolicy="no-referrer"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setView('main');
                    setMainTab('home');
                  }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
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
      <AnimatePresence>
        {showPwaPrompt && (
          <motion.div 
            className="pwa-prompt-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="pwa-prompt-card"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="pwa-prompt-icon">
                <Home size={32} />
              </div>
              <h3>Instala la App</h3>
              <p>Recomendamos agregar el sitio a la pantalla de inicio para una mejor compatibilidad y uso del sistema de notificaciones.</p>
              <button className="pwa-omitir-btn" onClick={() => setShowPwaPrompt(false)}>
                Omitir
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
