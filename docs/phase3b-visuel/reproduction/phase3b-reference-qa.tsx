// Isolated comparison adapter: unmodified frozen UI and public session API.
import React from 'react';import {createRoot} from 'react-dom/client';import './src/styles.css';
import cases from './phase3b-cases.json';import {TournamentFlow} from './src/components/roundr/tournament';
import {createSession,updateSession} from './src/lib/roundr/session';
const spec=cases.find(c=>c.id===new URLSearchParams(location.search).get('scenario')) as any;
if(spec){Date.now=()=>spec.now;createSession(spec.mode,spec.reference.d.title,spec.reference.cfg,spec.reference.d);updateSession(s=>({...s,clock:spec.reference.clock}));}
createRoot(document.getElementById('root')!).render(spec?<div className="device"><style>{`*,*::before,*::after{animation:none!important;transition:none!important}`}</style><TournamentFlow onExit={()=>{}} onSettings={()=>{}}/></div>:<div>{cases.map(c=><p key={c.id}><a href={'/?scenario='+c.id}>{c.id}</a></p>)}</div>);
