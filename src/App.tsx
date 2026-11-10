import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { motion, useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { ArrowDownRight, ArrowUpRight, Asterisk, AudioWaveform, Bot, Braces, Code2, Cpu, Layers3, Menu, Sparkles, X, Zap } from 'lucide-react';
import './styles.css';

const MODEL_URL = `${import.meta.env.BASE_URL}models/charon-mascot.glb`;
const PROFILE = { name: 'YOUR NAME', telegram: '', email: '', github: '' };
const nav = [['Главная','home'],['Обо мне','about'],['Проекты','projects'],['Интересы','interests'],['Контакты','contact']];
const areas = [
  ['AI & Machine Learning',Bot,'Изучаю новые модели, собираю AI-агентов и проверяю, где интеллект может стать полезным инструментом.'],
  ['Digital Products',Layers3,'Превращаю идеи в цифровые продукты: от первого прототипа до продуманного пользовательского опыта.'],
  ['Creative Development',Code2,'Разрабатываю сайты, интерфейсы и экспериментальные системы на стыке дизайна и технологий.'],
  ['Crypto & Analytics',AudioWaveform,'Исследую крипторынок, фьючерсы и алгоритмические подходы к анализу данных.'],
  ['Automation',Zap,'Экспериментирую с автоматизацией процессов, интеграциями и автономными агентами.'],
  ['UI/UX & Design',Sparkles,'Ценю ясную структуру, точную типографику и интерфейсы, в которых форма следует за функцией.']
] as const;
const projects = [
  ['01','Charon','DIGITAL ECOSYSTEM','В разработке','Собственная цифровая идентичность и экосистема продуктов с AI-направлением.','C','violet'],
  ['02','Charon Trading','MARKET INTELLIGENCE','Концепция','Концепция интеллектуальной платформы для анализа криптовалютного рынка и торговых сигналов.','↗','silver'],
  ['03','Experiments','R&D / PLAYGROUND','Постоянно развивается','AI-агенты, автоматизация, веб-разработка и интерактивные цифровые интерфейсы.','✳','dark']
] as const;
const interests = [['Artificial Intelligence',Bot,'Модели · агенты · reasoning'],['Programming',Braces,'Инженерия · архитектура'],['Crypto Analytics',AudioWaveform,'Рынки · данные · гипотезы'],['Product Development',Layers3,'Идея → прототип → продукт'],['Digital Design',Sparkles,'Системы · визуальный язык'],['Automation',Zap,'Workflow · интеграции'],['New Technologies',Cpu,'Исследования · эксперименты']] as const;

function Mascot() {
  const { scene } = useGLTF(MODEL_URL);
  const ref = useRef<THREE.Group>(null);
  useEffect(() => { scene.traverse(o => { if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).castShadow = true; (o as THREE.Mesh).receiveShadow = true; } }); }, [scene]);
  useFrame(({ pointer, clock }, dt) => { if (!ref.current) return; ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, pointer.x*.22 + Math.sin(clock.elapsedTime*.22)*.12, 3, dt); ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -pointer.y*.1, 3, dt); ref.current.position.y = Math.sin(clock.elapsedTime*.7)*.045; });
  return <group ref={ref} position={[0,-1.75,0]} scale={1.03}><primitive object={scene}/></group>;
}
useGLTF.preload(MODEL_URL);

function Stage() {
  return <div className="stage"><div className="orbit"/><div className="orbit orbit2"/><span className="stage-tag">✳ CORE KEEPER / ORIGINAL 3D</span><Canvas shadows dpr={[1,1.6]} camera={{position:[4.2,2.1,7.2],fov:33}}><ambientLight intensity={.85}/><directionalLight position={[4,7,5]} intensity={2.4} castShadow/><spotLight position={[-5,3,2]} intensity={38} color="#b8a4ff" angle={.5} penumbra={1}/><pointLight position={[0,1,-4]} intensity={18} color="#9b7cff"/><Mascot/><ContactShadows position={[0,-1.72,0]} opacity={.32} scale={5.8} blur={2.8}/><Environment preset="studio"/><OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI/2.8} maxPolarAngle={Math.PI/1.8} rotateSpeed={.55}/></Canvas><span className="stage-bottom">DRAG TO ROTATE · ORIGINAL GEOMETRY</span></div>;
}

function Header() {
 const [open,setOpen]=useState(false); const [active,setActive]=useState('home');
 useEffect(()=>{const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setActive(e.target.id)}),{rootMargin:'-35% 0px -55% 0px'});nav.forEach(([,id])=>{const el=document.getElementById(id);if(el)o.observe(el)});return()=>o.disconnect()},[]);
 return <header className="topbar"><a className="brand" href="#home"><b>✳</b> CHARON<span>.</span></a><nav className={open?'nav open':'nav'}>{nav.map(([label,id])=><a key={id} className={active===id?'active':''} href={'#'+id} onClick={()=>setOpen(false)}>{label}</a>)}</nav><a className="availability" href="#contact"><i/> OPEN TO IDEAS ↗</a><button className="menu" onClick={()=>setOpen(!open)} aria-label="Меню">{open?<X/>:<Menu/>}</button></header>
}
function App() {
 const reduce=useReducedMotion(); const [area,setArea]=useState(0); const [world,setWorld]=useState('AI');
 const reveal={initial:{opacity:0,y:reduce?0:24},whileInView:{opacity:1,y:0},viewport:{once:true,amount:.15},transition:{duration:.7,ease:[.22,1,.36,1] as const}};
 return <div className="shell"><Header/><main>
 <section className="hero wrap" id="home"><div className="hero-meta"><span>INDEPENDENT DIGITAL CREATOR</span><span>STOCKHOLM / ONLINE</span></div><div className="hero-grid"><div className="hero-copy"><div className="eyebrow">PERSONAL DIGITAL IDENTITY <i/></div><motion.h1 initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.8}}>Создаю то,<br/>чего <em>ещё</em> нет<span>.</span></motion.h1><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4}}>Технологии, искусственный интеллект, цифровые продукты и эксперименты на пересечении идей и разработки.</motion.p><div className="hero-actions"><a className="primary" href="#projects">Исследовать проекты <ArrowUpRight size={16}/></a><a className="textlink" href="#about">Узнать обо мне <ArrowDownRight size={16}/></a></div><div className="owner"><i/><div><small>THE PERSON BEHIND THE SYSTEM</small><b>{PROFILE.name}<span>.</span></b></div></div></div><motion.div className="visual" initial={{opacity:0,scale:.94}} animate={{opacity:1,scale:1}} transition={{delay:.2,duration:1}}><Stage/></motion.div></div><div className="hero-bottom"><span>SCROLL TO EXPLORE</span><i/><span>01 — 06</span></div></section>
 <section className="manifesto"><div className="manifesto-inner"><small>01 / POINT OF VIEW</small><p>Не просто использую технологии — <em>экспериментирую, создаю</em> и превращаю идеи в реальные продукты.</p><Asterisk/></div></section>
 <section className="section wrap" id="about"><div className="heading" {...reveal}><div><small>02 / ABOUT ME</small><h2>Немного<br/><em>обо мне.</em></h2></div><p>Любопытство — это двигатель.<br/>Создание — способ думать.</p></div><div className="about-grid"><div className="statement"><small>A MINDSET, NOT A TITLE</small><p>Мне интересно разбираться, <b>как устроено новое</b>, соединять инструменты и находить неожиданные способы их применения.</p><p>От AI-экспериментов и разработки интерфейсов до анализа рынков — я предпочитаю проверять идеи на практике и собирать из них работающие системы.</p><div className="signature">ALWAYS IN BETA <span>✳</span></div></div><div className="areas"><div className="area-top">AREAS OF CURIOSITY <span>SELECT TO EXPLORE ↘</span></div>{areas.map(([title,Icon],i)=><button key={title} className={area===i?'area active':'area'} onMouseEnter={()=>setArea(i)} onFocus={()=>setArea(i)} onClick={()=>setArea(i)}><small>0{i+1}</small><Icon size={17}/><b>{title}</b><ArrowUpRight size={15}/></button>)}<div className="area-detail"><small>0{area+1} / EXPLORE</small><p>{areas[area][2]}</p></div></div></div></section>
 <section className="projects"><div className="wrap"><div className="heading" {...reveal}><div><small>03 / SELECTED WORK & IDEAS</small><h2>То, что<br/><em>я создаю.</em></h2></div><p>Не коллекция кейсов.<br/>Живая карта экспериментов.</p></div><div className="project-list">{projects.map(([no,name,type,status,desc,mark,tone],i)=><motion.article className={'project '+tone} key={no} {...reveal} transition={{duration:.7,delay:i*.07}}><div className="project-top">{no} / {type}<span><i/> {status}</span></div><div className="project-mid"><b className="project-mark">{mark}</b><div><h3>{name}</h3><p>{desc}</p></div><a href="#contact" aria-label={'Подробнее '+name}><ArrowUpRight/></a></div><div className="project-foot">CHARON DIGITAL LAB <span>CONCEPT / BUILD / ITERATE</span></div></motion.article>)}</div></div></section>
 <section className="world"><div className="wrap world-grid"><div className="world-copy" {...reveal}><small>04 / MY DIGITAL WORLD</small><h2>Несколько миров.<br/><em>Один интерес.</em></h2><p>Пространство идей, инструментов и направлений, которые пересекаются в моих проектах.</p></div><div className="universe"><div className="ring"/><div className="ring ring2"/><div className="core">✳<small>CHARON<br/>IDENTITY</small></div>{['AI','CODE','TRADING','DESIGN','AUTOMATION','EXPERIMENTS'].map((v,i)=><button key={v} className={'node n'+i+(world===v?' chosen':'')} onClick={()=>setWorld(v)}><i/>{v}</button>)}<div className="readout"><small>NOW EXPLORING / 0{['AI','CODE','TRADING','DESIGN','AUTOMATION','EXPERIMENTS'].indexOf(world)+1}</small><b>{world}</b><p>{({AI:'Новые модели и автономные системы как расширение человеческих возможностей.',CODE:'Код как материал для создания гибких цифровых инструментов.',TRADING:'Рыночные данные, закономерности и дисциплина проверки гипотез.',DESIGN:'Визуальные системы, где ясность, ритм и функция работают вместе.',AUTOMATION:'Связи между инструментами, которые освобождают время.',EXPERIMENTS:'Место для быстрых прототипов и неожиданных вопросов.'} as Record<string,string>)[world]}</p></div></div></div></section>
 <section className="section wrap" id="interests"><div className="heading" {...reveal}><div><small>05 / CURIOSITY MAP</small><h2>Области<br/><em>интереса.</em></h2></div><p>Исследую глубже.<br/>Связываю неожиданное.</p></div><div className="interest-grid">{interests.map(([title,Icon,sub],i)=><motion.article className="interest" key={title} {...reveal} transition={{duration:.65,delay:i*.04}}><small>0{i+1}</small><Icon/><h3>{title}</h3><p>{sub}</p><ArrowUpRight className="interest-arrow"/></motion.article>)}</div></section>
 <section className="contact wrap" id="contact"><div className="contact-top"><small>06 / OPEN CHANNEL</small><span>IDEAS WELCOME<br/>SIGNAL: ACTIVE</span></div><div className="contact-main"><h2>Есть интересная<br/><em>идея?</em></h2><div><p>Открыт к интересным проектам, экспериментам и технологическим решениям.</p><a className="primary" href={PROFILE.email?'mailto:'+PROFILE.email:'#contact-links'}>Начать разговор <ArrowUpRight size={16}/></a></div></div><div className="contact-foot" id="contact-links"><b>✳ CHARON.<small>PERSONAL DIGITAL IDENTITY</small></b><div><a href={PROFILE.telegram||'#contact-links'}>TELEGRAM ↗</a><a href={PROFILE.email?'mailto:'+PROFILE.email:'#contact-links'}>EMAIL ↗</a><a href={PROFILE.github||'#contact-links'}>GITHUB ↗</a></div><small>© 2026 / BUILT WITH CURIOSITY</small></div></section>
 </main><footer className="footer"><span>DESIGNED TO EXPLORE WHAT'S NEXT.</span><span>CHARON ✳ DIGITAL IDENTITY</span><span>ORIGINAL MASCOT / GLB</span></footer></div>;
}
export default App;